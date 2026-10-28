import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { FrontSide, DoubleSide } from 'three';
import { COMPONENTS } from './model.js';
import { finishRole } from './finishes.js';

export async function loadBlenderModel(){
  const gltf=await new GLTFLoader().loadAsync('./models/iphone17-pro-max-a3527-button-fix.glb');
  const root=gltf.scene,parts=new Map(),finishMaterials=[];
  const scaled=new Set();
  root.traverse(object=>{
    // The GLB is authored in metres in the project's +Y-top / +Z-display convention.
    // Convert geometry and translations to the existing viewer's millimetre units.
    object.position.multiplyScalar(1000);
    if(object.isMesh){
      if(!scaled.has(object.geometry)){object.geometry.scale(1000,1000,1000);scaled.add(object.geometry);}
      object.material=Array.isArray(object.material)?object.material.map(m=>m.clone()):object.material.clone();
      for(const mat of Array.isArray(object.material)?object.material:[object.material]){
        // Blender's generated hard-surface meshes have no UV tangent frame.
        // Anisotropy without one produces unstable highlights in realtime shaders.
        if(mat.isMeshPhysicalMaterial&&!object.geometry.hasAttribute('uv'))mat.anisotropy=0;
        if(/I17_R3_/.test(mat.name))mat.side=FrontSide;
        if(/Silver_Logo_Inlay/.test(mat.name))mat.side=DoubleSide;
        // The cover is 0.13 mm thick; glTF geometry and volume use metre units.
        if(/Sapphire_Clear_Cover/.test(mat.name)&&mat.isMeshPhysicalMaterial){mat.thickness=.13;mat.ior=1.5;}
        const role=finishRole(mat.name);
        if(role){
          mat.userData.finishRole=role;
          finishMaterials.push(mat);
        }
      }
    }
    const id=object.userData.component_id;
    if(id){
      const meta=COMPONENTS.find(p=>p.id===id);
      if(meta)parts.set(id,{...meta,node:object,offset:object.userData.explode_offset_mm||meta.offset});
    }
  });
  if(parts.size!==25)throw new Error(`Blender model has ${parts.size} components; expected 25.`);
  for(const part of parts.values())part.node.traverse(object=>{if(object.isMesh)object.userData.componentId=part.id;});
  root.updateMatrixWorld(true);
  return {root,parts,finishMaterials};
}
