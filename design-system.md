# OCR Pipeline 设计规范文档

**文档版本**: 1.0
**创建日期**: 2026-04-08
**适用范围**: HTML 复核界面

---

## 一、设计原则

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **简洁高效** | 工具型界面，追求操作效率，减少视觉干扰 |
| **长时间使用** | 低对比度配色，避免视觉疲劳 |
| **信息分层** | 主视图为核心，工具栏/面板辅助，层次分明 |
| **即时反馈** | 任何操作立即响应，无感知延迟 |

### 1.2 设计风格

- **风格定位**: 专业工具型界面，偏向技术产品
- **视觉基调**: 冷色调为主，中性灰为基底，功能色点缀
- **图标风格**: 线性图标，2px 描边，圆角处理

---

## 二、色彩系统

### 2.1 基础色板

```
┌─────────────────────────────────────────────────────────────┐
│                      基础色板                                │
├─────────────────────────────────────────────────────────────┤
│  白色      #FFFFFF  ■■■■■  背景色、卡片背景                  │
│  浅灰 50   #FAFAFA  ■■■■■  页面背景                          │
│  浅灰 100  #F5F5F5  ■■■■■  分割线、禁用背景                  │
│  浅灰 200  #E5E5E5  ■■■■■  边框、分割线                      │
│  灰色 300  #D4D4D4  ■■■■■  禁用边框                          │
│  灰色 400  #A3A3A3  ■■■■■  占位符文本                        │
│  灰色 500  #737373  ■■■■■  次要文本                          │
│  灰色 600  #525252  ■■■■■  正文文本                          │
│  灰色 700  #404040  ■■■■■  标题文本                          │
│  灰色 800  #262626  ■■■■■  深色背景                          │
│  灰色 900  #171717  ■■■■■  最深文本                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 主色（Primary）

```
┌─────────────────────────────────────────────────────────────┐
│                      主色系统                                │
├─────────────────────────────────────────────────────────────┤
│  Primary 50   #F0F9FF   背景浅色                             │
│  Primary 100  #E0F2FE   Hover 背景色                         │
│  Primary 200  #BAE6FD   激活背景色                           │
│  Primary 300  #7DD3FC   边框色                               │
│  Primary 400  #38BDF8   图标、次要按钮                       │
│  Primary 500  #0EA5E9   主要按钮、链接（默认）               │
│  Primary 600  #0284C7   主要按钮 Hover                       │
│  Primary 700  #0369A1   主要按钮 Active                      │
│  Primary 800  #075985   深色变体                             │
│  Primary 900  #0C4A6E   最深变体                             │
└─────────────────────────────────────────────────────────────┘
```

**主色使用场景**:
- 主要操作按钮（导出、确认）
- 链接文本
- 选中状态边框/背景
- 工具栏激活状态

### 2.3 功能色

#### 2.3.1 成功色（Success）

```
┌─────────────────────────────────────────────────────────────┐
│  Success 50   #F0FDF4   成功背景浅色                         │
│  Success 100  #DCFCE7   成功背景色                           │
│  Success 500  #22C55E   成功图标、确认状态                   │
│  Success 600  #16A34A   Success Hover                        │
│  Success 700  #15803D   Success Active                       │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 警告色（Warning）

```
┌─────────────────────────────────────────────────────────────┐
│  Warning 50   #FFFBEB   警告背景浅色                         │
│  Warning 100  #FEF3C7   警告背景色                           │
│  Warning 500  #F59E0B   警告图标、提示状态                   │
│  Warning 600  #D97706   Warning Hover                        │
│  Warning 700  #B45309   Warning Active                       │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.3 错误色（Error）

```
┌─────────────────────────────────────────────────────────────┐
│  Error 50     #FEF2F2   错误背景浅色                         │
│  Error 100    #FEE2E2   错误背景色                           │
│  Error 500    #EF4444   错误图标、危险操作                   │
│  Error 600    #DC2626   Error Hover                          │
│  Error 700    #B91C1C   Error Active                         │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.4 信息色（Info）

