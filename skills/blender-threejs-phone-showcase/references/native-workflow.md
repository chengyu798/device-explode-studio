# 无 Blender / 无 GLB 的建模与修改

## 数据和编辑

phone.scene.json.gz 解压后为 Object3D.toJSON() 的原生 Three.js 文档，包含572个几何和材质、组件自定义属性、嵌入式图片。修改顶点用 Float32BufferAttribute，修改后更新 normals、boundingBox、boundingSphere；保持索引绕向与外侧一致。要保存可直接 JSON.stringify(root.toJSON())；用 Python gzip.compress 或 Node gzipSync 压缩。ObjectLoader.parseAsync 会等待纹理完成。

例如：

```js
const root = await new THREE.ObjectLoader().parseAsync(sceneData);
const cap = root.getObjectByName('I17_Side_Rounded_Button');
// 所有位置及顶点均为毫米。移动前应核对其密封圈与安装座。
cap.position.y += 0.1;
const json = JSON.stringify(root.toJSON());
```

这只是节点编辑示例，不应在没有参考尺寸时盲目移动按键。修改材质语义配色在 finish-palettes.json 完成。

## 从零建模

先确定机型、地区、SIM分支、尺寸、颜色和交付用途。使用官方尺寸图和实物照片区分标注尺寸与照片拟合，不从概念海报推定真实内部结构。

机身从圆角 Shape 拉伸并加入合理倒角开始；相机平台用逐层截面生成连续过渡 BufferGeometry，避免简单叠盒。屏幕、背板各自独立曲面；接缝与安装座保持真实厚度。底部用带圆孔与USB胶囊形 holes 的平面形状构造局部侧壁，补齐隧道内壁，不用黑贴片假装开孔。镜筒用环形截面/LatheGeometry生成空腔，盖片与示意透镜独立。Logo使用轮廓矢量，三角化后核对背面朝向。按键盖、密封圈采用同中心坐标函数生成。

每个可拆部件挂到 Group，配置 component_id 和 explode_offset_mm。内部缺少准确资料时做可辨识的估算布局，不把芯片装饰当真实PCB。光照、倒角、粗糙度和反光环境共同决定真实感，不能只调亮机身颜色。

新机型从零建模需要按正背左右底及近景反复核对。附带快照提供当前机型的几何细节，不是可自动切换机型的参数化生成器。
