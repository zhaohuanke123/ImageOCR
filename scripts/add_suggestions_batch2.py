import json

# Load existing suggestions
with open('artifacts/ai_refine_suggestions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# New suggestions batch 2 (nodes 16-30)
new_suggestions = [
    {
        "node_id": "merged_1775748022224",
        "parent_id": "node_0267",
        "parent_text": "Culling",
        "original_text": "提交\nMaterial Batch\nIndirect Draw\nTexture Batch\nVirtual Texture\nBindless Texture",
        "suggested_text": "提交优化\n- Material Batch\n- Indirect Draw\n- Texture Batch\n- Virtual Texture\n- Bindless Texture",
        "reason": "添加标题说明，整理为列表格式",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775748572248",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "实现\n蒙皮动画实现\n转换\n坐标空间转换\n结构\n生物的骨骼结构\n骨骼\n关节\n根骨骼\n绑定\n骨骼绑定\n姿势\n绑定姿势\nT-pose\nose\nbose\nA-pose",
        "suggested_text": "蒙皮动画实现\n- 坐标空间转换\n- 生物的骨骼结构\n  - 骨骼\n  - 关节\n  - 根骨骼\n- 骨骼绑定\n- 姿势\n  - 绑定姿势\n  - T-pose\n  - A-pose",
        "reason": "整理层级结构，修正OCR错误（\"ose\"、\"bose\"是T-pose/A-pose的重复识别），移除\"实现\"重复标题",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775748581975",
        "parent_id": "node_0268",
        "parent_text": "Frame Graph",
        "original_text": "目标\n单一实现，与图形API无关\n简化渲染管线配置\n简化异步渲染和资源屏障\n支持多GPU渲染，可指定调度策略",
        "suggested_text": "Frame Graph目标\n- 单一实现，与图形API无关\n- 简化渲染管线配置\n- 简化异步渲染和资源屏障\n- 支持多GPU渲染，可指定调度策略",
        "reason": "添加标题说明，整理为列表格式",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775748622759_rouoiu67c",
        "parent_id": "node_0268",
        "parent_text": "Frame Graph",
        "original_text": "流程\nSetup\n在这个阶段并不产生任何GPU命令\n所有的资源都是虚拟的\nCompile\n剔除所有没有被引l用的Resources和Passes\n计算资源的生命周期",
        "suggested_text": "Frame Graph流程\n- Setup阶段\n  - 不产生任何GPU命令\n  - 所有资源都是虚拟的\n- Compile阶段\n  - 剔除所有没有被引用的Resources和Passes\n  - 计算资源的生命周期",
        "reason": "整理层级结构，修正\"引l用\"为\"引用\"，使流程更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779509973",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "游戏中的3D动画技术\nDoF(Degrees of Freedom)\nRigid Hierarchical Animation\nPer-vertex Anima",
        "suggested_text": "游戏中的3D动画技术\n- DoF（Degrees of Freedom）\n- Rigid Hierarchical Animation\n- Per-vertex Animation",
        "reason": "整理为列表格式，修正\"Anima\"为\"Animation\"",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779534013",
        "parent_id": "node_0258",
        "parent_text": "运动",
        "original_text": "游戏中对运动离散模拟\n时间积分\n欧拉法\n前向欧拉法/显式欧拉法\n后向欧拉法/隐式欧拉法\n半隐式欧拉法",
        "suggested_text": "游戏中对运动离散模拟\n- 时间积分\n- 欧拉法\n  - 前向欧拉法/显式欧拉法\n  - 后向欧拉法/隐式欧拉法\n  - 半隐式欧拉法",
        "reason": "整理层级结构，欧拉法包含三种具体方法",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779556481",
        "parent_id": "node_0261",
        "parent_text": "动画技术进阶",
        "original_text": "混合空间BlendSpace\n1D混合空间\n2D混合空间\n部混合SkeletonMaskedBlending\n叠加混合AdditiveBlending",
        "suggested_text": "混合空间（BlendSpace）\n- 1D混合空间\n- 2D混合空间\n- 局部混合（Skeleton Masked Blending）\n- 叠加混合（Additive Blending）",
        "reason": "整理为列表格式，修正\"部混合\"为\"局部混合\"，添加英文对照",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779610777",
        "parent_id": "node_0270",
        "parent_text": "Radiance Injection",
        "original_text": "直接光照\nCull lights to 8x8 tiles\n8x8 tiles\ntsper tile\nSelect first8lightsper tile\n1",
        "suggested_text": "直接光照\n- Cull lights to 8x8 tiles\n- Select first 8 lights per tile",
        "reason": "整理为列表格式，移除OCR误识别的重复内容和乱码",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775779698487_r2p8kxkrs",
        "parent_id": "node_0270",
        "parent_text": "Radiance Injection",
        "original_text": "VoxelLigting\n动机\nGlobal SDF can't sample surface cache\nMerge all cards into globa",
        "suggested_text": "Voxel Lighting\n- 动机：Global SDF无法采样surface cache\n- 解决方案：Merge all cards into global",
        "reason": "修正\"VoxelLigting\"为\"Voxel Lighting\"，整理为列表格式",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779713336",
        "parent_id": "node_0270",
        "parent_text": "Radiance Injection",
        "original_text": "间接光照\nN+2 bounces through feedback\nProbe\n4x4hemisphericalprobeper4x4tile\nJitterpr",
        "suggested_text": "间接光照\n- N+2 bounces through feedback\n- Probe\n  - 4x4 hemispherical probe per 4x4 tile\n  - Jitter pattern",
        "reason": "整理层级结构，修正OCR换行问题",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775779719975",
        "parent_id": "node_0270",
        "parent_text": "Radiance Injection",
        "original_text": "更新策略\nFixed update budget\nSelect pages to update based on priority\nPriority = Las",
        "suggested_text": "更新策略\n- Fixed update budget\n- Select pages to update based on priority",
        "reason": "整理为列表格式，移除不完整的OCR内容",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780190841",
        "parent_id": "node_0175",
        "parent_text": "后处理",
        "original_text": "色调映射\nReinhard Tone Mapping\nFilmic Tone Mapping\nACES\nACES是一个开放的色彩管理和交换系统\n是编码和交换数据",
        "suggested_text": "色调映射\n- Reinhard Tone Mapping\n- Filmic Tone Mapping\n- ACES\n  - 开放的色彩管理和交换系统\n  - 用于编码和交换数据",
        "reason": "整理层级结构，ACES的描述作为子项",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775780225404_zj301rtxc",
        "parent_id": "node_0175",
        "parent_text": "后处理",
        "original_text": "泛光",
        "suggested_text": "泛光（Bloom）",
        "reason": "添加英文对照，原文正确",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780413937",
        "parent_id": "node_0271",
        "parent_text": "Virtualized Geometry - Nanite",
        "original_text": "Deferred Material\n思想：\n将材质分类，找出每个材质对应的像素进行Shading\nMaterialID\n表示当前像素属于哪个材质\nMateria",
        "suggested_text": "Deferred Material\n- 思想：将材质分类，找出每个材质对应的像素进行Shading\n- MaterialID：表示当前像素属于哪个材质",
        "reason": "整理为列表格式，移除OCR误识别的重复内容",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780437756",
        "parent_id": "node_0271",
        "parent_text": "Virtualized Geometry - Nanite",
        "original_text": "Virtual Shadow Map\nadowMape\n目标\n显著提升阴影分辨率，以便配合\n十阴影分辨率，以便配合拥有高度\n细节内容的Nanite几何体\n以合理",
        "suggested_text": "Virtual Shadow Map\n- 目标：显著提升阴影分辨率\n- 配合拥有高度细节内容的Nanite几何体\n- 以合理的性能开销实现高质量阴影",
        "reason": "整理为列表格式，修正OCR错误（\"adowMape\"、\"十阴影\"），移除重复内容",
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
