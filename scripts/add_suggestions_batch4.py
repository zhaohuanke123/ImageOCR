import json

# Load existing suggestions
with open('artifacts/ai_refine_suggestions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# New suggestions batch 4 (remaining 40 nodes)
new_suggestions = [
    {
        "node_id": "merged_1775781690043",
        "parent_id": "node_0283",
        "parent_text": "寻路",
        "original_text": "地图表示\n可通行区域\n形式\n路点网络\n格子\n寻路网格\n凸多边形\n稀疏体素八叉树SparseVoxelOctree",
        "suggested_text": "地图表示\n- 可通行区域形式\n  - 路点网络\n  - 格子\n  - 寻路网格\n  - 凸多边形\n  - 稀疏体素八叉树（Sparse Voxel Octree）",
        "reason": "整理层级结构，添加英文对照",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781704258",
        "parent_id": "node_0284",
        "parent_text": "基础AI系统",
        "original_text": "转向\n从路点到运动\n转向行为\n寻找/逃跑\n速度匹配\n对齐",
        "suggested_text": "转向行为\n- 从路点到运动\n- 转向行为类型\n  - 寻找/逃跑\n  - 速度匹配\n  - 对齐",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775781774635_l44yr54yz",
        "parent_id": "node_0284",
        "parent_text": "基础AI系统",
        "original_text": "经典决策算法",
        "suggested_text": "经典决策算法",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781803455",
        "parent_id": "ocr_manual_1775781774635_l44yr54yz",
        "parent_text": "经典决策算法",
        "original_text": "行为树\nDN3\n执行节点/叶子节点\n行为节点\n条件节点\n控制节点\n序列节点Sequence\n选择器Selector\n并行节点Parallel\n运行\n实现优化\n装饰节点\n前置条件\n黑板变量",
        "suggested_text": "行为树\n- 执行节点/叶子节点\n  - 行为节点\n  - 条件节点\n- 控制节点\n  - 序列节点（Sequence）\n  - 选择器（Selector）\n  - 并行节点（Parallel）\n- 实现优化\n  - 装饰节点\n  - 前置条件\n  - 黑板变量",
        "reason": "整理层级结构，修正\"DN3\"为OCR误识别，添加英文对照",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781817252",
        "parent_id": "node_0283",
        "parent_text": "寻路",
        "original_text": "进阶内容：寻路网格生成\n体素化\n区域分割\n分水岭算法\n网格生成\n高级特性\n多边形标记\n分块\n网格外链接Off-mesh link",
        "suggested_text": "进阶：寻路网格生成\n- 体素化\n- 区域分割\n  - 分水岭算法\n- 网格生成\n- 高级特性\n  - 多边形标记\n  - 分块\n  - 网格外链接（Off-mesh link）",
        "reason": "整理层级结构，添加英文对照",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781937231",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "界面(GUI)\nUI模式\n即时模式（IMGUI）\n保留模式（RMGUI）\n\n架构模式\nMVC\nMVP\nMVVM",
        "suggested_text": "界面（GUI）\n- UI模式\n  - 即时模式（IMGUI）\n  - 保留模式（RMGUI）\n- 架构模式\n  - MVC\n  - MVP\n  - MVVM",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775781961092",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "C++代码反射\n代码分析\n抽象语法树（AST）\nClang\n反射信息收集\nTags\n代码生成\n代码渲染\nMustache\n运行时反射信息注册",
        "suggested_text": "C++代码反射\n- 代码分析\n  - 抽象语法树（AST）\n  - Clang\n- 反射信息收集\n  - Tags\n- 代码生成\n  - 代码渲染\n  - Mustache\n- 运行时反射信息注册",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782035467",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "插件\n架构\nPlugin Manager\nInterfaces\nSDK\n版本控制",
        "suggested_text": "插件系统\n- 架构\n  - Plugin Manager\n  - Interfaces\n  - SDK\n- 版本控制",
        "reason": "添加标题说明，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782041861",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "鲁棒性设计\nCommand模式\n定义\nUID\n序列化与反序列化\n基础command类型\nAdd\nDelete\nUpdate",
        "suggested_text": "鲁棒性设计\n- Command模式\n  - 定义\n  - UID\n  - 序列化与反序列化\n- 基础Command类型\n  - Add\n  - Delete\n  - Update",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782058942",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "协同编辑\n资产拆分\n按逻辑分层\n按位置分块\nOne File\nOne File Per Actor\n在一个场\n在一个场景内协同编辑\n同步操作\n分布式操作\n分布式操作的一致性问题\n锁\n实例锁\n资产锁\n操",
        "suggested_text": "协同编辑\n- 资产拆分\n  - 按逻辑分层\n  - 按位置分块\n  - One File\n  - One File Per Actor\n- 在一个场景内协同编辑\n- 同步操作\n- 分布式操作\n  - 一致性问题\n  - 锁\n    - 实例锁\n    - 资产锁",
        "reason": "整理层级结构，移除OCR误识别的不完整内容",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782099914",
        "parent_id": "node_0286",
        "parent_text": "Machine Learning（机器学习：ML）",
        "original_text": "监督学习\n无监督学习\n半监督学习\n强化学习\n马尔可夫决策过程\n状态\n动作\n奖励\n累计奖励最大\n如何利用强化学习构建AI\n状态抽象\n长度固定的统计变量\n长度不固定的序列数据\n图像数据\n动作抽象\n奖励设置",
        "suggested_text": "机器学习类型\n- 监督学习\n- 无监督学习\n- 半监督学习\n- 强化学习\n  - 马尔可夫决策过程\n    - 状态\n    - 动作\n    - 奖励\n    - 累计奖励最大\n  - 如何利用强化学习构建AI\n    - 状态抽象\n    - 动作抽象\n    - 奖励设置",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782147517",
        "parent_id": "node_0287",
        "parent_text": "Monte Carlo Tree Search（蒙特卡洛树搜索；MCTS）",
        "original_text": "EN\n思考\n选择\nTree Policy\nUCB公式\n平衡开发与探索问题\n拓展\n仿真+评估\nRollout Policy\n评估函数\n反向传播",
        "suggested_text": "MCTS流程\n- 选择（Selection）\n  - Tree Policy\n  - UCB公式\n  - 平衡开发与探索问题\n- 拓展（Expansion）\n- 仿真+评估（Simulation）\n  - Rollout Policy\n  - 评估函数\n- 反向传播（Backpropagation）",
        "reason": "修正\"EN\"为MCTS流程标题，整理四个步骤的层级结构",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782189944",
        "parent_id": "node_0288",
        "parent_text": "Goal-Orientated Action Planner（目标导向的动作规划器；GOAP）",
        "original_text": "目标集\n对WorldState中的部分属性做是否满足的判断\n动作集\n前提条件\n动作损耗\n动作影响\n对WorldState的改变描述\n逆向规划",
        "suggested_text": "GOAP（目标导向动作规划器）\n- 目标集\n  - 对WorldState中的部分属性做是否满足的判断\n- 动作集\n  - 前提条件\n  - 动作损耗\n  - 动作影响\n  - 对WorldState的改变描述\n- 逆向规划",
        "reason": "添加标题缩写，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782204258",
        "parent_id": "node_0289",
        "parent_text": "AI Planning",
        "original_text": "Hierarchical Tasks Network\n（分层任务网络：HTN）\n原子任务\n前提条件\n动作影响\n对WorldState的改变描述\n复合任务\n前提条件\n拆分方法",
        "suggested_text": "HTN（分层任务网络）\n- 原子任务\n  - 前提条件\n  - 动作影响\n  - 对WorldState的改变描述\n- 复合任务\n  - 前提条件\n  - 拆分方法",
        "reason": "简化标题，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782308962",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "设计\n数据结构设计\n数据定义 (Schema)\n基础元素\n继承\n引用\n两种设计方式\n独立的schema定义文件\nna定义文件\n代码内部定义\n不同场景下的引擎数据\n引擎数据\nRuntime\nStorag",
        "suggested_text": "数据结构设计\n- 数据定义（Schema）\n  - 基础元素\n  - 继承\n  - 引用\n- 两种设计方式\n  - 独立的schema定义文件\n  - 代码内部定义\n- 不同场景下的引擎数据\n  - Runtime\n  - Storage",
        "reason": "整理层级结构，修正OCR错误（\"na定义文件\"、\"Storag\"），移除重复标题",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782413243",
        "parent_id": "node_0290",
        "parent_text": "状态同步",
        "original_text": "流程的阶段拆分\nAuthorized\neg.开火\nServer\n收到开火请求，同步给玩家\nReplicated\n模拟Authorized开火",
        "suggested_text": "流程的阶段拆分\n- Authorized\n  - eg. 开火\n- Server\n  - 收到开火请求，同步给玩家\n- Replicated\n  - 模拟Authorized开火",
        "reason": "整理层级结构，使流程更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782457130",
        "parent_id": "node_0285",
        "parent_text": "工具链",
        "original_text": "资产管理\n资产格式\n文本（Text)\n二进制（Binary)\n资产加载\n序列化与反序列化\n版本兼容\n资产结构设计\n资产引用\n资产实例\n数据拷贝\n数据继承",
        "suggested_text": "资产管理\n- 资产格式\n  - 文本（Text）\n  - 二进制（Binary）\n- 资产加载\n  - 序列化与反序列化\n  - 版本兼容\n- 资产结构设计\n  - 资产引用\n  - 资产实例\n  - 数据拷贝\n  - 数据继承",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782545407",
        "parent_id": "node_0291",
        "parent_text": "插值、内插值&外插值",
        "original_text": "内插值\n实现方法\n缓存玩家位置\n利用缓存之间的位置进行插值\n问题\n物体移动速度较大时容易产生结果判断不一致",
        "suggested_text": "内插值\n- 实现方法\n  - 缓存玩家位置\n  - 利用缓存之间的位置进行插值\n- 问题\n  - 物体移动速度较大时容易产生结果判断不一致",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782594322",
        "parent_id": "node_0292",
        "parent_text": "如何做判定",
        "original_text": "客户端判定\n基本流程\n洁果\n客户端判定命中结果\n服务器做命中的校验\n交验\n优势\n命中位置精准，像素级\n象素级\n问题\n容易作",
        "suggested_text": "客户端判定\n- 基本流程\n  - 客户端判定命中结果\n  - 服务器做命中的校验\n- 优势\n  - 命中位置精准，像素级\n- 问题\n  - 容易作弊",
        "reason": "整理层级结构，修正OCR错误（\"洁果\"、\"交验\"、\"象素级\"、\"容易作\"）",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782629128",
        "parent_id": "node_0293",
        "parent_text": "延迟补偿（服务器判定）",
        "original_text": "延迟补偿\n原因\n因为有延迟，也就是开枪打中了敌人过去的位置\n等到开枪事件到达服务器上，敌人已经不再开枪的位置了\n在服务器上，回溯到你开枪时候敌人的真实位置做判定\n一切以服务器为准：开枪的时间，回溯到开",
        "suggested_text": "延迟补偿\n- 原因\n  - 有延迟时，开枪打中了敌人过去的位置\n  - 开枪事件到达服务器时，敌人已不在开枪位置\n- 解决方案\n  - 在服务器上回溯到开枪时敌人的真实位置做判定\n  - 一切以服务器为准",
        "reason": "整理层级结构，修正表述，移除不完整的OCR内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782695777",
        "parent_id": "node_0293",
        "parent_text": "延迟补偿（服务器判定）",
        "original_text": "延迟补偿的问题\n拐角问题\n拐角\n进入拐角问题\nPeekerandholder问题（探头打人）\n解决（能够减缓，不能消除）\n添加前摇\n添加特效\n客户端预测命中过程\n不触发命中结果\n命中结果等待服务器返回",
        "suggested_text": "延迟补偿的问题\n- 拐角问题\n  - Peeker's Advantage（探头打人）\n- 解决方案（能够减缓，不能消除）\n  - 添加前摇\n  - 添加特效\n  - 客户端预测命中过程\n  - 命中结果等待服务器返回",
        "reason": "整理层级结构，修正\"Peekerandholder\"为\"Peeker's Advantage\"",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782759484",
        "parent_id": "node_0294",
        "parent_text": "角色位移同步",
        "original_text": "内插值和外插值的使用场景\n内插值的使用场景\n角色的移动不符合真实世界的物理模型加速度非常大\n对于角色位置的精度要求很高\n典型例子：FPS类游戏\n外插值的使用场景、\n游戏对象的移动遵守物理规则，加速度不",
        "suggested_text": "内插值和外插值的使用场景\n- 内插值使用场景\n  - 角色移动不符合真实物理模型，加速度大\n  - 对角色位置精度要求高\n  - 典型例子：FPS类游戏\n- 外插值使用场景\n  - 游戏对象移动遵守物理规则",
        "reason": "整理层级结构，移除不完整的OCR内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775782770536_jkqfwchu6",
        "parent_id": "node_0295",
        "parent_text": "外插值",
        "original_text": "外插值的实现方法（航位推算）\n投影速度混合法\n使用归一化参数平滑运动轨迹\n外插值的碰撞处理\n发生碰撞的时刻让客户端接管物理模拟",
        "suggested_text": "外插值实现方法（航位推算）\n- 投影速度混合法\n- 使用归一化参数平滑运动轨迹\n- 外插值的碰撞处理\n  - 发生碰撞时让客户端接管物理模拟",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782800750",
        "parent_id": "node_0290",
        "parent_text": "状态同步",
        "original_text": "CO\n如何解决延迟\n哑客户端（客户端不做预测）\n发出移动请求\n等待服务器回复\n收到服务器回复，并作出移动\n解决\n客户端预测\n客户端发送移动请求后，在收到服务器回复之前，就根据现有状态对未来的移动做出预",
        "suggested_text": "如何解决延迟\n- 哑客户端（客户端不做预测）\n  - 发出移动请求\n  - 等待服务器回复\n  - 收到服务器回复后移动\n- 客户端预测\n  - 发送移动请求后，在收到服务器回复前，根据现有状态预测未来移动",
        "reason": "移除\"CO\"误识别，整理层级结构，补全被截断的内容",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782833059",
        "parent_id": "node_0296",
        "parent_text": "帧同步",
        "original_text": "不一致问题的定位方法\n定时上传游戏数据checksum\n定时上传游戏\n如果不同玩家\n如果不同玩家checksun不一致\n上传游戏玩家\n上传游戏玩家最近一段时间的游戏日志\n通过对比进行定位",
        "suggested_text": "不一致问题的定位方法\n- 定时上传游戏数据checksum\n- 如果不同玩家checksum不一致\n  - 上传玩家最近一段时间的游戏日志\n  - 通过对比进行定位",
        "reason": "整理层级结构，修正\"checksun\"为\"checksum\"，移除重复内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782936219",
        "parent_id": "node_0296",
        "parent_text": "帧同步",
        "original_text": "顿同步的优缺点\n优点\n低带宽\n开发效率高\n缺点\n确定性实现困难\n作弊（全图挂）问题较难避免\n断线重连需要优化",
        "suggested_text": "帧同步的优缺点\n- 优点\n  - 低带宽\n  - 开发效率高\n- 缺点\n  - 确定性实现困难\n  - 作弊（全图挂）问题较难避免\n  - 断线重连需要优化",
        "reason": "修正\"顿同步\"为\"帧同步\"，整理层级结构",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775782988112",
        "parent_id": "node_0506",
        "parent_text": "掉线与重连问题",
        "original_text": "掉线重连的基本流程\n掉线\n重连\n接收游戏开始到现在所有请求\n追帧\n重连的问题：耗时\n重连的优化\n大重连（客户端崩溃，内存中无数据）\n通过快照，加速重连\n客户端定时快照，关键帧快照，序列化到磁盘\n服务器",
        "suggested_text": "掉线重连的基本流程\n- 掉线\n- 重连\n  - 接收游戏开始到现在所有请求\n  - 追帧\n- 重连的问题：耗时\n- 重连的优化\n  - 大重连（客户端崩溃）\n  - 通过快照加速重连\n  - 客户端定时快照，序列化到磁盘",
        "reason": "整理层级结构，移除不完整的OCR内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775783085372_1sl38dj8y",
        "parent_id": "node_0297",
        "parent_text": "网络",
        "original_text": "网络基础",
        "suggested_text": "网络基础",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775783089376_t3f90l4rl",
        "parent_id": "ocr_manual_1775783085372_1sl38dj8y",
        "parent_text": "网络基础",
        "original_text": "网络协议",
        "suggested_text": "网络协议",
        "reason": "原文正确，无需修改",
        "confidence": 0.99,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783117647",
        "parent_id": "node_0298",
        "parent_text": "面向数据编程与任务系统",
        "original_text": "实体-组件-系统\nECS",
        "suggested_text": "实体-组件-系统（ECS）",
        "reason": "添加英文缩写格式",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783174893",
        "parent_id": "node_0299",
        "parent_text": "P2P特点",
        "original_text": "客户端之间互相通信\n客户端承担游戏\n优点\n一个客户端挂掉\r\n一个客户端挂掉，不影响其他玩家\n不依赖于服务器\n缺点\n易作弊\n需要良好的网络连接\n玩家人数受限",
        "suggested_text": "P2P模式\n- 客户端之间互相通信\n- 客户端承担游戏逻辑\n- 优点\n  - 一个客户端挂掉不影响其他玩家\n  - 不依赖于服务器\n- 缺点\n  - 易作弊\n  - 需要良好的网络连接\n  - 玩家人数受限",
        "reason": "整理层级结构，移除重复内容",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783186347",
        "parent_id": "node_0300",
        "parent_text": "DS特点",
        "original_text": "具有权威性\n负责模拟整个游戏世界\n负责分发数据给每个玩家\n具备高性能\n优点\n反作弊易实现\n能让更多的玩家一同游戏\n网络状态\n游戏响应不取决于每个玩家的网络状态\n缺点\n服务器花费较高\n服务端承担更多的逻",
        "suggested_text": "专用服务器（DS）特点\n- 具有权威性\n- 负责模拟整个游戏世界\n- 负责分发数据给每个玩家\n- 优点\n  - 反作弊易实现\n  - 能让更多玩家一同游戏\n  - 游戏响应不取决于每个玩家的网络状态\n- 缺点\n  - 服务器花费较高\n  - 服务端承担更多逻辑",
        "reason": "添加标题说明，整理层级结构，移除不完整的OCR内容",
        "confidence": 0.92,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775783215897_9hj5q821f",
        "parent_id": "node_0297",
        "parent_text": "网络",
        "original_text": "游戏优化",
        "suggested_text": "游戏网络优化",
        "reason": "补充完整标题",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783266727",
        "parent_id": "node_0301",
        "parent_text": "分布式系统",
        "original_text": "分式系统挑战\n互斥问题\n等性\n故障与部分失效\n不可靠的网络\n分布式问题传染\n一致性和共识算法\n分布式事务\n均衡\n负载均衡\n直机\n随机\n仑询\n轮询\n一致性哈希\n发现\n服务发现\nEtcd\nZookeepe",
        "suggested_text": "分布式系统挑战\n- 互斥问题\n- 故障与部分失效\n- 不可靠的网络\n- 一致性和共识算法\n- 分布式事务\n- 负载均衡\n  - 随机\n  - 轮询\n  - 一致性哈希\n- 服务发现\n  - Etcd\n  - Zookeeper",
        "reason": "修正\"分式系统\"为\"分布式系统\"，整理层级结构，修正OCR错误（\"等性\"、\"直机\"、\"仑询\"、\"Zookeepe\"）",
        "confidence": 0.88,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783277511",
        "parent_id": "node_0302",
        "parent_text": "服务器架构",
        "original_text": "可扩展\n可扩展游戏世界\n实\n实现方案\nZoning\n在大世界中将大量玩家分布\n分布可能不是很均匀\nInstancing\n独立运行大量的游戏区域\n减少拥挤、竞争\nReplication\n允许大量玩家高度",
        "suggested_text": "可扩展游戏世界\n- Zoning\n  - 在大世界中将大量玩家分布\n  - 分布可能不均匀\n- Instancing\n  - 独立运行大量游戏区域\n  - 减少拥挤、竞争\n- Replication\n  - 允许大量玩家高度互动",
        "reason": "整理层级结构，移除OCR误识别内容，补全被截断的内容",
        "confidence": 0.90,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783398340",
        "parent_id": "node_0303",
        "parent_text": "如何让游戏世界动起来",
        "original_text": "基于对象的更新Object-basedtick\n基于组件的更新Component-basedtick\n事件机制\n（基本概念）",
        "suggested_text": "游戏更新方式\n- 基于对象的更新（Object-based tick）\n- 基于组件的更新（Component-based tick）\n- 事件机制（基本概念）",
        "reason": "添加标题说明，整理格式，添加英文对照",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "ocr_manual_1775783446775_5pkan6mqs",
        "parent_id": "node_0304",
        "parent_text": "游戏引擎的分层架构",
        "original_text": "为什么要分层\n减少耦合，降低复杂度\n上层无需知道下层的具体实现\n应对不同的需求变化",
        "suggested_text": "为什么要分层\n- 减少耦合，降低复杂度\n- 上层无需知道下层的具体实现\n- 应对不同的需求变化",
        "reason": "整理为列表格式",
        "confidence": 0.98,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783456190",
        "parent_id": "node_0305",
        "parent_text": "功能层",
        "original_text": "GameTick控制各系统周期性更新\n为游戏引擎提供核心功能模块\n多核多线程架构趋势",
        "suggested_text": "功能层职责\n- GameTick控制各系统周期性更新\n- 为游戏引擎提供核心功能模块\n- 多核多线程架构趋势",
        "reason": "添加标题说明，整理为列表格式",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775783467953",
        "parent_id": "node_0306",
        "parent_text": "资源层",
        "original_text": "GUID\n运行时资源管理\n虚拟文件系统\nHandle\n资源生命周期\n不同资源有不同的生命周期\n尽可能减少资源的内存申请与释放\n垃圾回收",
        "suggested_text": "资源层\n- GUID\n- 运行时资源管理\n- 虚拟文件系统\n- Handle\n- 资源生命周期\n  - 不同资源有不同生命周期\n  - 尽可能减少资源的内存申请与释放\n- 垃圾回收",
        "reason": "整理层级结构，使内容更清晰",
        "confidence": 0.95,
        "status": "pending"
    },
    {
        "node_id": "merged_1775790301402",
        "parent_id": "node_0257",
        "parent_text": "动画技术基础",
        "original_text": "动画压缩\n动画片段存储\n动画数据尺寸\n动画轨道（track）数据之间的差别\n关节动画数据之间的差别\nDoF缩减\n关键帧\n关键帧提取\n浮点数压缩\n四元数压缩\n误差累积\n精读衡量\n误差补偿\n动画重定向\n重",
        "suggested_text": "动画压缩\n- 动画片段存储\n  - 动画数据尺寸\n  - 动画轨道（track）数据之间的差别\n  - 关节动画数据之间的差别\n- DoF缩减\n- 关键帧\n  - 关键帧提取\n  - 浮点数压缩\n  - 四元数压缩\n- 误差处理\n  - 误差累积\n  - 精度衡量\n  - 误差补偿\n- 动画重定向",
        "reason": "整理层级结构，修正\"精读\"为\"精度\"，移除不完整的OCR内容",
        "confidence": 0.92,
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
