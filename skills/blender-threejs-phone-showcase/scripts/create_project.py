#!/usr/bin/env python3
"""Create a standalone native Three.js project without Blender or GLB."""
import argparse,json,shutil
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();target=a.output.expanduser().resolve();skill=Path(__file__).resolve().parents[1]
if target.exists():p.error(f'Output already exists; choose a new directory: {target}')
for rel in ['assets/viewer/index.html','assets/viewer/models/phone.scene.json.gz','assets/profile.json','scripts/verify.mjs','scripts/serve.py']:
 if not (skill/rel).is_file():p.error(f'Missing skill resource: {rel}')
target.mkdir(parents=True);shutil.copytree(skill/'assets/viewer',target/'dist');(target/'scripts').mkdir()
for name in ['verify.mjs','serve.py']:shutil.copy2(skill/'scripts'/name,target/'scripts'/name)
for name in ['LICENSE','THIRD_PARTY_NOTICES.md']:shutil.copy2(skill/'assets'/name,target/name)
shutil.copy2(skill/'assets/profile.json',target/'profile.json')
package={'name':'device-explode-studio','version':'5.0.0','private':True,'license':'MIT','type':'module','scripts':{'start':'python3 scripts/serve.py','verify':'node scripts/verify.mjs','check':'node --check dist/app.js && node --check dist/load-model.js'},'devDependencies':{'playwright':'1.62.1'}}
(target/'package.json').write_text(json.dumps(package,indent=2)+'\n')
(target/'.gitignore').write_text('node_modules/\n.DS_Store\nqa/\n__pycache__/\n')
(target/'README.md').write_text('# Native Three.js phone showcase\n\nRun `python3 scripts/serve.py` and open http://127.0.0.1:4173/ . No Blender or GLB required. Scene JSON is gzip-compressed, in millimetres. Internal geometry is estimated, not measured CAD. See THIRD_PARTY_NOTICES.md.\n')
print(json.dumps({'project':str(target),'format':'Three.js Object3D JSON + gzip','url':'http://127.0.0.1:4173/'}))
