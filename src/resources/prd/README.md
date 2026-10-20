# PRD 与原型同步（Transactions / src）

| 原型 | PRD（权威） | 主规格 | Make 文档入口 |
| --- | --- | --- | --- |
| `ledger` | [src/prototypes/ledger/docs/prd.md](../../prototypes/ledger/docs/prd.md) | [spec.md](../../prototypes/ledger/.spec/spec.md) | `doc=prd/ledger.md`（镜像，需与 docs 同步） |

**规则**：改 `src/prototypes/ledger/` 功能时，更新 **`docs/prd.md` + `.spec/spec.md` + 代码**；若使用 Make 资源页阅读 PRD，将相同内容同步到 `src/resources/prd/ledger.md`（或整篇复制覆盖镜像）。

**说明**：`src/prototypes/ledger/.spec/spec.md` 是**原型主规格**，不是 PRD；PRD 在 **`src/prototypes/ledger/docs/prd.md`**（与 annotation-demo 的 `docs/prd-*.md` 同一惯例）。