```
┌─────────────────────────────────────────────────────────────┐
│  Info 50      #EFF6FF   信息背景浅色                         │
│  Info 100     #DBEAFE   信息背景色                           │
│  Info 500     #3B82F6   信息图标、提示                       │
│  Info 600     #2563EB   Info Hover                           │
│  Info 700     #1D4ED8   Info Active                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 问题类型色

用于问题卡片和节点标注框的视觉区分：

```
┌─────────────────────────────────────────────────────────────┐
│                    问题类型色                                │
├─────────────────────────────────────────────────────────────┤
│  低置信度    #F59E0B   黄色    置信度低于阈值               │
│  孤立节点    #EF4444   红色    无父节点的节点               │
│  弱连接      #F59E0B   黄色    边分数低于阈值               │
│  超大节点    #F97316   橙色    节点尺寸超过阈值             │
│  正常节点    #0EA5E9   主色    正常状态                     │
└─────────────────────────────────────────────────────────────┘
```

**问题标注框样式**:
| 问题类型 | 边框颜色 | 边框样式 | 背景 |
|---------|---------|---------|------|
| 低置信度 | Warning 500 | 实线 2px | Warning 50, 20% 透明度 |
| 孤立节点 | Error 500 | 实线 2px | Error 50, 20% 透明度 |
| 弱连接 | Warning 500 | 虚线 2px | Warning 50, 20% 透明度 |
| 超大节点 | #F97316 | 实线 2px | #FFF7ED, 20% 透明度 |

---

## 三、排版系统

### 3.1 字体家族

```css
/* 主字体 - 中文/英文界面 */
--font-family-base: "Inter", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* 等宽字体 - 代码/数据展示 */
--font-family-mono: "JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace;
```

**字体说明**:
- **Inter**: 现代无衬线字体，清晰易读，适合界面文本
- **PingFang SC / Microsoft YaHei**: 中文备选字体
- **JetBrains Mono**: 等宽字体，用于置信度数值、节点 ID 等

### 3.2 字号系统

```
┌─────────────────────────────────────────────────────────────┐
│                      字号等级                                │
├──────────┬────────┬────────┬────────────────────────────────┤
│  名称     │  字号   │  行高   │  使用场景                     │
├──────────┼────────┼────────┼────────────────────────────────┤
│  xs      │  12px   │  16px   │  辅助信息、标签、时间戳       │
│  sm      │  13px   │  18px   │  次要文本、描述               │
│  base    │  14px   │  20px   │  正文文本（默认）             │
│  md      │  15px   │  22px   │  重要正文                     │
│  lg      │  16px   │  24px   │  小标题、卡片标题             │
│  xl      │  18px   │  28px   │  模块标题                     │
│  2xl     │  20px   │  28px   │  页面副标题                   │
│  3xl     │  24px   │  32px   │  页面主标题                   │
└──────────┴────────┴────────┴────────────────────────────────┘
```

### 3.3 字重系统

```
┌─────────────────────────────────────────────────────────────┐
│                      字重等级                                │
├──────────┬────────┬────────────────────────────────────────┤
│  名称     │  值     │  使用场景                             │
├──────────┼────────┼────────────────────────────────────────┤
│  normal  │  400    │  正文文本                             │
│  medium  │  500    │  列表项标题、标签                     │
│  semibold│  600    │  卡片标题、小标题                     │
│  bold    │  700    │  页面标题、强调文本                   │
└──────────┴────────┴────────────────────────────────────────┘
```

### 3.4 文本颜色

```css
--text-primary: #171717;      /* 主要文本 - 标题、正文 */
--text-secondary: #525252;    /* 次要文本 - 描述、辅助信息 */
--text-tertiary: #737373;     /* 三级文本 - 占位符、禁用 */
--text-disabled: #A3A3A3;     /* 禁用文本 */
--text-link: #0EA5E9;         /* 链接文本 */
--text-link-hover: #0284C7;   /* 链接 Hover */
```

---

## 四、间距系统

### 4.1 间距等级

```
┌─────────────────────────────────────────────────────────────┐
│                      间距等级                                │
├──────────┬────────┬────────────────────────────────────────┤
│  名称     │  值     │  使用场景                             │
├──────────┼────────┼────────────────────────────────────────┤
│  space-0 │  0px    │  无间距                               │
│  space-1 │  4px    │  紧凑间距、图标与文字间距             │
│  space-2 │  8px    │  元素内间距、小间距                   │
│  space-3 │  12px   │  元素间距、列表项间距                 │
│  space-4 │  16px   │  组件间距、卡片内边距                 │
│  space-5 │  20px   │  模块间距                             │
│  space-6 │  24px   │  区块间距、面板内边距                 │
│  space-8 │  32px   │  大区块间距                           │
│  space-10│  40px   │  页面边距                             │
│  space-12│  48px   │  页面区块间距                         │
└──────────┴────────┴────────────────────────────────────────┘
```

### 4.2 常用组合

| 场景 | Padding | Margin | Gap |
|------|---------|--------|-----|
| 按钮内边距 | 8px 16px | - | - |
| 卡片内边距 | 16px | - | 12px |
| 列表项内边距 | 12px 16px | - | - |
| 工具栏内边距 | 8px 12px | - | 8px |
| 面板内边距 | 16px | - | 16px |
| 页面边距 | - | 24px | - |

---

## 五、圆角系统

### 5.1 圆角等级

```
┌─────────────────────────────────────────────────────────────┐
│                      圆角等级                                │
├──────────┬────────┬────────────────────────────────────────┤
│  名称     │  值     │  使用场景                             │
├──────────┼────────┼────────┼────────────────────────────────┤
│  radius-none│ 0px   │  无圆角                               │
│  radius-sm │  4px    │  小元素、标签、徽章                 │
│  radius-md │  6px    │  按钮、输入框                       │
│  radius-lg │  8px    │  卡片、下拉框                       │
│  radius-xl │  12px   │  大卡片、模态框                     │
│  radius-full│ 9999px │  圆形元素、药丸形标签               │
└──────────┴────────┴────────┴────────────────────────────────┘
```

### 5.2 圆角应用

| 组件 | 圆角值 |
|------|--------|
| 按钮 | 6px |
| 输入框 | 6px |
| 标签（Tag） | 4px |
| 卡片 | 8px |
| 模态框 | 12px |
| 节点标注框 | 4px |
| 问题卡片 | 8px |

---

## 六、阴影系统

### 6.1 阴影等级

```css
/* 卡片阴影 - 轻微浮起 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* 卡片阴影 - 标准浮起 */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

