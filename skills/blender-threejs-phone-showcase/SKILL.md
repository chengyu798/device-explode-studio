---
name: blender-threejs-phone-showcase
description: 使用 Blender 和 Three.js 制作、迭代或复现本地手机展示网页，包含真实感外观、三色材质、零件选择与拆解交互。附带已验收的 iPhone 17 Pro Max A3527 v4.5 模型和网页模板；适用于需要保留建模细节并验证导出效果的任务。
---

# Blender 手机展示网页

交付可本地运行的网页、可编辑 Blender 模型，以及能指出失败部位的验证报告。默认本地预览；上传源码、发布网站分别遵循用户当次授权。

## 选择起点

- **复现当前 iPhone 效果**：使用随附 v4.5 种子和模板，不必重放历史修补脚本。
- **修改这款手机**：先复现，在输出副本上通过可用的 Blender MCP 或 Blender Python 修改，再导出、验证。
- **换手机或从照片建模**：先读 [建模与真实感流程](references/modeling-workflow.md)。模板仅提供交互框架；尺寸、组件、色板、命名和检查配置都要适配。不要承诺仅凭几张照片得到实测 CAD。

## 复现并修改

将下列 `SKILL` 替换为本 skill 所在目录。路径可能含空格，保留引号。

```sh
python3 "$SKILL/scripts/create_project.py" --output "/absolute/path/phone-project"
```

输出目录必须不存在。生成 `dist/`、`blender/phone.blend`、便携导出与网页检查脚本。资源均本地提供；直接使用网页不需要安装 npm 依赖。

模型有改动时，在输出项目执行（`BLENDER` 为实际 Blender 可执行文件）：

```sh
"$BLENDER" --background blender/phone.blend --python scripts/export_model.py -- --project .
```

导出器检查机壳、按键、底部真实开孔、装配和展开状态，输出 GLB 与 `qa/geometry.json`，不覆盖 `.blend`。使用 MCP 修改完成后，应先另存原生模型副本，再把它作为导出输入。不要把导出器当通用任意模型转换器：当前配置校验的是 A3527。

预览：

```sh
python3 scripts/serve.py --port 4173
```

打开 `http://127.0.0.1:4173/`。ES modules 和 GLB fetch 需要本地 HTTP；不要用 `file://` 打开。若端口占用，用其他端口，勿关闭用户的其他服务。

## 保持效果的关键条件

- Blender 以米建模，+Y 指向顶部，+Z 指向屏幕；GLB `export_yup=False`。查看器只把网格和节点位移转换一次至毫米。
- 从配置白名单集合导出，排除任何 Archive 集合、摄影棚、相机和灯光。每个可拆组件有唯一 `component_id` 和 `explode_offset_mm`；25 个组件的展开由网页驱动。
- 机壳封闭、封闭按键正体积、可见键面向外；不能以整体双面渲染掩盖反面。Logo 薄片保留独立可见性。当前按键及孔位数值见 [A3527 配置依据](references/a3527-profile.md)。
- 镜筒空心，盖片、透镜、遮光腔分离。平面端盖不用球面平滑法线。无 UV 的实时材质禁用各向异性；Blender 原生程序微纹理保留。不要追求和 Cycles 完全相同的材质节点。
- 七类配色集中在 `dist/data/finish-palettes.json`：机身、背板、镜筒、镜圈、Logo、天线、相机控制键。镜片、闪光灯、LiDAR、接口和螺丝保持其独立材质。光照、色彩空间和材质必须一起检查。

## 验证与交付

1. 导出后运行 `npm install`、`npx playwright install chromium`（已有 Playwright 时可复用），然后 `npm run verify -- --url http://127.0.0.1:4173/`。也可用 `PLAYWRIGHT_MODULE` 指定已安装模块，`BROWSER_EXECUTABLE` 指定 Chrome。
2. 检查生成的 `qa/browser.json`、三色背面/底部/侧面截图、展开截图。测试验证真实单面网格射线先命中键帽，核对七类配色、银色切换还原、拆解/单独查看/隐藏/搜索/复位、图片导出、窄屏和无外部资源请求。几何报告负责孔位与网格结构，截图负责观感；通过一类不代表另一类通过。
3. 与已验收网页同一浏览器、视口和灯光对照。复现模式应保持模型与模板；新建模模式必须人工核对正、背、左、右、底和镜头近景。说明内部估算及未校准配色。不得把复制现成资产的通过结果说成从零建模已验证。
4. 交付本地地址、原生文件、GLB 和实际检查结果。用户要求上传时，上传新项目与 skill，保留 Three.js 许可，排除缓存、凭据和历史备份；仅在用户要求时发布网站。

已完成的复现检查见 [验证记录](references/validation.md)。

当前可复现的质量来自随附原生种子、GLB、材质和网页共同组成的基线。只有这些资产与配置一起使用，才能稳定达到当前已验收效果；从零生成另一款手机仍需要参考资料与建模迭代。
