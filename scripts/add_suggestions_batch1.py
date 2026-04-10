import json

# Load existing suggestions
with open('artifacts/ai_refine_suggestions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Load graph
with open('artifacts/graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)
nodes = graph['nodes']
nodes_by_id = {n['id']: n for n in nodes}

processed_ids = set(s['node_id'] for s in data['suggestions'])

# New suggestions batch 1 (nodes 1-15)
new_suggestions = [
    {
        "node_id": "node_0470",
        "parent_id": "node_0459",
        "parent_text": "RPC",
        "original_text": "GIN\nRPC实现通信的基本原理\n1.客户端发起函数调用（Clientfunctions）\n2.客户端通过ClientStub进行消息的封装（序列化）及传输\n3.Server端通过ServerStub(或者叫Skeleton)进行解码\n并找到对应的函数进行相关处理，以及返回处理结果\n4.ClientStub接收消息（反序列化），得到结果",
        "suggested_text": "RPC实现通信的基本原理\n- 客户端发起函数调用（Client Functions）\n- 客户端通过ClientStub进行消息的封装（序列化）及传输\n- Server端通过ServerStub（Skeleton）进行解码并找到对应函数处理，返回结果\n- ClientStub接收消息（反序列化），得到结果",
        "reason": "移除开头的\"GIN\"（OCR误识别），整理编号格式为列表形式，修正大小写",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775746867257",
        "parent_id": "node_0097",
        "parent_text": "Fast Ray Trace in Any Hardware",
        "original_text": "全局距离场\n全局距离场是分辨率较低的距离场，跟随\n摄像机的同时，在关卡中使用有向距\n离场遮蔽。这会创建每个Object网格体距离场\n的缓存，然后将它们合成到围绕摄像机的\n若干体积纹理中，称为裁剪图。由于只有新\n的可见区域或受到场景修改影响\n的可见区域才需要更新，合成过程不会有太多消耗。",
        "suggested_text": "全局距离场\n- 分辨率较低的距离场，跟随摄像机\n- 在关卡中使用有向距离场遮蔽\n- 创建每个Object网格体距离场的缓存\n- 合成到围绕摄像机的若干体积纹理中（裁剪图）\n- 只有新的可见区域或受场景修改影响的区域才需更新",
        "reason": "整理长段落为列表格式，修正换行问题，使内容更清晰",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775746883825",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "动画DCC流程\n网格制作\n网格调整\n骨骼绑定\n添加Game\n添加GamePlay关节\n添加根骨骼\n蒙皮\n动画制作\n动画导出",
        "suggested_text": "动画DCC流程\n- 网格制作\n- 网格调整\n- 骨骼绑定\n- 添加GamePlay关节\n- 添加根骨骼\n- 蒙皮\n- 动画制作\n- 动画导出",
        "reason": "添加列表格式，修正\"添加Game\"为\"添加GamePlay关节\"（重复内容合并）",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775746913581",
        "parent_id": "node_0261",
        "parent_text": "动画技术进阶",
        "original_text": "反向\n反向动力学\nInverse Kinematics\n基础概念\n基础相\n终端效应器End-Effectors\n终端效应器End-\nIK\nFK\nTwo Bone\n多关节IK\n关节纟\n关节约束\n启发式算法\n循环坐标下降算法CCD\nFABRIK\nFABRIK的约束\n多终端效应器难题\n雅可比矩阵法\nIK前沿",
        "suggested_text": "反向动力学（Inverse Kinematics）\n- 基础概念\n  - 终端效应器（End-Effectors）\n- IK vs FK\n- Two Bone IK\n- 多关节IK\n  - 关节约束\n- 启发式算法\n  - 循环坐标下降算法（CCD）\n  - FABRIK\n  - FABRIK的约束\n- 多终端效应器难题\n- 雅可比矩阵法\n- IK前沿",
        "reason": "整理层级结构，修正OCR错误（\"反向\"重复、\"基础相\"误识别、\"关节纟\"应为\"关节约束\"），添加英文对照",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747126021",
        "parent_id": "node_0266",
        "parent_text": "渲染",
        "original_text": "GPU渲染管线\n顶点着色器\n几何着色器\n光栅化\n像素着色器\n合并阶段",
        "suggested_text": "GPU渲染管线\n- 顶点着色器\n- 几何着色器\n- 光栅化\n- 像素着色器\n- 合并阶段",
        "reason": "添加列表格式，使渲染管线各阶段更清晰",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747195695",
        "parent_id": "node_0198",
        "parent_text": "光照",
        "original_text": "IBL\nSpecular\nPre-filtered Environment Map\nBrdf Lut\nDiffuse\nIrradiance Map",
        "suggested_text": "IBL（Image-Based Lighting）\n- Specular\n  - Pre-filtered Environment Map\n  - BRDF LUT\n- Diffuse\n  - Irradiance Map",
        "reason": "添加列表格式和层级结构，Specular和Diffuse是IBL的两个主要部分",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747233436",
        "parent_id": "node_0175",
        "parent_text": "后处理",
        "original_text": "抗锯齿\n超级采样抗锯齿\n优点：往往能得到最佳的效果\n缺点：它会带来巨大的性能消耗\n多重采样抗锯齿\n图像保真度和性能之间找到最佳的平衡点\n快速近似抗锯齿\n优点：\n是低端PC最佳的抗锯齿方案.它对GPU的要求不是很高\n因为它直接平滑屏幕图像而不需要考虑到游戏中的3D模型\n缺点：边缘和纹理会变得有点模糊\n时间性抗锯齿\n综合历史帧的数据来实现抗锯齿，这样会将每个像素点的多\n次采样均摊到多个帧中，相对的开销要小得多",
        "suggested_text": "抗锯齿\n- 超级采样抗锯齿（SSAA）\n  - 优点：往往能得到最佳的效果\n  - 缺点：带来巨大的性能消耗\n- 多重采样抗锯齿（MSAA）\n  - 图像保真度和性能之间找到最佳平衡点\n- 快速近似抗锯齿（FXAA）\n  - 优点：低端PC最佳方案，GPU要求不高\n  - 缺点：边缘和纹理会变得有点模糊\n- 时间性抗锯齿（TAA）\n  - 综合历史帧数据实现抗锯齿，开销较小",
        "reason": "整理层级结构，每种抗锯齿方法包含其优缺点，修正换行问题",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747355367",
        "parent_id": "node_0171",
        "parent_text": "基于物理渲染",
        "original_text": "快门速度\n产生运动模糊效果\n光圈\n产生景深效果\n感光度\n产生Grain效果\n基于物理相机",
        "suggested_text": "基于物理相机参数\n- 快门速度：产生运动模糊效果\n- 光圈：产生景深效果\n- 感光度：产生Grain效果",
        "reason": "整理为列表格式，将\"基于物理相机\"作为标题，各参数与效果对应",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747399732",
        "parent_id": "node_0171",
        "parent_text": "基于物理渲染",
        "original_text": "微表面模型\n认为物体表面由很多凹凸不平的微小镜面组成\n这些具有不同大小、方向的微表面在对入\n射光线进行反射时产生了不同的反射效果\n法线分布函数\n几何遮蔽函数\n菲涅尔方程\n迪士尼原则\n应使用直观的参数，而不是物理类的晦涩参数\n参数应当尽可能的少\n参数在其合理范围内应该为0到1\n允许参数在有意义时超出正常的合理范围\n所有参数组合应当尽可能健壮和合理",
        "suggested_text": "微表面模型\n- 物体表面由很多凹凸不平的微小镜面组成\n- 不同大小、方向的微表面产生不同反射效果\n- 核心函数\n  - 法线分布函数\n  - 几何遮蔽函数\n  - 菲涅尔方程\n- 迪士尼原则\n  - 使用直观的参数，而非物理类晦涩参数\n  - 参数应当尽可能少\n  - 参数合理范围内应为0到1\n  - 允许参数在有意义时超出正常范围\n  - 所有参数组合应尽可能健壮合理",
        "reason": "整理层级结构，修正换行问题，将核心函数和迪士尼原则分组",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747438284",
        "parent_id": "node_0102",
        "parent_text": "基于物理光照",
        "original_text": "色温\n色温是指绝对黑体从绝对零度（-273℃）开始加温后所呈现的颜色。\n色温是影响光源颜色的重要属性，是个可选属性，当启用色温时，\n色温也参与了光源颜色的组成部分。\n真实世界环境中，一天不同时段的环境色温也会动态发生变化：",
        "suggested_text": "色温\n- 定义：绝对黑体从绝对零度（-273℃）开始加温后所呈现的颜色\n- 是影响光源颜色的重要属性（可选）\n- 真实世界中，一天不同时段的环境色温动态变化",
        "reason": "整理为列表格式，移除重复内容，使定义更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747460887",
        "parent_id": "node_0100",
        "parent_text": "参与介质",
        "original_text": "大气散射\n地球大气的渲染主要包含两种散射，\n瑞利散射以及米氏散射，瑞利散射主要\n构成了天空的颜色变化，而米氏散射则\n造成了太阳周围的光环效果\n相位函数\n瑞利散射\n米氏散射\n几何散射\n单次散射\n多重散射",
        "suggested_text": "大气散射\n- 地球大气渲染包含两种散射\n  - 瑞利散射：构成天空颜色变化\n  - 米氏散射：造成太阳周围光环效果\n- 相位函数\n- 几何散射\n  - 单次散射\n  - 多重散射",
        "reason": "整理层级结构，修正换行问题，瑞利散射和米氏散射在相位函数下重复出现，简化结构",
        "confidence": 0.93,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747476286",
        "parent_id": "node_0144",
        "parent_text": "基于物理材质",
        "original_text": "SG工作流\nAlbedo\nAlbedo Color\nSpecular Color\nGlossiness\nNormal\n优点：可以自己控制非金属F0值\n缺点：FO可能用错从而导致破坏PBR原则\n因为工作流程有些名词和传统的工作流太相似，\n但实际对应的数据可能是不一样的。\nRGB贴图多，占用内存多。",
        "suggested_text": "SG工作流（Specular-Glossiness）\n- Albedo Color\n- Specular Color\n- Glossiness\n- Normal\n- 优点：可以自己控制非金属F0值\n- 缺点\n  - F0可能用错导致破坏PBR原则\n  - 名词与传统工作流相似但数据不同\n  - RGB贴图多，占用内存多",
        "reason": "添加工作流全称，整理层级结构，修正\"FO\"为\"F0\"，将优缺点分组",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747489762",
        "parent_id": "node_0144",
        "parent_text": "基于物理材质",
        "original_text": "FO\n当光线笔直或垂直（以0度角）撞击表面时\n该光线的一部分会被反射为镜面反射。\n使用表面的折射率（IOR)，可以推导出反射量。这被称为FO。",
        "suggested_text": "F0（菲涅尔反射率）\n- 当光线垂直（0度角）撞击表面时的镜面反射量\n- 使用表面折射率（IOR）可以推导出反射量",
        "reason": "修正\"FO\"为\"F0\"（菲涅尔反射率），整理为列表格式，简化表述",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747503776",
        "parent_id": "node_0144",
        "parent_text": "基于物理材质",
        "original_text": "MR工作流\nBase\nBase Color\nRoug\nRoughness\nMetallic\nMeta\nNormal\n优点：\n缺点：\n优点：纹理占用内存少，因为金属和粗糙度贴图都是灰度图（单通道）\n缺点：F0不容易自己指定",
        "suggested_text": "MR工作流（Metallic-Roughness）\n- Base Color\n- Roughness\n- Metallic\n- Normal\n- 优点：纹理占用内存少（金属和粗糙度贴图都是灰度图）\n- 缺点：F0不容易自己指定",
        "reason": "添加工作流全称，修正OCR错误（\"Roug\"、\"Meta\"），整理层级结构，移除空的优缺点行",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775747964991",
        "parent_id": "node_0100",
        "parent_text": "参与介质",
        "original_text": "介质传播特性\n参与介质中的粒子本身会吸收光能，转换成其\n身会吸收光能，转换成其他形式的能量，这样在传播路径上的光就会衰减\n光遇到粒子时，粒子会分散光的传播方向，因此也会减弱传播路径上的光\n出散射，即光遇到粒子时，粒子会分\n番路径上散射到当前传播路径上的现象，这会加强当前路径上的光的能量\n入散射，从其他传播路径上散射到当前传播\n粒子本身是发光的，这会加强传播路径上的光",
        "suggested_text": "介质传播特性\n- 吸收：粒子吸收光能转换成其他能量，导致光衰减\n- 出散射：光遇到粒子时被分散，减弱传播路径上的光\n- 入散射：从其他路径散射到当前路径，增强光的能量\n- 自发光：粒子本身发光，增强传播路径上的光",
        "reason": "整理为列表格式，修正OCR错误和换行问题，使四种传播特性更清晰",
        "confidence": 0.90,
        "status": "pending"
    }
]

# Add new suggestions
data['suggestions'].extend(new_suggestions)
data['processed'] = len(data['suggestions'])

# Save
with open('artifacts/ai_refine_suggestions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_suggestions)} suggestions. Total: {data['processed']}")
