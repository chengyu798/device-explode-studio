---
name: blender-threejs-phone-showcase
description: 使用纯 Three.js 制作、修改或复现本地手机展示与拆解网页，不依赖 Blender、GLB 或 GLTFLoader。附带 iPhone 17 Pro Max A3527 已验收网格数据、三色材质、交互模板和验证脚本；也指导使用 Three.js 几何体为新机型建模。
---

# Three.js 手机展示网页

旧名称为兼容已安装调用保留；当前 v5 工作流不需要 Blender，也不使用 GLB。交付本地网页、可编辑的 Three.js 场景数据或建模代码、实际验证报告。默认本地运行；代码上传与网页发布分别遵循用户授权。

## 选择工作方式

- **复现当前手机**：复用随附的原生 Three.js 网格快照，保留已验收细节。它最初从 v4.5 模型迁移，当前生成和运行不需要原始 Blender/GLB。
- **修改当前手机**：用 `ObjectLoader.parseAsync` 读取原生场景，在 Three.js 中修改节点、BufferGeometry 或材质，再以 `root.toJSON()` 保存。配置和数据格式见 [原生场景流程](references/native-workflow.md)。
- **从零制作另一款手机**：依据尺寸和照片，用 Shape、ExtrudeGeometry、LatheGeometry、BufferGeometry 建模。先读 [原生场景流程](references/native-workflow.md)；内构缺少测量资料时必须标注估算。当前网格不是参数化 CAD，换数据格式不等于从零建模已验证。

## 生成和预览

将 SKILL 替换为本目录，输出路径必须不存在：

```sh
python3 "$SKILL/scripts/create_project.py" --output "/absolute/path/phone-project"
cd /absolute/path/phone-project
python3 scripts/serve.py --port 4173
```

打开 http://127.0.0.1:4173/ 。预览资源全在本地，不需要 npm 安装。Python 只负责复制文件和本地 HTTP，也可使用其他静态服务器；浏览器直接 file:// 打开无法正常 fetch。当前使用 WebGL 2、DecompressionStream 和本地 Three.js 0.186.1。

场景数据 `dist/models/phone.scene.json.gz` 是标准 gzip 压缩的 Three.js Object3D JSON，不是改后缀的 GLB；gzip 解压后可直接编辑顶点、法线、索引、材质和层级。`ObjectLoader` 重建 Mesh/BufferGeometry，坐标已是毫米、+Y 向上、+Z 屏幕正面，不要再次乘1000。

## 保留质量

组件保留唯一 component_id 与 explode_offset_mm，当前25组。材质按七个语义角色匹配，不给镜片/闪光灯/LiDAR统一染色。按键向外、盖片与密封圈同心、Logo背面可见，不能靠全局双面渲染掩盖反面。镜筒保持空心；避免在平面上使用球面平滑法线。无 UV 的各向异性关闭。

新机型需同时适配 profile.json、model.js 的组件数据、load-model.js 的组件数量约束、相机取景、色板及检查坐标。A3527 的数值依据见 [机型基线](references/a3527-profile.md)。内部几何仍为估算，不承诺实测 CAD。

## 验证并交付

```sh
npm install
npx playwright install chromium
npm run verify -- --url http://127.0.0.1:4173/
```

已有 Playwright 可用 PLAYWRIGHT_MODULE 指定模块，BROWSER_EXECUTABLE 指定 Chrome。检查 qa/browser.json 和截图：25组件、三色七类材质、六个键帽/卡托的可见射线、Logo、展开/隔离/隐藏/搜索/复位、PNG和窄屏。测试拒绝外部运行资源和 GLB/GLTF 请求。改几何后还需检查底部孔位、网格朝向与近景；旧报告不能代替新检查。

复现模式与已验收截图使用同浏览器、视口、灯光对照。交付实际差异，不把加载成功说成外观等同，也不把快照复现说成新模型从零生成。历史验证与当前版本界限见 [验证记录](references/validation.md)。上传时保留 LICENSE 和 THIRD_PARTY_NOTICES.md，不发布网站，除非用户明确要求。
