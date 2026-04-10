import json

# Load existing suggestions
with open('artifacts/ai_refine_suggestions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# New suggestions batch 3
new_suggestions = [
    {
        "node_id": "merged_1775780469599",
        "parent_id": "node_0272",
        "parent_text": "Surface Caching",
        "original_text": "Surface Cache\n5张Altas - Albedo, Normal,\n内容：5\nDepth, Emissive, Opacity\n生成\nTwo Pass\nCard Capture\nFixte",
        "suggested_text": "Surface Cache\n- 5张Atlas\n  - Albedo\n  - Normal\n  - Depth\n  - Emissive\n  - Opacity\n- 生成方式\n  - Two Pass\n  - Card Capture",
        "reason": "整理层级结构，修正\"Altas\"为\"Atlas\"，移除OCR误识别内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780628209",
        "parent_id": "node_0273",
        "parent_text": "如何构建游戏世界",
        "original_text": "游戏世界组成\n万物皆GameObject\n动态物\n静态物\n环境\n其它",
        "suggested_text": "游戏世界组成\n- 万物皆GameObject\n- 动态物\n- 静态物\n- 环境\n- 其它",
        "reason": "添加列表格式，使内容更清晰",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775780726940_56dlakpst",
        "parent_id": "node_0274",
        "parent_text": "阴影",
        "original_text": "DistanceFieldShaodw",
        "suggested_text": "Distance Field Shadow",
        "reason": "修正拼写错误\"Shaodw\"为\"Shadow\"",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780762673",
        "parent_id": "node_0275",
        "parent_text": "Rasterization",
        "original_text": "软件光栅化\n顶点处理阶段，这里每个顶点对应\n一个线程，如果ClusterVB中的顶点\n数超出128，那么还可以再启动\n-个Group，最大支持256\n面片处理阶段，在这个阶段每个线程\n负责一个三角形，",
        "suggested_text": "软件光栅化\n- 顶点处理阶段\n  - 每个顶点对应一个线程\n  - ClusterVB顶点数超出128可再启动一个Group\n  - 最大支持256顶点\n- 面片处理阶段\n  - 每个线程负责一个三角形",
        "reason": "整理层级结构，修正\"-个\"为\"一个\"，使流程更清晰",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780784434",
        "parent_id": "node_0275",
        "parent_text": "Rasterization",
        "original_text": "现代GPU光栅化组件流程\n会有一个大尺寸Tile判定机制\n会有一个小尺寸Tile（4*4）判定机制\n会有一个2*2的quad作为最小处理单元进行输出\n会有\n目标是为了实现像素的并行计算\n现有\n现有的硬",
        "suggested_text": "现代GPU光栅化流程\n- 大尺寸Tile判定机制\n- 小尺寸Tile（4x4）判定机制\n- 2x2的quad作为最小处理单元\n- 目标：实现像素的并行计算",
        "reason": "整理为列表格式，移除OCR误识别的重复和不完整内容",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780805838",
        "parent_id": "node_0276",
        "parent_text": "Build a lot of Probes with Different",
        "original_text": "Sampling\nImportant Sampling\nPDF计算\nIncoming Radiance\nRadiance\nLast frame' s Screen Space\name'sScreenS",
        "suggested_text": "Sampling\n- Important Sampling\n- PDF计算\n- Incoming Radiance\n- Last frame's Screen Space Radiance",
        "reason": "整理为列表格式，修正OCR换行错误，移除重复内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775780873244",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "(Joint Pose)\n关节姿势\n旋转Orientation\n位置Position\n缩放Scale\n仿射矩阵\n局部空间到物体空间\n插值\n单关节蒙皮\n蒙皮矩阵\n在内存中存储骨骼\n蒙皮矩阵调色板\n多骨骼",
        "suggested_text": "关节姿势（Joint Pose）\n- 旋转（Orientation）\n- 位置（Position）\n- 缩放（Scale）\n- 仿射矩阵：局部空间到物体空间\n- 插值\n- 蒙皮\n  - 单关节蒙皮\n  - 蒙皮矩阵\n  - 蒙皮矩阵调色板\n  - 多骨骼\n- 在内存中存储骨骼",
        "reason": "整理层级结构，添加中文对照，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781066821",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "3D旋转中的数学\n欧拉角\n中的顺序依赖\n万向节死锁\n死锁\n欧拉角的缺点\n的缺点\n衣赖\n顺序依赖\n节死锁\n难以插值、组合等\n四元数\n2D旋转与复数\n四元数的定义\n欧拉角到四元数的转换\n四元数进行旋转\n四",
        "suggested_text": "3D旋转中的数学\n- 欧拉角\n  - 顺序依赖\n  - 万向节死锁\n  - 难以插值、组合\n- 四元数\n  - 2D旋转与复数\n  - 四元数的定义\n  - 欧拉角到四元数的转换\n  - 四元数进行旋转",
        "reason": "整理层级结构，移除OCR误识别的重复内容（\"死锁\"、\"的缺点\"、\"衣赖\"等）",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781193529",
        "parent_id": "node_0277",
        "parent_text": "物理系统基础概念",
        "original_text": "本动力学\n刚体动力学\n质点动力学\n刚体动力学\n朝向\n角速度\n角加速度\n转动惯量\n角动量\n扭矩\n应用：\n台球动力学",
        "suggested_text": "刚体动力学\n- 质点动力学\n- 刚体动力学\n  - 朝向\n  - 角速度\n  - 角加速度\n  - 转动惯量\n  - 角动量\n  - 扭矩\n- 应用：台球动力学",
        "reason": "修正\"本动力学\"为\"刚体动力学\"，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781226146",
        "parent_id": "node_0277",
        "parent_text": "物理系统基础概念",
        "original_text": "形状\n分类\n球\n胶囊\n方盒\n凸包\n三角网格\n高度场\n碰撞体制作标准\n属性\n质量与密度\n质心(COM)\n摩擦系数\n回弹系数",
        "suggested_text": "碰撞形状\n- 分类\n  - 球\n  - 胶囊\n  - 方盒\n  - 凸包\n  - 三角网格\n  - 高度场\n- 碰撞体制作标准\n- 属性\n  - 质量与密度\n  - 质心（COM）\n  - 摩擦系数\n  - 回弹系数",
        "reason": "添加标题说明，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781335117",
        "parent_id": "node_0277",
        "parent_text": "物理系统基础概念",
        "original_text": "性能、精度与确定性\n模拟岛\n休眠\n连续碰撞检测\n冲击时间-保守步进法\n确定性模拟",
        "suggested_text": "性能、精度与确定性\n- 模拟岛\n- 休眠\n- 连续碰撞检测\n  - 冲击时间-保守步进法\n- 确定性模拟",
        "reason": "整理层级结构，连续碰撞检测包含具体方法",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781397335_oit4rlkex",
        "parent_id": "node_0278",
        "parent_text": "物理系统应用",
        "original_text": "载具模拟\n真实感-风格化谱系\n建模\n力\n牵引力\n弹簧力\n轮胎力\n质心\n转向过度与转向不足\n重量转移\n转向角\nAckermann转向\n轮胎接触",
        "suggested_text": "载具模拟\n- 真实感-风格化谱系\n- 建模\n- 力\n  - 牵引力\n  - 弹簧力\n  - 轮胎力\n- 质心\n- 转向过度与转向不足\n- 重量转移\n- 转向角\n  - Ackermann转向\n- 轮胎接触",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781433805_ikz01abuj",
        "parent_id": "node_0279",
        "parent_text": "方法",
        "original_text": "基于网格的布料模拟\n物理网格VS.渲染网格\n刷布料约束\n布料物理材质\n求解\n弹簧-质点系统\nVerlet积分\nPBD(Position Based Dynamics)\n自碰撞",
        "suggested_text": "基于网格的布料模拟\n- 物理网格VS.渲染网格\n- 布料约束\n- 布料物理材质\n- 求解方法\n  - 弹簧-质点系统\n  - Verlet积分\n  - PBD（Position Based Dynamics）\n- 自碰撞",
        "reason": "整理层级结构，修正\"刷布料约束\"为\"布料约束\"",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781458638_cgsgp9fo8",
        "parent_id": "node_0278",
        "parent_text": "物理系统应用",
        "original_text": "PBD/XPBD\n拉格朗日力学约束建模\n拉伸约束\n约束投影\n工作流\nXPBD",
        "suggested_text": "PBD/XPBD\n- 拉格朗日力学约束建模\n- 拉伸约束\n- 约束投影\n- 工作流\n- XPBD",
        "reason": "整理为列表格式，使内容更清晰",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781475128_vz42fesem",
        "parent_id": "node_0280",
        "parent_text": "Game Engine",
        "original_text": "音效",
        "suggested_text": "音效",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781546090",
        "parent_id": "node_0281",
        "parent_text": "空间化音频",
        "original_text": "平移\n听者几何体\n扬声器几何体\n中央声道\n音频平移\n线性平移\n等功率平移",
        "suggested_text": "音频平移\n- 听者几何体\n- 扬声器几何体\n- 中央声道\n- 平移方式\n  - 线性平移\n  - 等功率平移",
        "reason": "整理层级结构，平移方式作为子项",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781566317_t1nhly4jz",
        "parent_id": "node_0282",
        "parent_text": "GamePlay",
        "original_text": "复杂的游戏性及其基本要素",
        "suggested_text": "复杂的游戏性及其基本要素",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781611547",
        "parent_id": "ocr_manual_1775781566317_t1nhly4jz",
        "parent_text": "复杂的游戏性及其基本要素",
        "original_text": "如何编码游戏逻辑\n脚本语言的优点及工作原理\n对象生命周期管理\n在原生引擎代码中管理对象生命周期\n在脚本中管理对象生命周期\n脚本系统运行框架\n由原生引擎代码支配游戏世界\n脚本扩展原生引擎功能\n由脚本支配",
        "suggested_text": "如何编码游戏逻辑\n- 脚本语言的优点及工作原理\n- 对象生命周期管理\n  - 在原生引擎代码中管理\n  - 在脚本中管理\n- 脚本系统运行框架\n  - 由原生引擎代码支配游戏世界\n  - 脚本扩展原生引擎功能\n  - 由脚本支配",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781621407_p55mmyagc",
        "parent_id": "ocr_manual_1775781566317_t1nhly4jz",
        "parent_text": "复杂的游戏性及其基本要素",
        "original_text": "可视化脚本",
        "suggested_text": "可视化脚本",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781636866",
        "parent_id": "ocr_manual_1775781566317_t1nhly4jz",
        "parent_text": "复杂的游戏性及其基本要素",
        "original_text": "事件机制\n发布-订阅模式\n事件定义\n硬编码\n反射与自动代码生成\n事件回调函数注册\n对象生命周期及回调安全保证\n对象的强引用\n对象的弱引用\n事件分发机制\n立即分发\n延迟分发\n消息队列",
        "suggested_text": "事件机制\n- 发布-订阅模式\n- 事件定义\n  - 硬编码\n  - 反射与自动代码生成\n- 事件回调函数注册\n- 对象生命周期及回调安全保证\n  - 对象的强引用\n  - 对象的弱引用\n- 事件分发机制\n  - 立即分发\n  - 延迟分发\n  - 消息队列",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
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