/* 下拉框/模态框阴影 */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* 悬浮层阴影 */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

/* 内阴影 - 输入框聚焦 */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

/* 主色聚焦阴影 */
--shadow-focus: 0 0 0 3px rgba(14, 165, 233, 0.25);
```

### 6.2 阴影应用

| 组件 | 默认阴影 | Hover 阴影 |
|------|---------|-----------|
| 卡片 | shadow-sm | shadow-md |
| 下拉框 | shadow-lg | - |
| 模态框 | shadow-xl | - |
| 按钮（主要） | shadow-sm | shadow-md |
| 节点标注框 | 无 | shadow-md |

---

## 七、组件规范

### 7.1 按钮（Button）

#### 7.1.1 按钮类型

**主要按钮（Primary）**

```
┌─────────────────────────────────────────────────────────────┐
│  默认: 背景 #0EA5E9, 文字 #FFFFFF, 圆角 6px                 │
│  Hover: 背景 #0284C7, 阴影 shadow-md                        │
│  Active: 背景 #0369A1                                       │
│  Disabled: 背景 #E5E5E5, 文字 #A3A3A3, cursor: not-allowed  │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │   导出结果   │   │   确  认    │   │  保存更改   │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**次要按钮（Secondary）**

```
┌─────────────────────────────────────────────────────────────┐
│  默认: 背景 #F5F5F5, 文字 #404040, 边框 #E5E5E5             │
│  Hover: 背景 #E5E5E5, 边框 #D4D4D4                          │
│  Active: 背景 #D4D4D4                                       │
│  Disabled: 背景 #F5F5F5, 文字 #A3A3A3                       │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │    取  消    │   │   重  置    │   │   关  闭    │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**幽灵按钮（Ghost）**

```
┌─────────────────────────────────────────────────────────────┐
│  默认: 背景 transparent, 文字 #525252                       │
│  Hover: 背景 #F5F5F5                                        │
│  Active: 背景 #E5E5E5                                       │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐                         │
│  │   全部展开   │   │   清空筛选   │                         │
│  └─────────────┘   └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

