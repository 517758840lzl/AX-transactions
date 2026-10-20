# 记账 · 原型主规格

> **同步要求**：与 PRD [`../docs/prd.md`](../docs/prd.md)（权威）及实现保持一致；`src/resources/prd/ledger.md` 为 Make 镜像。变更原型行为时须同时更新 PRD 与本文件。

## 产品定位

本机持久化记账（`localStorage`），信息架构：**总览 → 流水 → 账户 → 我的**（Klarna 粉白视觉）。产品参照见 [app-landscape.md](./references/app-landscape.md)。无假银行/自动同步，每项可操作。完整范围与验收见 PRD。

## 导航（四 Tab）

| Tab | 参考 | 作用 |
| --- | --- | --- |
| 总览 | PocketGuard + 鲨鱼 + 一木 | 净资产（含持仓）、本月收支/结余、月预算 + 日均可花 + 超支节奏、分类预算、固定扣款、支出曲线、待核对 |
| 流水 | 鲨鱼 + 钱迹 | 列表/收支日历、搜索筛选、饼图 + 支出排行、FAB 记一笔 |
| 账户 | Copilot + 挖财式持仓 | 走势 hero、分组账户、区间涨跌；股票/ETF 与基金持仓（手动，无证券户）；转账；添加账户/添加持仓 |
| 我的 | 钱迹/随手记 | 连续记账；预算/导入导出/隐私/语言/货币；快捷模板；分类 |

旧 hash：`today`→总览，`book`→流水，`assets`→账户。

## 数据

- 存储键 `ledger-book-v1`，逻辑见 `store.ts`
- `Book`：`locale`、`currency`、`monthlyBudget`、`categoryBudgets`、`categories`、`accounts`、`entries`、`holdings`、`templates`、`sampleCleared`
- **Holding**：`kind` stock|etf|fund，`code`，`name`，`qty`，`costTotal`，`price`，`priceAsOf`；录入 **成本价**，存库为 `costTotal = qty × 成本价`
- 净资产 = 账户余额 + Σ 持仓市值；走势 V0：持仓按当前市值计入各日
- 模板去重；持仓同 `kind+code` 去重
- 文案 `i18n.ts`；示例账可清空

## 筛选

- **筛选子页**：总览顶栏改 **我的/家庭**（我的=`!shared`，家庭=仅 `shared`）；流水顶栏改 **今日/本月/自定义**
- 流水：搜索、列表/日历、核对状态、分类/账户 chip；饼图点选分类

## 子页与要点

记一笔、预算（含清空）、转账、账户/持仓编辑与详情、资料、隐私、筛选。无账户记一笔可 **自动建 cash 账户**。总览：固定扣款识别、本月分类 chip（可带分类预算条）、待核对批量标记。账户 hero 在有持仓时拆分 **余额 + 持仓市值**。完整清单见 PRD「功能清单」。

## UI 约定

- 主题 `src/themes/klarna-mobile/DESIGN.md`；hero `#0B051D`，深色面金额符号与数字同色
- 表单互斥项：`ledger-choice-row` 单行，选中近黑底（账户类型、收支、标的类型、性别、语言、货币等）

## 验收

与 PRD「验收标准」一致，实现后勾选：

- [ ] 四 Tab 与旧 hash
- [ ] 记一笔 / 待核对 / 预算 / 流水视图与筛选
- [ ] 账户与转账 / 走势
- [ ] 持仓 CRUD、盈亏、净资产含持仓、导入导出 holdings
- [ ] 模板与语言 / 示例账清空
- [ ] 范围筛选、固定扣款、分类 chip、账户详情→流水
- [ ] 构建 `prototypes/ledger` 通过
