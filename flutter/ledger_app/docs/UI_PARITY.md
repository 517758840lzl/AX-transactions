# Ledger · Web 原型 ↔ Flutter UI 对照

**Web 源**：`src/prototypes/ledger/style.css`、`index.tsx`  
**Flutter**：`flutter/ledger_app/lib/`（四 Tab 各自在 `lib/tabs/<tab>/`，共享组件在 `lib/widgets/`）  
**设计**：`src/themes/klarna-mobile/DESIGN.md`

变更 Web 视觉时 **必须先改本文档 + Flutter 组件 + CSS**，再验收截图对比。

## 设计 token

| CSS 变量 | Flutter | 值 |
| --- | --- | --- |
| `--pink` | `LedgerColors.pink` | `#FFB3C7` |
| `--ink` | `LedgerColors.ink` | `#0B051D` |
| `--black-surface` | `LedgerColors.blackSurface` | `#0B051D` |
| `--stage` | `LedgerColors.stage` | `#F3F0F4` |
| `--line` | `LedgerColors.line` | `#F0DDE3` |
| `--muted` | `LedgerColors.muted` | `#6E6878` |
| `--faint` | `LedgerColors.faint` | `#9B96A3` |
| `.ledger-review-btn.is-open` | `LedgerColors.reviewOpen` / `reviewOpenBg` | `#A9700E` / `rgba(169,112,14,0.14)` |
| hero 标签 / 脚注 | `onDarkMuted` / `onDarkSoft` | `rgba(255,255,255,0.62)` / `0.88` |
| `.ledger-budget-meta.is-over` | `LedgerColors.budgetOver` | `#A9700E` |
| `.ledger-budget-pace` | `LedgerTextStyles.budgetPace` | `#FFB3C7` 12px w700 |

## 字体颜色（全页）

- **唯一来源**：`lib/theme/ledger_text_styles.dart` + `LedgerColors`；页面与组件禁止手写 `TextStyle` 色值（`MoneyAmount`、主题 `TextTheme` 除外）。
- **正文 / 标题**：`ink` `#0B051D` — 页标题 `pageTitle`、panel/card 标题、流水主标题、金额（浅色底）、panel 头按钮（`LedgerPanelLink` → `panelAction` / `headAction`）。
- **次要说明**：`muted` `#6E6878` — 元信息、分组标签、空态、设置区段标题、筛选未选中。
- **输入占位**：`faint` `#9B96A3` — `inputHint`。
- **深色 hero**：标签 `heroLabel`、脚注 `heroFoot`；区间涨跌 `#8EE4B0` / `#FFB3C7`（`heroDeltaUp` / `heroDeltaDown`）。
- **列表涨跌**：`up` / `down`（账户行百分比）。
- **核对 chip**：未核对字 `#A9700E` + 浅底；已核对粉底 + `ink`（`LedgerReviewChip`）。
- **Theme**：`TextButtonTheme` 默认 `ink`，避免 Material 主题色污染「流水 / 编辑 / 全部标为已核对」等链接。

## 组件映射

| Web 类 / 组件 | Flutter | 状态 |
| --- | --- | --- |
| `.ledger-phone` max 390 | `ConstrainedBox(maxWidth: 390)` | ✅ |
| `.ledger-net-card` | `LedgerNetCard` / 账户 hero 内联 | ✅ |
| `.ledger-money--*` | `MoneyAmount` | ✅ 符号数字同色 |
| `.ledger-choice-row` | `LedgerChoiceRow` | ✅ 待接表单页 |
| `.ledger-segment` | `LedgerSegment` | ✅ |
| `.ledger-tabs` | `LedgerBottomNav` | ✅ 选中粉底 icon |
| `.ledger-fab` | `LedgerFab` | ✅ |
| `.ledger-pill` | `LedgerPillButton` | ✅ |
| `.ledger-chip-btn` | `LedgerChipButton` | ✅ |
| `.ledger-panel` / `.ledger-card` | `LedgerPanel` / `LedgerCard` | ✅ |
| `.ledger-account-row` | `LedgerAccountRowCard` + 行内容 | ✅ |
| `.ledger-panel-head button` | `LedgerPanelLink` | ✅ ink 13/15 w700 |
| `.ledger-tx` + `.ledger-review-btn` | `LedgerTxRow` + `LedgerReviewChip` | ✅ |
| `.ledger-pie-wrap` + `.ledger-rank` | `TransactionsCategoryCard` | ✅ 左环图 + 右排名（名称/条/金额/升降） |
| `.ledger-field` / select | `TextField` / `DropdownButtonFormField` | 🔲 子页未建 |
| 记一笔 / 持仓 / 预算子页 | — | 🔲 下一阶段 |

## 页面映射

| Tab | Web `active` | Flutter | 状态 |
| --- | --- | --- | --- |
| 总览 | `dashboard` | `DashboardScreen` + 各 panel | ✅ 净资产；**设置预算**（未设时单行）/ 已设预算进度；**本月支出节奏**（独立 panel）；待核对；固定扣款；本月分类；示例清空 |
| 流水 | `transactions` | `TransactionsScreen` + 子组件 | ✅ 搜索；列表/日历 segment；全部/未核对/已核对；分类·周期 card+环形图+排名；日历；按日流水+核对；示例清空 |
| 账户 | `accounts` | `AccountsScreen` + 子组件 | ✅ 账户数；示例清空；净资产=账户+持仓；余额/市值 foot；走势曲线+区间变动；按类型分组+行内涨跌%；股票/ETF 与基金分组（可空提示）；≥2 户才转账 |
| 我的 | `me` | `MeScreen` + 子组件 | ✅ 资料卡（昵称+性别+连续记账）；设置 card；模板列表/空态；分类 7 项+编辑+新分类+添加 |

## 验收步骤（每次改 UI 必做）

1. 浏览器打开 `/?projectId=Transactions&p=ledger` 与 Flutter `flutter run` 同尺寸（390 宽）。Flutter 真机/模拟器须在 `LedgerShell` 使用顶部 `SafeArea`（Web 预览框自带状态栏区域）。
2. 四 Tab 各截图：顶栏、hero、首屏面板、底栏。
3. 核对：色值、圆角（22 hero / 20 卡片 / 14 字段 / 999 pill）、字号（26 标题 / 36 hero 金额 / 11 tab）。
4. 更新本表「状态」列。

## 逻辑与数据

Flutter 当前为 **UI 壳 + 演示数字**；业务与 `store.ts` 同步属下一阶段。UI 对齐 **不依赖** 数据一致，但演示数宜与 sample 账接近便于肉眼对比。

**账户 hero 与 Web 对齐的 sample（无持仓）**：净资产 **3722.96**、30 天区间 **+76.9%**（见 `test/accounts_sample_math_test.dart`）。若 Flutter 出现 **3 万+ 与「市值」脚注**，说明本地多了持仓数据；Web 默认 `holdings: []` 只有现金+卡余额。

**走势线**：`LedgerTrendLinePainter` — 总览支出曲线 Y 从 0 到 max（同 Web `SpendLine`）；账户净资产走势用 `fitDataRange: true`（min→max），避免净值都在 3 万档时折线贴顶、下方空一大块。