**图标按钮（Icon Button）**

```
┌─────────────────────────────────────────────────────────────┐
│  默认: 背景 transparent, 图标 #737373                       │
│  Hover: 背景 #F5F5F5, 图标 #525252                          │
│  Active: 背景 #E5E5E5, 图标 #404040                         │
│  Disabled: 图标 #D4D4D4                                     │
│                                                             │
│  尺寸: 32x32px (小) | 36x36px (中) | 40x40px (大)          │
│                                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                             │
│  │ + │ │ - │ │ ↻ │ │ ⚙ │ │ ? │                             │
│  └───┘ └───┘ └───┘ └───┘ └───┘                             │
└─────────────────────────────────────────────────────────────┘
```

#### 7.1.2 按钮尺寸

| 尺寸 | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| Small | 28px | 6px 12px | 13px | 14px |
| Medium | 32px | 8px 16px | 14px | 16px |
| Large | 40px | 10px 20px | 15px | 18px |

#### 7.1.3 工具栏按钮组

```
┌─────────────────────────────────────────────────────────────┐
│  工具栏按钮组 - 带分割线                                    │
│                                                             │
│  ┌───┬───┬───┐ │ ┌───┬───┬───┐ │ ┌───┬───┐                 │
│  │ - │ + │   │ │ │ - │ + │   │ │ │   │   │                 │
│  └───┴───┴───┘   └───┴───┴───┘   └───┴───┘                 │
│   亮度调整        对比度调整      操作                       │
│                                                             │
│  分割线: 宽度 1px, 颜色 #E5E5E5, 高度 20px                  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 工具栏（Toolbar）

#### 7.2.1 工具栏布局

```
┌──────────────────────────────────────────────────────────────────┐
│  工具栏: [亮度 -] [亮度 +] [对比度 -] [对比度 +] [重置] [框选OCR] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [☀-] [☀+] │ [◐-] [◐+] │ [↻] │ [▢] [导出]                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│   亮度控制    对比度控制    重置   框选   导出                   │
│                                                                   │
│  背景色: #FFFFFF                                                 │
│  边框: 底部 1px solid #E5E5E5                                    │
│  内边距: 8px 16px                                                │
│  按钮间距: 8px                                                   │
│  按钮组间距: 16px                                                │
└──────────────────────────────────────────────────────────────────┘
```

#### 7.2.2 工具栏状态

| 状态 | 视觉表现 |
|------|---------|
| 默认 | 按钮默认样式 |
| 激活模式 | 按钮背景 Primary 100，图标 Primary 600 |
| 禁用 | 按钮置灰，cursor: not-allowed |
| Loading | 按钮显示旋转图标，禁用点击 |

### 7.3 卡片（Card）

#### 7.3.1 问题卡片

```
┌──────────────────────────────────────────────────────────────────┐
│  问题卡片                                                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ 孤立节点: "渲染管线"                          [定位]    │ │
│  │    无父节点                                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  结构:                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [图标] [问题类型]: "[节点文本]"                 [操作按钮]  │ │
│  │        [问题描述/详情]                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  样式:                                                           │
│  - 背景: #FFFFFF                                                │
│  - 圆角: 8px                                                    │
│  - 内边距: 12px 16px                                            │
│  - 左边框: 3px solid (问题类型色)                                │
│  - Hover: 背景 #FAFAFA, 阴影 shadow-sm                          │
└──────────────────────────────────────────────────────────────────┘
```

**问题卡片配色**:

| 问题类型 | 左边框颜色 | 图标颜色 |
|---------|-----------|---------|
| 低置信度 | #F59E0B | #F59E0B |
| 孤立节点 | #EF4444 | #EF4444 |
| 弱连接 | #F59E0B | #F59E0B |
| 超大节点 | #F97316 | #F97316 |

#### 7.3.2 节点卡片

```
┌──────────────────────────────────────────────────────────────────┐
│  节点卡片                                                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📁 亮度                              置信度: 0.95  [定位]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  结构:                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [图标] [节点文本]                    [置信度]   [操作按钮]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  样式:                                                           │
│  - 背景: #FFFFFF                                                │
│  - 圆角: 8px                                                    │
│  - 内边距: 10px 16px                                            │
│  - 边框: 1px solid #E5E5E5                                      │
│  - Hover: 背景 #F5F5F5, 边框 #D4D4D4                            │
│  - 选中: 背景 Primary 50, 边框 Primary 300                      │
└──────────────────────────────────────────────────────────────────┘
```

### 7.4 输入框（Input）

```
┌──────────────────────────────────────────────────────────────────┐
│  输入框                                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  默认:                                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [搜索节点...]                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  边框: 1px solid #D4D4D4, 圆角: 6px, 内边距: 8px 12px           │
│                                                                   │
│  Hover: 边框 #A3A3A3                                            │
│                                                                   │
│  Focus:                                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [搜索节点...]                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  边框: 2px solid #0EA5E9, 阴影: shadow-focus                    │
│                                                                   │
│  Disabled:                                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [搜索节点...]                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  背景: #F5F5F5, 边框: 1px solid #E5E5E5, 文字: #A3A3A3         │
│                                                                   │
│  带图标:                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 | 搜索节点...                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  图标: 16px, 颜色 #737373, 与输入框左边距 12px                   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.5 标签/徽章（Tag/Badge）

