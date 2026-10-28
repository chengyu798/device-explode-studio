export const FINISHES=await fetch('./data/finish-palettes.json').then(response=>{
  if(!response.ok)throw new Error('Finish palette could not be loaded.');
  return response.json();
});

export function finishRole(name){
  if(/R4_Camera_Control_Finish/.test(name))return 'control';
  if(/R4_Sensor_Seat_Finish|Anodized_Cosmic_Orange|Anodized_Silver/.test(name))return 'metal';
  if(/Matte_Orange_Back_Glass|Silver_Ceramic_Back/.test(name))return 'back';
  if(/Lens_Barrel_Satin_Silver/.test(name))return 'barrel';
  if(/Diamond_Cut_Lens_Rim/.test(name))return 'rim';
  if(/Silver_Logo_Inlay/.test(name))return 'logo';
  if(/Silver_Antenna_Insulator/.test(name))return 'antenna';
  return null;
}

export function applyFinish(materials,finish){
  const preset=FINISHES[finish];
  if(!preset)throw new Error(`Unknown finish: ${finish}`);
  for(const material of materials){
    const role=material.userData.finishRole,settings=preset.roles[role];
    if(!settings)throw new Error(`No ${role} material for finish ${finish}`);
    material.color.set(settings.color);
    material.metalness=settings.metalness;material.roughness=settings.roughness;
  }
}
