# Ledger Flutter 客户端

与 Web 原型 `src/prototypes/ledger/` 视觉与文案对齐；对照与验收见 [docs/UI_PARITY.md](docs/UI_PARITY.md)。

## 运行

```bash
cd flutter/ledger_app
flutter pub get
flutter run
```

建议在 **390pt 宽**（与 `.ledger-phone` 一致）下与浏览器 `/?projectId=Transactions&p=ledger` 四 Tab 逐屏对比。

## 目录

| 路径 | 说明 |
| --- | --- |
| `lib/app/` | `LedgerApp`、`LedgerShell` |
| `lib/tabs/dashboard/` | 总览 Tab |
| `lib/tabs/transactions/` | 流水 Tab |
| `lib/tabs/accounts/` | 账户 Tab |
| `lib/tabs/me/` | 我的 Tab |
| `lib/widgets/` | 跨 Tab 设计组件 |

## 变更纪律

改 Web 的 `style.css` / 布局时，同步更新：

1. `docs/UI_PARITY.md`
2. `lib/theme/` 与对应组件
3. `src/prototypes/ledger/docs/prd.md`（若涉及产品范围）

当前四 Tab 主屏为 UI 壳；记一笔、持仓、预算子页与 `store.ts` 全量逻辑为下一阶段。
