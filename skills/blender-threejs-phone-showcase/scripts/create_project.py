#!/usr/bin/env python3
"""Create a standalone, local-only project from the accepted model and viewer."""
import argparse,json,shutil
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args();target=a.output.expanduser().resolve();skill=Path(__file__).resolve().parents[1]
if target.exists():p.error(f'Output already exists; choose a new directory: {target}')
# Check all required inputs before creating a destination.
for rel in ['assets/viewer/index.html','assets/iphone17-a3527-v4.5.blend','assets/profile.json','scripts/export_model.py','scripts/verify.mjs','scripts/serve.py']:
 if not (skill/rel).is_file():p.error(f'Missing skill resource: {rel}')
target.mkdir(parents=True);shutil.copytree(skill/'assets/viewer',target/'dist')
(target/'blender').mkdir();shutil.copy2(skill/'assets/iphone17-a3527-v4.5.blend',target/'blender/phone.blend')
shutil.copy2(skill/'assets/profile.json',target/'profile.json');(target/'scripts').mkdir()
for name in ['export_model.py','verify.mjs','serve.py']:shutil.copy2(skill/'scripts'/name,target/'scripts'/name)
package={'name':'device-explode-studio','version':'4.5.0','private':True,'type':'module','scripts':{'start':'python3 scripts/serve.py','verify':'node scripts/verify.mjs','check':'node --check dist/app.js && node --check dist/load-blender.js && node --check scripts/verify.mjs'},'devDependencies':{'playwright':'1.62.1'}}
(target/'package.json').write_text(json.dumps(package,indent=2)+'\n')
(target/'.gitignore').write_text('node_modules/\n.DS_Store\n__pycache__/\n*.pyc\n*.blend1\n*.blend2\nqa/\n')
(target/'README.md').write_text('''# Device Explode Studio

本地 Blender + Three.js 手机展示与拆解。当前为 iPhone 17 Pro Max A3527（国行双 nano-SIM）v4.5，含银、橙、蓝三色，25 个可选择组件。

## 本地运行

```sh
python3 scripts/serve.py
```

浏览器打开 http://127.0.0.1:4173/ 。所有运行资源已打包，无需 npm 或 CDN；不要使用 file://。

## 修改与验证

使用 Blender 5.2.3 LTS 打开 `blender/phone.blend`，在副本上修改并保存。然后从项目目录执行：

```sh
blender --background blender/phone.blend --python scripts/export_model.py -- --project .
npm install
npx playwright install chromium
npm run verify
```

macOS 可把 `blender` 替换为 `/Applications/Blender.app/Contents/MacOS/Blender`。导出器只写 GLB 与 `qa/geometry.json`，不覆盖原生模型。网页检查输出 `qa/browser.json` 与截图；可用 `--url` 和 `--out` 指定地址/证据目录，`PLAYWRIGHT_MODULE` 指向现有 Playwright 模块，`BROWSER_EXECUTABLE` 指定现有 Chrome。

默认装配；支持拖动、缩放、展开、分层预设、零件选择/隐藏/单独查看、搜索、正背左右底视图、配色和 PNG 导出。`finish-audit.html`、`button-audit.html` 是参考对照页，不代替本次浏览器截图。

## 复用 skill

如果项目包含 `skills/blender-threejs-phone-showcase`，复制该目录到 `~/.codex/skills/`，在 Codex 中调用 `$blender-threejs-phone-showcase`。skill 内含独立模板、原生种子及生成/验证脚本，可生成到新的绝对路径。重复生成不会覆盖已有目录。

## 模型依据与限制

外观参照 Apple 外形尺寸图与用户照片。底部为 12 个声学孔（左右6+6，Ø1.53 mm）、9.00×3.12 mm USB-C 和两颗螺丝；机械键有向外表面与0.45 mm建模凸起。内部几何、排线、板级元件、镜片内部为估算或视觉示意，不是实测 CAD，不是维修指南。配色为视觉匹配，未作仪器校准。来源见 `dist/data/model-notes.json` 与网页资料面板。

网页默认仅在本地运行；上传源码不会发布网站。Three.js 采用 MIT 许可，完整许可位于 `dist/vendor/THREE-LICENSE.txt`。本项目未另行授予 Apple 标志、产品图片或其他第三方资料的许可。
''')
print(json.dumps({'project':str(target),'model':'blender/phone.blend','url':'http://127.0.0.1:4173/'},ensure_ascii=False))
