import * as THREE from 'three';

// Neutral reflection cards: metal reads through reflected light and dark shapes.
export function createStudioEnvironment(){
  const room=new THREE.Scene();room.background=new THREE.Color(.10,.105,.115);
  const pixels=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const u=(x/127-.5)*2.15,v=(y/127-.5)*2.15;
    const value=Math.round(255*Math.exp(-Math.pow(u,6)-Math.pow(v,8)));
    const i=(y*128+x)*4;pixels.set([value,value,value,255],i);
  }
  const softbox=new THREE.DataTexture(pixels,128,128);softbox.needsUpdate=true;
  softbox.magFilter=THREE.LinearFilter;softbox.minFilter=THREE.LinearFilter;
  const cards=[
    {position:[1.15,-.65,-4.5],size:[3.3,5.5],strength:1.05},
    {position:[-3.4,1.0,-3.5],size:[.85,5.4],strength:4.5},
    {position:[3.4,.4,-2.8],size:[.40,4.8],strength:3.1},
    {position:[.7,-2.0,-4.8],size:[2.4,.55],strength:1.1},
    {position:[-2.8,1.4,3.8],size:[1.0,5.0],strength:3.4},
    {position:[-.9,-.3,4.6],size:[2.7,5.0],strength:1.05},
    {position:[2.6,-.5,3.4],size:[.55,4.0],strength:2.0},
    {position:[0,4.2,0],size:[3.3,1.2],strength:1.8},
  ];
  for(const {position,size,strength} of cards){
    const geometry=new THREE.PlaneGeometry(...size);
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(strength,strength,strength),map:softbox,side:THREE.DoubleSide,toneMapped:false});
    const card=new THREE.Mesh(geometry,material);card.position.set(...position);card.lookAt(0,0,0);room.add(card);
  }
  room.dispose=()=>{room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});softbox.dispose();};
  return room;
}