```
┌──────────────────────────────────────────────────────────────────┐
│  标签                                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  默认标签:                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ 低置信度  │ │ 孤立节点  │ │ 超大节点  │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
│                                                                   │
│  圆角: 4px, 内边距: 2px 8px, 字号: 12px                          │
│                                                                   │
│  颜色方案:                                                       │
│  ┌──────────┐ 背景: Warning 100, 文字: Warning 700              │
│  │ 低置信度  │                                                   │
│  └──────────┘                                                   │
│  ┌──────────┐ 背景: Error 100, 文字: Error 700                  │
│  │ 孤立节点  │                                                   │
│  └──────────┘                                                   │
│  ┌──────────┐ 背景: #FFF7ED, 文字: #C2410C                      │
│  │ 超大节点  │                                                   │
│  └──────────┘                                                   │
│                                                                   │
│  数字徽章:                                                       │
│  ┌───┐                                                          │
│  │ 3 │  背景: Primary 500, 文字: #FFFFFF, 圆角: full            │
│  └───┘  尺寸: 20x20px, 字号: 12px                                │
└──────────────────────────────────────────────────────────────────┘
```

### 7.6 提示框（Tooltip）

```
┌──────────────────────────────────────────────────────────────────┐
│  提示框                                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│           ┌─────────────────────┐                               │
│           │ 框选区域进行OCR补录  │                               │
│           └─────────────────────┘                               │
│                    ▲                                            │
│                    │                                            │
│              [框选OCR]按钮                                      │
│                                                                   │
│  样式:                                                           │
│  - 背景: #262626                                                │
│  - 文字: #FFFFFF                                                │
│  - 圆角: 6px                                                    │
│  - 内边距: 6px 10px                                             │
│  - 字号: 13px                                                   │
│  - 阴影: shadow-lg                                              │
│  - 出现延迟: 500ms                                              │
│  - 消失延迟: 100ms                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 八、交互状态

### 8.1 Hover 状态

| 组件 | 默认 | Hover |
|------|------|-------|
| 按钮（主要） | 背景 Primary 500 | 背景 Primary 600, 阴影 shadow-md |
| 按钮（次要） | 背景 #F5F5F5 | 背景 #E5E5E5 |
| 图标按钮 | 背景 transparent | 背景 #F5F5F5 |
| 卡片 | 背景 #FFFFFF | 背景 #FAFAFA, 阴影 shadow-sm |
| 链接 | 文字 Primary 500 | 文字 Primary 600, 下划线 |
| 输入框 | 边框 #D4D4D4 | 边框 #A3A3A3 |

### 8.2 Active/Pressed 状态

| 组件 | 默认 | Active |
|------|------|--------|
| 按钮（主要） | 背景 Primary 500 | 背景 Primary 700 |
| 按钮（次要） | 背景 #F5F5F5 | 背景 #D4D4D4 |
| 图标按钮 | 背景 transparent | 背景 #E5E5E5 |
| 卡片 | 背景 #FFFFFF | 背景 #F5F5F5 |

### 8.3 Focus 状态

| 组件 | Focus 样式 |
|------|-----------|
| 按钮 | outline: none, shadow-focus |
| 输入框 | 边框 Primary 500, shadow-focus |
| 卡片（可点击） | 边框 Primary 300, shadow-focus |

### 8.4 Disabled 状态

| 组件 | Disabled 样式 |
|------|--------------|
| 按钮（主要） | 背景 #E5E5E5, 文字 #A3A3A3, cursor: not-allowed |
| 按钮（次要） | 背景 #F5F5F5, 文字 #A3A3A3, 边框 #E5E5E5 |
| 图标按钮 | 图标 #D4D4D4, cursor: not-allowed |
| 输入框 | 背景 #F5F5F5, 文字 #A3A3A3, 边框 #E5E5E5 |

### 8.5 Loading 状态

```
┌──────────────────────────────────────────────────────────────────┐
│  Loading 状态                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  按钮 Loading:                                                   │
│  ┌─────────────────────┐                                        │
│  │ ◌ 识别中...          │  禁用点击, 显示旋转图标              │
│  └─────────────────────┘                                        │
│                                                                   │
│  框选区域 Loading:                                               │
│  ┌───────────────────────┐                                      │
│  │                       │                                      │
│  │    ┌─────────────┐    │                                      │
│  │    │             │    │                                      │
│  │    │     ◌       │    │  半透明蒙层 + 旋转图标              │
│  │    │             │    │                                      │
│  │    └─────────────┘    │                                      │
│  │                       │                                      │
│  └───────────────────────┘                                      │
│                                                                   │
│  旋转动画: 360度旋转, duration 1s, linear infinite               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 九、动画规范

