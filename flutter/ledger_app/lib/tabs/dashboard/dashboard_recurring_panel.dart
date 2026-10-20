import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
import '../../widgets/ledger_panel_link.dart';
import '../../widgets/money_amount.dart';
import 'dashboard_models.dart';

class DashboardRecurringPanel extends StatelessWidget {
  const DashboardRecurringPanel({super.key, required this.mark, required this.items, required this.onOpen, this.onCreate});

  final String mark;
  final List<DashboardRecurringItem> items;
  final ValueChanged<DashboardRecurringItem> onOpen;
  final VoidCallback? onCreate;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return LedgerPanel(
        title: LedgerStrings.recurringTitle,
        trailing: LedgerPanelLink(label: LedgerStrings.entryNew, onPressed: onCreate),
        child: const Text(LedgerStrings.recurringEmpty, style: LedgerTextStyles.note),
      );
    }
    return LedgerPanel(
      title: LedgerStrings.recurringTitle,
      trailing: Text(LedgerStrings.recurringHint, style: LedgerTextStyles.streakMeta),
      child: Column(
        children: [
          for (final item in items)
            InkWell(
              onTap: () => onOpen(item),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Row(
                  children: [
                    Expanded(child: Text(item.title, style: LedgerTextStyles.recurringTitle)),
                    Text('${item.times}× · ', style: LedgerTextStyles.noteSemibold),
                    MoneyAmount(value: item.amount, mark: mark, size: MoneySize.sm),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
