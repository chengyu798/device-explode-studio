#!/usr/bin/env node
/** Observable checks against the actual exported model and visible viewer. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);function option(key,fallback){const i=args.indexOf(key);return i<0?fallback:args[i+1];}
const url=option('--url','http://127.0.0.1:4173/');const out=path.resolve(option('--out',path.join(root,'qa')));await fs.mkdir(out,{recursive:true});
const mod=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(mod?(path.isAbsolute(mod)?pathToFileURL(mod).href:mod):'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const errors=[],external=[];let report;
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const origin=new URL(url).origin;
 await page.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)&&new URL(u).origin!==origin){external.push(u);return route.abort();}return route.continue();});
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.inside17?.snapshot().componentCount===25);
 const snap=()=>page.evaluate(()=>window.inside17.snapshot());const initial=await snap();
 assert.equal(initial.finish,'silver');assert.equal(initial.explosion,0);assert.equal(initial.visible.length,25);
 const palettes=JSON.parse(await fs.readFile(path.join(root,'dist/data/finish-palettes.json'),'utf8'));
 const cfg=JSON.parse(await fs.readFile(path.join(root,'profile.json'),'utf8'));
 const rays=await page.evaluate(async specs=>{
  const {loadBlenderModel}=await import('./load-blender.js');const THREE=await import('three');const m=await loadBlenderModel();m.root.updateMatrixWorld(true);
  const controls=specs.map(s=>{const hit=new THREE.Raycaster(new THREE.Vector3(s.side*60,s.y_mm,0),new THREE.Vector3(-s.side,0,0)).intersectObject(m.root,true)[0];return{expected:'I17_'+s.name+(s.name==='China_Dual_SIM_Tray'?'_Cap':'_Rounded_Button'),actual:hit?.object.name,x:hit?.point.x,expected_x:s.side*s.outer_x_mm,role:hit?.object.material.userData.finishRole};});
  const logos=[];m.root.traverse(o=>{if(o.isMesh&&/Silver_Logo_Inlay/.test(o.material.name)){const position=o.geometry.getAttribute('position');const index=o.geometry.index;const i=index?index.getX(0):0;const j=index?index.getX(1):1;const k=index?index.getX(2):2;const center=new THREE.Vector3().fromBufferAttribute(position,i).add(new THREE.Vector3().fromBufferAttribute(position,j)).add(new THREE.Vector3().fromBufferAttribute(position,k)).divideScalar(3).applyMatrix4(o.matrixWorld);const ray=new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,0,-10)),new THREE.Vector3(0,0,1));const hit=ray.intersectObject(m.root,true)[0];logos.push({expected:o.name,actual:hit?.object.name});}});
  m.root.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});return{controls,logos};
 },cfg.controls);
 for(const r of rays.controls){assert.equal(r.actual,r.expected);assert.ok(Math.abs(r.x-r.expected_x)<.002)}
 assert.ok(rays.logos.length>=2,'Missing logo body or leaf');for(const r of rays.logos)assert.equal(r.actual,r.expected,'Logo occluded from rear');
 const finishes={};
 for(const finish of ['silver','orange','blue']){
  await page.locator(`[data-finish="${finish}"]`).click();const state=await snap();assert.equal(state.finish,finish);
  for(const[role,value]of Object.entries(palettes[finish].roles))assert.deepEqual(state.finishRoles[role],{color:value.color,roughness:value.roughness,metalness:value.metalness},`${finish}/${role}`);
  finishes[finish]=state.finishRoles;
  for(const view of ['back','bottom','right']){await page.locator(`#${view}-view`).click();await page.waitForTimeout(180);assert.equal((await snap()).visible.length,25);await page.screenshot({path:path.join(out,`${finish}-${view}.png`)});}
 }
 await page.locator('[data-finish="silver"]').click();assert.deepEqual((await snap()).finishRoles,initial.finishRoles);
 await page.locator('#left-view').click();await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'silver-left.png')});
 await page.locator('[data-stage="1"]').click();await page.waitForFunction(()=>window.inside17.snapshot().explosion>.9999);await page.screenshot({path:path.join(out,'exploded.png')});
 assert.equal((await snap()).visible.length,25);
 await page.locator('[data-part="rear_camera"] .part-select').click();await page.locator('#isolate').click();assert.deepEqual((await snap()).visible,['rear_camera']);
 await page.locator('#reset').click();await page.waitForFunction(()=>window.inside17.snapshot().explosion===0);assert.equal((await snap()).isolated,false);
 await page.locator('[data-part="battery"] .visibility-button').click();assert.ok((await snap()).hidden.includes('battery'));
 await page.locator('[data-part="battery"] .visibility-button').click();assert.equal((await snap()).visible.length,25);
 await page.locator('#search').fill('电池');assert.ok(await page.locator('.part-row').count()>0);assert.ok(await page.locator('.part-row').count()<25);await page.locator('#search').fill('');assert.equal(await page.locator('.part-row').count(),25);
 const download=page.waitForEvent('download');await page.locator('#export').click();const image=await download;const imagePath=path.join(out,'export.png');await image.saveAs(imagePath);const raw=await fs.readFile(imagePath);assert.equal(raw.subarray(1,4).toString(),'PNG');assert.ok(raw.length>10000);
 await page.setViewportSize({width:390,height:844});await page.locator('#right-view').click();await page.waitForTimeout(180);assert.equal((await snap()).visible.length,25);assert.ok(await page.locator('canvas').first().isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 for(const name of ['button-audit.html','finish-audit.html']){await page.goto(new URL(name,url).href,{waitUntil:'networkidle'});assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).length),0);}
 assert.deepEqual(external,[],'Unexpected network dependencies');assert.deepEqual(errors,[]);
 report={passed:true,components:25,default_assembled:true,finishes,frontmost_control_rays:rays.controls,logo_rays:rays.logos,silver_roundtrip:true,explode_isolate_hide_search_reset:true,png_export:true,mobile:true,audit_images_loaded:true,external_requests:external,page_errors:errors};
 console.log(JSON.stringify({passed:true,components:25,colors:3,roles_per_color:7,controls:rays.controls.length,logos:rays.logos.length,mobile:true,page_errors:errors}));
}catch(e){report={passed:false,error:e.stack,page_errors:errors,external_requests:external};throw e;}
finally{if(report)await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
