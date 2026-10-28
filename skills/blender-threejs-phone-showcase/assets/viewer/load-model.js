import { ObjectLoader } from 'three';
import { COMPONENTS } from './model.js';
import { finishRole } from './finishes.js';

export async function loadPhoneModel(){
  const response=await fetch('./models/phone.scene.json.gz');
  if(!response.ok)throw new Error(`Scene request failed: ${response.status}`);
  const json=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
  const root=await new ObjectLoader().parseAsync(json),parts=new Map(),finishMaterials=[];
  // Native Three.js scene data already uses millimetres. Do not scale it again.
  root.traverse(object=>{
    if(object.isMesh){
      object.material=Array.isArray(object.material)?object.material.map(m=>m.clone()):object.material.clone();
      for(const mat of Array.isArray(object.material)?object.material:[object.material]){
        const role=finishRole(mat.name);
        if(role){mat.userData.finishRole=role;finishMaterials.push(mat);}
      }
    }
    const id=object.userData.component_id;
    if(id){const meta=COMPONENTS.find(p=>p.id===id);if(meta)parts.set(id,{...meta,node:object,offset:object.userData.explode_offset_mm||meta.offset});}
  });
  if(parts.size!==25)throw new Error(`Scene has ${parts.size} components; expected 25.`);
  for(const part of parts.values())part.node.traverse(o=>{if(o.isMesh)o.userData.componentId=part.id;});
  root.updateMatrixWorld(true);return{root,parts,finishMaterials};
}
