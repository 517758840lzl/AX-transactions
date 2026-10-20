import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
import '../../widgets/ledger_panel_link.dart';
import '../../widgets/money_amount.dart';

class DashboardBudgetPanel extends StatelessWidget {
  const DashboardBudgetPanel({
    super.key,
    required this.mark,
    required this.monthOut,
    required this.budget,
    required this.budgetLeft,
    required this.safeDaily,
    required this.paceOver,
    required this.onSetupOrEdit,
  });

  final String mark;
  final double monthOut;
  final double? budget;
  final double? budgetLeft;
  final double? safeDaily;
  final bool paceOver;
  final VoidCallback onSetupOrEdit;

  @override
  Widget build(BuildContext context) {
    if (budget == null || budget! <= 0) {
      return LedgerPanel(
        child: InkWell(
          onTap: onSetupOrEdit,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(LedgerStrings.budgetUnset, style: LedgerTextStyles.panelTitle),
              const Text('›', style: LedgerTextStyles.chevron),
            ],
          ),
        ),
      );
    }

    final left = budgetLeft ?? 0;
    final over = left < 0;

    return LedgerPanel(
      title: LedgerStrings.monthlyBudget,
      trailing: LedgerPanelLink(label: LedgerStrings.edit, onPressed: onSetupOrEdit),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (monthOut / budget!).clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: LedgerColors.neutral,
              color: LedgerColors.pink,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            over ? LedgerStrings.budgetOver : LedgerStrings.budgetRemaining,
            style: LedgerTextStyles.noteSemibold.copyWith(color: over ? LedgerColors.budgetOver : LedgerColors.muted),
          ),
          Row(
            children: [
              MoneyAmount(value: left, mark: mark, size: MoneySize.sm, signed: over),
              Text(' / ', style: TextStyle(color: LedgerColors.muted.withValues(alpha: 0.8))),
              MoneyAmount(value: budget!, mark: mark, size: MoneySize.sm),
            ],
          ),
          if (safeDaily != null && safeDaily! >= 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Text('${LedgerStrings.safeToSpend} ', style: LedgerTextStyles.noteSemibold),
                MoneyAmount(value: safeDaily!, mark: mark, size: MoneySize.sm),
              ],
            ),
          ],
          if (paceOver)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(LedgerStrings.paceWarning, style: LedgerTextStyles.budgetPace),
            ),
        ],
      ),
    );
  }
}
