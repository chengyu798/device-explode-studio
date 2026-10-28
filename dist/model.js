import * as THREE from 'three';

// Units: millimetres. +Z faces the display, +Y points to the top edge.
// Only nominal body dimensions are sourced measurements. All internal geometry is approximate.
export const SOURCE = 'https://support.apple.com/en-my/124264';
export const BODY = { width: 78, height: 163.4, depth: 8.75 };
const mm = (px, py) => [(px - 440) * .13, (750 - py) * .13];
const ink = '#181b1d';

export const COMPONENTS = [
  {id:'display',name:'显示屏组件',en:'DISPLAY ASSEMBLY',section:'外部与密封',color:'#8c969e',anchor:[-10,42,4.5],offset:[-12,16,125],start:0,end:.6,label:true,description:'显示屏位于整机正面，包括玻璃、OLED 面板与显示排线。展开后可从背面观察金属支撑层。',estimate:'屏幕圆角、玻璃厚度、排线和灵动岛几何为近似；壁纸为项目自制。',code:'661-56050'},
  {id:'display_adhesive',name:'显示屏胶条',en:'DISPLAY ADHESIVE',section:'外部与密封',color:'#776f63',anchor:[-32,45,3.3],offset:[-8,12,105],start:.04,end:.85,description:'沿机身边缘布置的显示屏密封胶条，位于屏幕与机壳之间。',estimate:'胶条宽度、厚度与局部缺口为示意。',code:'923-12860'},
  {id:'battery',name:'电池与金属托盘',en:'BATTERY & SUPPORT PLATE',section:'核心组件',color:'#7e8684',anchor:[0,-18,2.6],offset:[0,-4,76],start:.17,end:.95,label:true,description:'实体 SIM 版本电池与支撑托盘作为同一个维修组件展示。托盘覆盖大部分内部区域，移开后可看到主板与电池腔。',estimate:'托盘轮廓依据 pSIM 照片简化；电芯厚度、托盘开孔、紧固点和隐藏表面为估算。',code:'661-56049',source:'https://support.apple.com/en-my/123387'},
  {id:'rear_camera',name:'后置摄像头组件',en:'REAR CAMERA ARRAY',section:'核心组件',color:'#a1a8a9',anchor:[24,58,1.7],offset:[29,8,43],start:.3,end:1,label:true,description:'后置摄像头组件位于机身上方一侧，包含主摄、超广角和长焦模块。镜头朝向背面，正面可见的是模块外壳与屏蔽层。',estimate:'各模块外壳、镜头尺寸、棱镜内部和柔性排线均为近似，不模拟光学结构。',code:'661-56052',source:'https://support.apple.com/en-my/123388'},
  {id:'front_camera',name:'前置摄像头组件',en:'FRONT CAMERA / FACE ID',section:'核心组件',color:'#899390',anchor:[1,74,1.5],offset:[-1,29,54],start:.3,end:1,description:'前置摄像头组件位于顶部，包含前置成像与面容识别相关组件。',estimate:'传感器、孔位和模组厚度均为简化估算。',code:'661-56051'},
  {id:'logic_board',name:'主板组件',en:'LOGIC BOARD',section:'核心组件',color:'#5e7b69',anchor:[-7,33,.6],offset:[-29,5,28],start:.28,end:1,label:true,description:'主板位于电池托盘下方，连接摄像头、屏幕、供电与其他组件。此模型采用国行主板分支，不加入美版毫米波组件。',estimate:'主板轮廓与屏蔽罩经简化；芯片、焊盘和板级元件位置仅作示意，不是 PCB 布局图。',code:'CH 系列 · 容量未指定',source:'https://support.apple.com/en-my/123395'},
  {id:'top_speaker',name:'顶部扬声器',en:'TOP SPEAKER',section:'声音与触觉',color:'#6c7375',anchor:[-23,65,1.4],offset:[-22,15,45],start:.26,end:1,description:'顶部扬声器位于上方角部，与顶部声学开口配合工作。',estimate:'腔体外形、内部结构和尺寸经简化。',code:'923-13581'},
  {id:'bottom_speaker',name:'底部扬声器',en:'BOTTOM SPEAKER',section:'声音与触觉',color:'#676e72',anchor:[-23,-65,1],offset:[-28,-18,34],start:.33,end:1,description:'实体 SIM 版本的底部扬声器位于机身下方一侧，通过底边声孔发声。',estimate:'腔体、胶垫、支架和声道为近似。',code:'923-13580'},
  {id:'taptic_engine',name:'Taptic Engine',en:'HAPTIC ENGINE',section:'声音与触觉',color:'#9a9b93',anchor:[20,-68,1.1],offset:[31,-14,33],start:.33,end:1,label:true,description:'触觉反馈组件位于机身底部，产生系统交互所需的振动反馈。',estimate:'外壳轮廓参考官方内部图；厚度、孔位和内部振子结构未实测。',code:'923-13583'},
  {id:'main_microphone',name:'主麦克风',en:'MAIN MICROPHONE',section:'声音与触觉',color:'#96866c',anchor:[20,-77,.6],offset:[29,-33,22],start:.36,end:1,description:'主麦克风位于底边，配合密封垫和声学开口采集声音。',estimate:'封装、支架、声孔与排线为示意。',code:'923-13582'},
  {id:'usb_c_connector',name:'USB-C 接口组件',en:'USB-C CONNECTOR',section:'连接与机身',color:'#a6a49b',anchor:[0,-76,.8],offset:[0,-25,29],start:.3,end:1,description:'USB-C 接口位于底边中央，接口与两条上行排线组成独立组件。',estimate:'金属壳、触点、排线走向与折弯半径均为简化估算。',code:'pSIM · 923-13585/86/87'},
  {id:'sim_assembly',name:'实体 SIM 组件',en:'PHYSICAL SIM ASSEMBLY',section:'连接与机身',color:'#7a817c',anchor:[-25,-46,-.1],offset:[-28,-8,17],start:.35,end:1,description:'国行双 nano-SIM 对应的实体 SIM 组件位于机身侧部，保留独立卡托。',estimate:'组件与卡槽形状、内部触点及位置深度为估算。'},
  {id:'sim_tray',name:'SIM 卡托',en:'SIM TRAY',section:'连接与机身',color:'#d49164',anchor:[-38,-42,-.2],offset:[-32,-8,0],start:.12,end:.8,description:'卡托从侧面抽出；与实体 SIM 组件分开建模。',estimate:'卡槽与卡托孔位、尺寸和细节为近似。',code:'923-13650/51/52'},
  {id:'enclosure',name:'铝金属机壳',en:'ALUMINIUM ENCLOSURE',section:'连接与机身',color:'#d49164',anchor:[30,-64,-.5],offset:[0,0,0],start:0,end:1,label:true,description:'一体式铝金属机壳承载内部组件，背部顶部为横向摄像头平台。侧边保留操作按钮、音量键与相机控制的简化外形。',estimate:'标称长宽厚来自官方规格；圆角、平台高度、局部开口、螺丝柱、热管理细节为估算。',code:'国行 CH923-13782/83/84'},
  {id:'back_glass',name:'背部玻璃与充电组件',en:'BACK GLASS ASSEMBLY',section:'外部与密封',color:'#a77450',anchor:[-16,-30,-4],offset:[3,-16,-45],start:.3,end:1,label:true,description:'背部玻璃位于机壳后侧的下方区域。此视图将无线充电线圈、磁吸环等归入背部组件展示。',estimate:'玻璃轮廓、内部线圈、磁吸环、连接排线及其相对位置均为简化示意。',code:'661-56053/54/55'},
  {id:'back_glass_adhesive',name:'背部玻璃胶条',en:'BACK GLASS ADHESIVE',section:'外部与密封',color:'#867d6c',anchor:[-32,-40,-3.5],offset:[2,-10,-27],start:.3,end:1,description:'背部玻璃与机壳之间的周边密封胶条。',estimate:'胶条宽度与厚度为近似。',code:'923-12859'},
  {id:'display_connector_cowling',name:'显示屏连接器盖板',en:'DISPLAY CONNECTOR COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[-20,30,1.5],offset:[-57,2,54],start:.18,end:1,description:'覆盖显示屏排线连接器的保护盖板。',estimate:'盖板厚度、孔位和轮廓均为简化。',code:'923-13592'},
  {id:'battery_connector_cowling',name:'电池连接器盖板',en:'BATTERY CONNECTOR COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[-11,24,2.8],offset:[-46,-9,63],start:.18,end:1,description:'固定和保护电池排线连接位置的盖板。',estimate:'盖板、折弯与孔位均为示意。',code:'923-13994'},
  {id:'camera_connector_cowling',name:'后摄连接器盖板',en:'CAMERA CONNECTOR COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[23,31,1.8],offset:[51,12,57],start:.22,end:1,description:'覆盖后置摄像头排线连接器的金属盖板。',estimate:'外形、厚度与紧固孔位置为近似。',code:'923-13705'},
  {id:'front_camera_connector_cowling',name:'前摄连接器盖板',en:'FRONT CAMERA COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[-19,46,1.8],offset:[-49,23,65],start:.22,end:1,description:'覆盖前置摄像头连接器的金属盖板。',estimate:'外形、厚度与紧固孔位置为近似。',code:'923-13704'},
  {id:'logic_board_connector_cowling',name:'主板连接器盖板',en:'LOGIC BOARD COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[-18,43,1.6],offset:[-53,9,43],start:.23,end:1,description:'主板连接器区域的保护盖板。',estimate:'轮廓、折弯、孔位为示意。',code:'923-13593'},
  {id:'back_glass_connector_cowling',name:'背板连接器盖板',en:'BACK GLASS COWLING',section:'盖板与支撑件',color:'#b7b8b1',anchor:[-8,40,-1.2],offset:[-40,15,-16],start:.32,end:1,description:'背部玻璃组件与主板连接位置的盖板。',estimate:'位置深度、尺寸与孔位为估算。',code:'923-13702'},
  {id:'top_speaker_grille',name:'顶部扬声器格栅',en:'TOP SPEAKER GRILLE',section:'盖板与支撑件',color:'#909991',anchor:[-2,79,2.6],offset:[-3,33,64],start:.25,end:1,description:'顶部声学开口内的格栅。',estimate:'格栅孔径、间距、层数和厚度为示意。',code:'923-13653'},
  {id:'battery_spacer',name:'电池间隔件',en:'BATTERY SPACER',section:'盖板与支撑件',color:'#909991',anchor:[-28,30,1.8],offset:[-60,-10,34],start:.26,end:1,description:'电池与周边结构之间的间隔支撑件。',estimate:'局部位置和形状参照通用爆炸图，国行适配细节尚未实物核验。'},
  {id:'logic_board_spacer',name:'主板间隔件',en:'LOGIC BOARD SPACER',section:'盖板与支撑件',color:'#909991',anchor:[-23,21,.8],offset:[-47,-19,25],start:.3,end:1,description:'主板区域的间隔与定位支撑件。',estimate:'轮廓、厚度与装配间隙为估算。'}
];

function outline(w,h,r, path=new THREE.Shape()) {
  const x=-w/2,y=-h/2; r=Math.min(r,w/2,h/2);
  path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);
  path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);
  path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);return path;
}
function metal(color,roughness=.43,metalness=.82){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function shapeMesh(shape,depth,mat,bevel=.12){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:10});g.translate(0,0,-depth/2);return new THREE.Mesh(g,mat);}
function rect(parent,w,h,d,x,y,z,mat,r=.7,bevel=.08){const mesh=shapeMesh(outline(w,h,r),d,mat,bevel);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function polygon(parent,points,d,z,mat){const shape=new THREE.Shape();points.forEach((v,i)=>{const p=mm(...v);i?shape.lineTo(...p):shape.moveTo(...p)});shape.closePath();const m=shapeMesh(shape,d,mat);m.position.z=z;parent.add(m);return m;}
function circle(parent,r,d,x,y,z,mat){const g=new THREE.CylinderGeometry(r,r,d,48);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);parent.add(m);return m;}
function ring(parent,r,t,d,x,y,z,mat){const s=new THREE.Shape();s.absarc(0,0,r,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,r-t,0,Math.PI*2,true);s.holes.push(hole);const m=shapeMesh(s,d,mat,0);m.position.set(x,y,z);parent.add(m);return m;}
function rectRing(parent,w,h,r,t,d,x,y,z,mat){const s=outline(w,h,r);s.holes.push(outline(w-2*t,h-2*t,Math.max(.5,r-t),new THREE.Path()));const m=shapeMesh(s,d,mat,0);m.position.set(x,y,z);parent.add(m);return m;}
function screw(parent,x,y,z,mat,r=.65){circle(parent,r,.26,x,y,z,mat);rect(parent,r*1.2,.17,.02,x,y,z+.15,metal('#44494b',.6,.2),.03,0);rect(parent,.17,r*1.2,.02,x,y,z+.15,metal('#44494b',.6,.2),.03,0);}
function printTexture(text,{w=512,h=256,color='#bbbdb8',background=null,size=28}={}){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,w,h)}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${size}px sans-serif`;text.split('\n').forEach((t,i,a)=>ctx.fillText(t,w/2,h/2+(i-(a.length-1)/2)*size*1.5));const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return map;}
function decal(parent,w,h,x,y,z,map){if(!map)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
function screenTexture(){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=600;c.height=1290;const ctx=c.getContext('2d');ctx.fillStyle='#151e2c';ctx.fillRect(0,0,600,1290);const grad=ctx.createRadialGradient(390,500,10,300,700,900);grad.addColorStop(0,'#fdc080');grad.addColorStop(.3,'#c76132');grad.addColorStop(.58,'#573d3d');grad.addColorStop(.85,'#17202c');ctx.fillStyle=grad;ctx.fillRect(0,0,600,1290);ctx.save();ctx.translate(300,660);ctx.rotate(-.3);for(let i=0;i<4;i++){const g=ctx.createLinearGradient(-450,-250,350,300);g.addColorStop(0,i%2?'#342d36':'#f3ad70');g.addColorStop(.47,i%2?'#bd5f37':'#d77d47');g.addColorStop(1,'#29313e');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(110-i*75,90+i*130,480-i*20,110,0,0,Math.PI*2);ctx.fill()}ctx.restore();ctx.fillStyle='#fff4eb';ctx.textAlign='center';ctx.font='400 23px sans-serif';ctx.fillText('Friday, October 23',300,150);ctx.font='500 112px sans-serif';ctx.fillText('9:41',300,263);ctx.fillStyle='#e5c7ac90';ctx.font='500 13px sans-serif';ctx.fillText('INSIDE 17  /  STRUCTURE STUDY',300,1210);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return map;}

export function buildPhone(){
  const root=new THREE.Group();root.name='A3527_structure_reconstruction';
  const parts=new Map();const finishMaterials=[];
  const aluminium=metal('#cc8155',.39,.86);finishMaterials.push(aluminium);
  const rim=metal('#c6c8c4',.29,.92), dark=metal(ink,.7,.15), graphite=metal('#2d3233',.64,.42), shield=metal('#8d9593',.42,.85), pcb=metal('#243932',.57,.35), gold=metal('#a78649',.35,.88), copper=metal('#a27c50',.48,.85);
  const rearGlass=new THREE.MeshPhysicalMaterial({color:'#b97950',metalness:.35,roughness:.36,clearcoat:.65,clearcoatRoughness:.28});finishMaterials.push(rearGlass);
  const make=(id)=>{const node=new THREE.Group();node.name=id;const meta=COMPONENTS.find(x=>x.id===id);node.userData={componentId:id,accuracy:'estimated',source:meta.source||SOURCE};root.add(node);parts.set(id,{...meta,node});return node;};

  let g=make('enclosure');
  rectRing(g,78,163.4,11,2.05,7.35,0,0,-.35,aluminium);
  rectRing(g,73.6,159,9,1,.6,0,0,3.05,rim);
  const deck=outline(77,43,10);[[2,58,10],[25,68,8],[25,46,9]].forEach(([x,y,r])=>{const p=new THREE.Path();p.absarc(x,y-58,r,0,Math.PI*2,true);deck.holes.push(p)});
  const deckMesh=shapeMesh(deck,2.4,aluminium,.1);deckMesh.position.set(0,58,-5.1);g.add(deckMesh);
  rect(g,72,2,.6,0,31,-3.8,rim,.3);
  for(const x of [-35.5,35.5])for(const y of [-70,-53,-35,-8,19,43,66]){rect(g,2.7,4.4,1,x,y,.6,rim,.5);screw(g,x,y,1.3,rim,.52)}
  rect(g,1.6,15,2.4,39,40,0,aluminium,.7);rect(g,1.6,16,2.6,39,8,0,aluminium,.7);
  rect(g,1.5,7,2,-39,57,0,aluminium,.6);for(const y of [39,24])rect(g,1.5,10,2,-39,y,0,aluminium,.6);
  for(const x of [-1,1]){for(let i=0;i<6;i++){const m=circle(g,.48,.12,x*(12+i*2.6),0,0,dark);m.rotation.x=Math.PI/2;m.position.set(x*(12+i*2.6),-81.73,-.25)}}
  const port=rect(g,9,3,.05,0,0,0,dark,1.2,0);port.rotation.x=Math.PI/2;port.position.set(0,-81.74,-.2);
  for(const x of [-39.04,39.04])for(const y of [-58,67])rect(g,.15,1.3,6.4,x,y,-.3,metal('#aaaea7',.72,.2),.1,0);
  for(const [x,y] of [[-30,75],[32,76],[-31,-73],[31,-73]])screw(g,x,y,1.3,rim,.8);

  g=make('back_glass');rect(g,72.4,109.7,.75,0,-25.4,-4,rearGlass,9,0);
  circle(g,21.4,.35,0,-18,-3.4,dark);for(let i=0;i<12;i++)ring(g,18.8-i*.42,.2,.06,0,-18,-3.15,copper);
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2;const m=rect(g,2.6,2.7,.18,Math.cos(a)*22.8,Math.sin(a)*22.8-18,-3.1,rim,.3,0);m.rotation.z=a;}
  rect(g,7,9,.2,0,-46,-3.2,dark,1);rect(g,3,26,.12,-8,12,-3.2,copper,.2);
  const rearText=decal(g,15,5,0,-56,-4.39,printTexture('iPhone',{color:'#e3c7b1',size:35}));if(rearText)rearText.rotation.y=Math.PI;
  g=make('back_glass_adhesive');rectRing(g,72.5,109.8,9,1.15,.08,0,-25.4,-3.49,metal('#5b574e',.95,.1));

  g=make('display');rect(g,77.1,162.1,1.15,0,0,3.8,dark,10.6,0);
  rect(g,73.7,158.6,.13,0,0,3.14,shield,9.6,0);
  const panel=rect(g,73.2,157.7,.03,0,0,4.4,new THREE.MeshStandardMaterial({color:'#eee4db',roughness:.26,metalness:.12,emissive:'#ffffff',emissiveIntensity:.5}),9.3,0);
  const wallpaper=screenTexture();if(wallpaper){panel.material.map=wallpaper;panel.material.emissiveMap=wallpaper;const uv=panel.geometry.attributes.uv;const positions=panel.geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(positions.getX(i)+36.6)/73.2,(positions.getY(i)+78.85)/157.7);uv.needsUpdate=true;}
  rect(g,17,4.8,.12,0,68.7,4.5,metal('#050708',.27,.1),2.4,0);
  circle(g,1.15,.15,5.3,68.7,4.6,metal('#101b25',.14,.6));
  rect(g,11,.7,.03,0,-73.5,4.5,new THREE.MeshBasicMaterial({color:'#eee9e5'}),.3,0);
  rect(g,7,26,.16,-18,15,3,dark,1);rect(g,11,4,.3,-18,3,2.8,gold,.5);
  g=make('display_adhesive');rectRing(g,75.8,160.8,10.1,1.1,.06,0,0,3.24,metal('#4a4841',.8,.15));

  g=make('logic_board');
  const bp=[[207,330],[342,330],[342,389],[370,389],[370,418],[530,418],[530,472],[572,472],[572,558],[522,558],[522,582],[387,582],[387,553],[330,553],[330,519],[244,519],[244,459],[207,459]];
  polygon(g,bp,.85,-.7,pcb);
  polygon(g,[[228,340],[335,340],[335,396],[349,396],[349,472],[465,472],[465,566],[388,566],[388,540],[333,540],[333,506],[245,506],[245,449],[228,449]],.55,.1,graphite);
  rect(g,12.5,10,.7,10,28,.2,shield,.6);rect(g,11,8,.4,10,28,.65,dark,.4);
  decal(g,10,4,10,28,.9,printTexture('A19 Pro',{size:36,color:'#7b8586'}));
  rect(g,14.5,10,.4,-8,28,.5,graphite,.5);
  for(let i=0;i<14;i++){const x=-18+i*2;rect(g,.55,.85,.12,x,22.1,.43,gold,.04,0)}
  for(const [x,y,w,h] of [[-24,38,5,2.5],[-13,23,5,2.5],[-17,43,10,2],[-25,53,5,3],[-21,31,4,3],[5,34,5,2]]){rect(g,w+.7,h+.7,.4,x,y,.55,rim,.2);rect(g,w,h,.48,x,y,.77,dark,.15);for(let i=0;i<5;i++)rect(g,.25,h*.7,.05,x-w/2+.7+i*.6,y,1.03,gold,.03,0)}
  for(let i=0;i<19;i++){const x=-29+(i%5)*2.2,y=47+Math.floor(i/5)*2.3;rect(g,1.3,.8,.25,x,y,.12,i%3?dark:gold,.1,0)}
  for(const [x,y] of [[-26,40],[-14,25],[19,31],[-27,52]])screw(g,x,y,.6,rim,.64);

  g=make('rear_camera');
  for(const [x,y,w,h] of [[2,58,25,22],[25,68,18,18],[25,46,22,23]]){
    rect(g,w+.7,h+.7,4,x,y,-.6,rim,2.7);rect(g,w-1.6,h-1.6,.45,x,y,1.65,graphite,2.4);
    const lensR=w*.31;circle(g,lensR+1.5,2,x,y,-4,dark);ring(g,lensR+1.1,.7,.4,x,y,-5.1,rim);circle(g,lensR,.12,x,y,-5.35,metal('#101a24',.12,.73));circle(g,lensR*.62,.1,x,y,-5.46,metal('#203c54',.16,.8));circle(g,lensR*.3,.06,x,y,-5.53,metal('#09101b',.1,.65));
  }
  rect(g,4,13,.25,13,38,1.2,dark,.6);rect(g,12,4,.3,15,30,1.3,gold,.5);
  for(const [x,y] of [[-11,67],[34,76],[34,33]]){rect(g,3,3,.5,x,y,-.5,rim,.5);screw(g,x,y,0,rim,.65)}

  g=make('front_camera');
  rect(g,24,8.7,3,-.2,74,-.4,rim,.8);
  for(const [x,r] of [[-8,2.35],[5.6,2.7]]){circle(g,r+.4,.4,x,74,1.3,dark);circle(g,r,.1,x,74,1.6,metal('#1b3039',.16,.65));circle(g,r*.5,.04,x,74,1.68,metal('#080e15',.13,.3))}
  rect(g,2.4,2.4,.13,-2,74,1.6,metal('#4d3f63',.23,.5),.2);rect(g,3.5,21,.16,-13,63,-.5,dark,.5);
  g=make('top_speaker');
  polygon(g,[[186,183],[222,159],[331,159],[331,303],[305,327],[184,310]],2.5,.15,dark);
  rect(g,15.5,13,.5,-24,63,1.65,graphite,1.3);rect(g,9,.8,.4,-21,78,1.2,rim,.3);
  for(const [x,y] of [[-29,73],[-28,57],[-16,54]])screw(g,x,y,1.7,rim,.65);
  g=make('bottom_speaker');
  polygon(g,[[193,1188],[275,1188],[303,1234],[305,1290],[480,1290],[480,1322],[198,1322]],2.7,.4,dark);
  rect(g,10,13,.5,-24,-66,2,graphite,2.4);rect(g,12,3,1,-23,-77,.8,dark,.8);
  for(const [x,y] of [[-30,-59],[-31,-75],[-17,-73]])screw(g,x,y,2,rim,.62);
  g=make('taptic_engine');rect(g,21.1,9.7,2.6,19,-68,.3,rim,1.2);rect(g,19.8,8.3,.12,19,-68,1.67,graphite,.7);
  decal(g,17,4,19,-68,1.76,printTexture('TAPTIC ENGINE',{color:'#8f9594',size:22}));
  for(const x of [7.5,31]){rect(g,3,4,.5,x,-68,.4,rim,.4);screw(g,x,-68,.9,rim,.65)}
  g=make('main_microphone');rect(g,13.5,3.5,1.5,20,-77,.3,dark,.7);rect(g,3.7,2.2,.3,18,-77,1.2,shield,.4);circle(g,.5,.1,18,-77,1.4,dark);

  g=make('usb_c_connector');
  rect(g,10.5,6.6,2.8,0,-76.9,.2,shield,1);rect(g,8,4,.12,0,-77,1.66,dark,.7);rect(g,6,.7,.05,0,-77,1.76,gold,.2);
  for(const x of [-6,6]){rect(g,2.2,85,.12,x,-23,-1.85,dark,.3);for(let i=0;i<2;i++)rect(g,.22,83,.03,x-.4+i*.8,-23,-1.76,copper,.03,0);rect(g,4,3,.35,x,20,-1.5,gold,.3);}
  rect(g,18,2,.2,-5,-74,-1.8,dark,.4);
  g=make('sim_assembly');rect(g,12,19,1.35,-25,-45,-1.7,rim,1);rect(g,9.5,16,.15,-25,-45,-.95,dark,.7);
  for(let i=0;i<6;i++)rect(g,1.2,2,.1,-28+(i%3)*2.9,-42-Math.floor(i/3)*5,-.82,gold,.1);
  g=make('sim_tray');rectRing(g,11,17,.9,.75,.45,-32,-45,-1.8,rim);rect(g,1,18,2.4,-38.7,-45,-1.5,aluminium,.3);rect(g,9,.45,.3,-32,-45,-1.8,rim,.1);

  // The battery assembly includes the cell below and its broad, notched support plate above.
  g=make('battery');rect(g,61,79,3.2,0,-22,-.3,metal('#2e3334',.7,.2),2.3);
  decal(g,36,26,0,-17,1.36,printTexture('Li-ion\nBATTERY ASSEMBLY\nA3527 · pSIM',{color:'#7e8784',size:26}));
  const trayPoints=[[185,312],[328,312],[328,243],[563,243],[576,278],[693,278],[707,300],[707,1132],[686,1132],[686,1232],[312,1232],[302,1219],[302,1145],[183,1145],[183,605],[382,605],[382,552],[331,552],[331,516],[242,516],[242,471],[184,471]];
  const trayShape=new THREE.Shape();trayPoints.forEach((p,i)=>{const v=mm(...p);i?trayShape.lineTo(...v):trayShape.moveTo(...v)});trayShape.closePath();
  // Create the connector opening directly in world XY.
  const hole=new THREE.Path();const [hx,hy]=mm(290,418);hole.moveTo(hx-7.5,hy-3.2);hole.lineTo(hx+7.5,hy-3.2);hole.lineTo(hx+7.5,hy+3.2);hole.lineTo(hx-7.5,hy+3.2);hole.closePath();trayShape.holes.push(hole);
  const screwPixels=[[197,350],[717,274],[247,504],[690,550],[717,644],[165,694],[717,787],[165,757],[165,778],[165,997],[717,1085],[165,1179],[717,1178],[495,410]];
  for(const p of screwPixels){const [x,y]=mm(...p);rect(g,3.2,3.7,.45,x,y,2.1,shield,.7);const h=new THREE.Path();h.absarc(x,y,.52,0,Math.PI*2,true);trayShape.holes.push(h);screw(g,x,y,2.55,rim,.69)}
  const tray=shapeMesh(trayShape,.5,metal('#292e30',.63,.5));tray.position.z=2.2;g.add(tray);
  rect(g,1.8,69,.2,-30,-21,2.55,graphite,.3);

  const cowlings={display_connector_cowling:[12,5,-20,30,2.35],battery_connector_cowling:[7,3.8,-11,24,2.8],camera_connector_cowling:[13.8,6.5,23,31,2.4],front_camera_connector_cowling:[13,5,-19,46,2.35],logic_board_connector_cowling:[13.5,4,-18,43,1.55],back_glass_connector_cowling:[7,4,-8,40,-1.3]};
  for(const [id,[w,h,x,y,z]] of Object.entries(cowlings)){g=make(id);rect(g,w,h,.22,x,y,z,shield,.55,0);rect(g,.5,h-1,.6,x-w/2,y,z+.2,rim,.1);screw(g,x+w/2-.8,y,z+.25,rim,.55);}
  g=make('top_speaker_grille');rect(g,17,1.5,.25,-2,79,2.5,dark,.5);for(let i=0;i<23;i++)rect(g,.21,1.05,.03,-9.5+i*.68,79,2.65,shield,.04,0);
  g=make('battery_spacer');rect(g,3.3,9,.7,-28,30,1.5,rim,.5);screw(g,-28,32.5,2,rim,.5);
  g=make('logic_board_spacer');rect(g,8,3.5,1.1,-23,21,-.2,shield,.5);screw(g,-25.5,21,.5,rim,.5);screw(g,-20.5,21,.5,rim,.5);

  root.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
  for(const part of parts.values()){part.node.traverse(obj=>{if(obj.isMesh){obj.userData.componentId=part.id;obj.material=obj.material.clone();obj.userData.originalMaterial=obj.material;}});}
  // Match the two dedicated body colours after cloning to retain independent highlights.
  const liveFinishes=[];
  const bodyColors=new Set(['cc8155','b97950']);root.traverse(obj=>{if(obj.isMesh&&bodyColors.has(obj.material.color?.getHexString()))liveFinishes.push(obj.material)});
  return {root,parts,finishMaterials:[...new Set(liveFinishes)]};
}

export function applyExplosion(parts,value){for(const part of parts.values()){const f=THREE.MathUtils.smoothstep(value,part.start,part.end);part.node.position.fromArray(part.offset).multiplyScalar(f);}}
