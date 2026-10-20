import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
import '../dashboard/dashboard_models.dart';
import '../../widgets/ledger_tx_row.dart';
import 'transactions_analytics.dart';
import 'transactions_tab_state.dart';

class TransactionsListPanel extends StatelessWidget {
  const TransactionsListPanel({
    super.key,
    required this.state,
    required this.mark,
    required this.onOpenEntry,
    required this.onToggleReview,
  });

  final TransactionsTabState state;
  final String mark;
  final ValueChanged<DashboardEntry> onOpenEntry;
  final ValueChanged<String> onToggleReview;

  @override
  Widget build(BuildContext context) {
    final list = state.listEntries;
    final title = state.txViewIndex == 1 && state.calendarDay != null
        ? TransactionsAnalytics.dayLabel(state.calendarDay!)
        : state.periodLabel;

    return LedgerPanel(
      title: title,
      trailing: Text(
        '${LedgerStrings.periodSpend} $mark${_fmt(state.periodOut)} · ${LedgerStrings.periodIncome} $mark${_fmt(state.periodIn)}',
        style: LedgerTextStyles.noteSemibold.copyWith(fontSize: 12),
        textAlign: TextAlign.end,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: list.isEmpty ? [Text(LedgerStrings.txEmpty, style: LedgerTextStyles.note)] : _txRows(),
      ),
    );
  }

  List<Widget> _txRows() {
    final list = state.listEntries;
    final out = <Widget>[];
    var row = 0;
    for (final day in state.txDays) {
      if (state.txViewIndex == 0) {
        out.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 4),
          child: Text(TransactionsAnalytics.dayLabel(day), style: LedgerTextStyles.dayLabel),
        ));
      }
      for (final entry in list.where((e) => e.date == day)) {
        out.add(LedgerTxRow(
          entry: entry,
          mark: mark,
          showTopBorder: row > 0,
          onOpen: () => onOpenEntry(entry),
          onToggleReview: () => onToggleReview(entry.id),
        ));
        row++;
      }
    }
    return out;
  }

  static String _fmt(double v) {
    if (v >= 1000) return v.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return v.toStringAsFixed(2);
  }
}
