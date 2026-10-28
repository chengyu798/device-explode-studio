"""Blender entry point: validate the A3527 profile and export an assembled GLB."""
import argparse,bpy,bmesh,json,math,struct,sys
from pathlib import Path
from mathutils import Vector

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',type=Path,required=True)
 a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 root=a.project.expanduser().resolve();cfg=json.loads((root/'profile.json').read_text());qa=root/'qa';qa.mkdir(exist_ok=True)
 s=bpy.data.scenes.get(cfg['scene']);assert s,'Expected profile scene is missing'
 bpy.context.window.scene=s;s.frame_set(1)
 cols=set(cfg['collections'])
 objects=[o for o in s.objects if any(c.name in cols for c in o.users_collection) and not any('Archive' in c.name for c in o.users_collection)]
 assert all(o.type not in {'CAMERA','LIGHT'} for o in objects),'Studio objects entered export set'
 controllers=[o for o in objects if o.get('component_id')]
 ids=[o['component_id'] for o in controllers]
 assert len(ids)==len(set(ids))==cfg['component_count'],ids
 assert all(o.location.length<1e-7 for o in controllers),'Controllers are not assembled at frame 1'
 s.frame_set(160)
 assert all((o.location-Vector(o['explode_offset_mm'])*.001).length<1e-7 for o in controllers),'Animation/offset mismatch'
 s.frame_set(1)
 assert all(math.isfinite(v) for o in objects for v in o.matrix_world.translation)
 body=bpy.data.objects[cfg['body']]
 def health(ob):
  bm=bmesh.new();bm.from_mesh(ob.data)
  result={'non_manifold_edges':sum(not e.is_manifold for e in bm.edges),'loose_vertices':sum(not v.link_edges for v in bm.verts),'signed_volume_mm3':bm.calc_volume(signed=True)*1e9};bm.free()
  assert result['non_manifold_edges']==0 and result['loose_vertices']==0 and result['signed_volume_mm3']>0,(ob.name,result)
  return result
 body_health=health(body)
 controls=[]
 for spec in cfg['controls']:
  label=spec['name'];side=spec['side']
  names=['I17_'+label+suffix for suffix in (['_Cap','_Seam'] if label=='China_Dual_SIM_Tray' else ['_Rounded_Button','_Precision_Reveal'])]
  centers=[]
  for i,name in enumerate(names):
   ob=bpy.data.objects[name];record=health(ob);vs=ob.data.vertices
   cy=(min(v.co.y for v in vs)+max(v.co.y for v in vs))*500;cz=(min(v.co.z for v in vs)+max(v.co.z for v in vs))*500
   assert abs(cy-spec['y_mm'])<.001 and abs(cz)<.001,(name,cy,cz)
   centers.append((cy,cz));outer=max(side*v.co.x for v in vs)
   face=[f for f in ob.data.polygons if all(abs(side*vs[k].co.x-outer)<1e-7 for k in f.vertices)]
   assert face and all(side*f.normal.x>.99 for f in face),f'Inward control face: {name}'
   if i==0:assert abs(outer*1000-spec['outer_x_mm'])<.001,(name,outer)
   controls.append({'object':name,'center_yz_mm':[cy,cz],'outer_abs_x_mm':outer*1000,**record})
  assert max(abs(a-b) for a,b in zip(*centers))<.001
 def clear(x):
  hit,loc,normal,index=body.ray_cast(Vector((x,-90,0))*.001,Vector((0,1,0)))
  return not hit or loc.y>-.078
 assert all(clear(x) for x in cfg['acoustic_x_mm']+[0])
 intervals=[];prev=False
 for i in range(2401):
  x=-30+i*.025;opened=clear(x)
  if opened and not prev:start=x
  elif prev and not opened:intervals.append([start,x-.025])
  prev=opened
 assert len(intervals)==13,intervals
 measured=[{'center_mm':(lo+hi)/2,'width_mm':hi-lo+.025} for lo,hi in intervals]
 for m,x in zip(measured,sorted(cfg['acoustic_x_mm']+[0])):
  assert abs(m['center_mm']-x)<.04 and abs(m['width_mm']-(9 if x==0 else 1.53))<.05,m
 screws=[]
 for x in cfg['screw_x_mm']:
  for dx,dz in [(0,0),(.4,0),(-.4,0),(0,.4),(0,-.4)]:
   hit,loc,n,index=body.ray_cast(Vector((x+dx,-90,dz))*.001,Vector((0,1,0)))
   assert not hit or loc.y>-.0814,(x,dx,dz)
  screws.append({'x_mm':x,'recess_probes_clear':5})
 # Use portable palette application from the prepared seed, without executing historical scripts.
 palette=json.loads((root/'dist/data/finish-palettes.json').read_text())['silver']['roles']
 def role(name):
  for token,r in [('Camera_Control_Finish','control'),('Sensor_Seat_Finish','metal'),('Anodized_Silver','metal'),('Silver_Ceramic_Back','back'),('Lens_Barrel_Satin_Silver','barrel'),('Diamond_Cut_Lens_Rim','rim'),('Silver_Logo_Inlay','logo'),('Silver_Antenna_Insulator','antenna')]:
   if token in name:return r
 for mat in bpy.data.materials:
  r=role(mat.name)
  if not r or not mat.use_nodes:continue
  pbr=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
  if not pbr:continue
  color=palette[r]['color'];rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
  pbr.inputs['Base Color'].default_value=(*linear,1);pbr.inputs['Metallic'].default_value=palette[r]['metalness'];pbr.inputs['Roughness'].default_value=palette[r]['roughness']
 original=[];realtime={}
 try:
  for ob in objects:
   if ob.type!='MESH':continue
   for slot in ob.material_slots:
    src=slot.material
    if not src or not src.name.startswith(('I17_R3_','I17_R4_')):continue
    if src.name not in realtime:
     rt=src.copy();rt.name=src.name+'_Realtime';pbr=next(n for n in rt.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
     for socket in ['Normal','Roughness']:
      for link in list(pbr.inputs[socket].links):rt.node_tree.links.remove(link)
     realtime[src.name]=rt
    original.append((slot,src));slot.material=realtime[src.name]
  bpy.ops.object.select_all(action='DESELECT')
  for ob in objects:ob.hide_set(False);ob.select_set(True)
  bpy.context.view_layer.objects.active=bpy.data.objects['I17_enclosure']
  dest=root/'dist/models'/cfg['model_file'];dest.parent.mkdir(exist_ok=True)
  bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_yup=False)
 finally:
  for slot,src in original:slot.material=src
 raw=dest.read_bytes();length=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+length])
 assert len([n for n in gltf['nodes'] if n.get('extras',{}).get('component_id')])==cfg['component_count']
 assert not any('Archive' in n.get('name','') or 'PREBUTTON' in n.get('name','') for n in gltf['nodes'])
 assert not gltf.get('animations')
 report={'profile':cfg['id'],'blender_version':bpy.app.version_string,'components':ids,'body':body_health,'controls':controls,'bottom_openings':measured,'screw_recess':screws,'frame_160_offsets_match':True,'archives_excluded':True,'axes':'+Y top / +Z display; metres','internal_geometry':'Estimated; not measured CAD','glb_bytes':len(raw)}
 (qa/'geometry.json').write_text(json.dumps(report,indent=2)+'\n');print('MODEL_VALIDATED',len(ids),'components; 12 acoustic ports; 12 outward control meshes',flush=True)

if __name__=='__main__':
 try:main()
 except Exception:
  import traceback;traceback.print_exc();sys.exit(1)