### 9.1 动画时长

| 类型 | 时长 | 缓动函数 | 使用场景 |
|------|------|---------|---------|
| 即时 | 0ms | - | 禁用状态切换 |
| 快速 | 100ms | ease-out | 平移、微交互 |
| 标准 | 200ms | ease-out | 缩放、淡入淡出 |
| 慢速 | 300ms | ease-out | 模态框、抽屉 |
| 强调 | 500ms | ease-in-out | 页面过渡 |

### 9.2 常用动画

**淡入淡出（Fade）**
```css
.fade-enter {
  opacity: 0;
}
.fade-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-out;
}
.fade-exit {
  opacity: 1;
}
.fade-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-out;
}
```

**缩放（Scale）**
```css
.scale-enter {
  opacity: 0;
  transform: scale(0.95);
}
.scale-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all 200ms ease-out;
}
```

**高亮闪烁（Highlight）**
```css
@keyframes highlight-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(14, 165, 233, 0); }
}
.highlight {
  animation: highlight-pulse 1s ease-out 2;
}
```

**旋转加载（Spinner）**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
}
```

---

## 十、CSS 变量定义

```css
:root {
  /* ===== 色彩系统 ===== */

  /* 基础灰色 */
  --color-white: #FFFFFF;
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-200: #E5E5E5;
  --color-gray-300: #D4D4D4;
  --color-gray-400: #A3A3A3;
  --color-gray-500: #737373;
  --color-gray-600: #525252;
  --color-gray-700: #404040;
  --color-gray-800: #262626;
  --color-gray-900: #171717;

  /* 主色 */
  --color-primary-50: #F0F9FF;
  --color-primary-100: #E0F2FE;
  --color-primary-200: #BAE6FD;
  --color-primary-300: #7DD3FC;
  --color-primary-400: #38BDF8;
  --color-primary-500: #0EA5E9;
  --color-primary-600: #0284C7;
  --color-primary-700: #0369A1;
  --color-primary-800: #075985;
  --color-primary-900: #0C4A6E;

  /* 成功色 */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;
  --color-success-700: #15803D;

  /* 警告色 */
  --color-warning-50: #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;

  /* 错误色 */
  --color-error-50: #FEF2F2;
  --color-error-100: #FEE2E2;
  --color-error-500: #EF4444;
  --color-error-600: #DC2626;
  --color-error-700: #B91C1C;

  /* 信息色 */
  --color-info-50: #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-500: #3B82F6;
  --color-info-600: #2563EB;
  --color-info-700: #1D4ED8;

  /* 问题类型色 */
  --color-issue-low-confidence: #F59E0B;
  --color-issue-orphan: #EF4444;
  --color-issue-weak-edge: #F59E0B;
  --color-issue-oversized: #F97316;

  /* 文本颜色 */
  --text-primary: #171717;
  --text-secondary: #525252;
  --text-tertiary: #737373;
  --text-disabled: #A3A3A3;
  --text-link: #0EA5E9;
  --text-link-hover: #0284C7;

  /* ===== 字体系统 ===== */
  --font-family-base: "Inter", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-family-mono: "JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace;

  /* 字号 */
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-md: 15px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;

  /* 行高 */
  --line-height-xs: 16px;
  --line-height-sm: 18px;
  --line-height-base: 20px;
  --line-height-md: 22px;
  --line-height-lg: 24px;
  --line-height-xl: 28px;
  --line-height-2xl: 28px;
  --line-height-3xl: 32px;

  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ===== 间距系统 ===== */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* ===== 圆角系统 ===== */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* ===== 阴影系统 ===== */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  --shadow-focus: 0 0 0 3px rgba(14, 165, 233, 0.25);

  /* ===== 动画时长 ===== */
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-emphasis: 500ms;

  /* ===== 缓动函数 ===== */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

  /* ===== Z-index 层级 ===== */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

---

## 十一、组件 CSS 参考

### 11.1 按钮 CSS

```css
/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 8px 16px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  user-select: none;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 主要按钮 */
.btn-primary {
  background-color: var(--color-primary-500);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
}

.btn-primary:active:not(:disabled) {
  background-color: var(--color-primary-700);
}

/* 次要按钮 */
.btn-secondary {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  border-color: var(--color-gray-200);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-200);
  border-color: var(--color-gray-300);
}

.btn-secondary:active:not(:disabled) {
  background-color: var(--color-gray-300);
}

/* 幽灵按钮 */
.btn-ghost {
  background-color: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-gray-100);
}

.btn-ghost:active:not(:disabled) {
  background-color: var(--color-gray-200);
}

/* 图标按钮 */
.btn-icon {
  padding: 8px;
  width: 32px;
  height: 32px;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}
```

### 11.2 卡片 CSS

```css
/* 卡片基础样式 */
.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
  transition: all var(--duration-fast) var(--ease-out);
}

.card:hover {
  background-color: var(--color-gray-50);
  box-shadow: var(--shadow-sm);
}

/* 问题卡片 */
.card-issue {
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--color-gray-300);
}

.card-issue--low-confidence {
  border-left-color: var(--color-issue-low-confidence);
}

.card-issue--orphan {
  border-left-color: var(--color-issue-orphan);
}

.card-issue--weak-edge {
  border-left-color: var(--color-issue-weak-edge);
}

.card-issue--oversized {
  border-left-color: var(--color-issue-oversized);
}

/* 节点卡片 */
.card-node {
  padding: 10px var(--space-4);
}

.card-node--selected {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-300);
}
```

### 11.3 输入框 CSS

```css
/* 输入框基础样式 */
.input {
  width: 100%;
  padding: 8px 12px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--text-primary);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:hover:not(:disabled) {
  border-color: var(--color-gray-400);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  border-width: 2px;
  padding: 7px 11px; /* 补偿边框宽度变化 */
  box-shadow: var(--shadow-focus);
}

.input:disabled {
  background-color: var(--color-gray-100);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* 带图标的输入框 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.input-wrapper .input {
  padding-left: 36px;
}
```

### 11.4 工具栏 CSS

```css
/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
}

/* 按钮组 */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* 分割线 */
.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: var(--color-gray-200);
  margin: 0 var(--space-2);
}
```

---

## 十二、响应式断点

```
┌─────────────────────────────────────────────────────────────┐
│                    响应式断点                               │
├──────────┬────────────┬────────────────────────────────────┤
│  名称     │  断点       │  使用场景                          │
├──────────┼────────────┼────────────────────────────────────┤
│  sm      │  640px     │  小屏幕                            │
│  md      │  768px     │  平板                              │
│  lg      │  1024px    │  小桌面                            │
│  xl      │  1280px    │  桌面                              │
│  2xl     │  1536px    │  大桌面                            │
└──────────┴────────────┴────────────────────────────────────┘
```

**注**: 本工具主要面向桌面用户，最低支持宽度 1024px。

---

**文档结束**
