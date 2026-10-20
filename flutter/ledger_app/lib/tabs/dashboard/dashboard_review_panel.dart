import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
import 'dashboard_models.dart';
import '../../widgets/ledger_tx_row.dart';

class DashboardReviewPanel extends StatelessWidget {
  const DashboardReviewPanel({
    super.key,
    required this.mark,
    required this.queue,
    required this.onMarkAll,
    required this.onToggle,
    required this.onOpenEntry,
  });

  final String mark;
  final List<DashboardEntry> queue;
  final VoidCallback onMarkAll;
  final ValueChanged<String> onToggle;
  final ValueChanged<DashboardEntry> onOpenEntry;

  @override
  Widget build(BuildContext context) {
    if (queue.isEmpty) return const SizedBox.shrink();
    return LedgerPanel(
      title: '${LedgerStrings.toReview} · ${queue.length}',
      trailing: Material(
        color: LedgerColors.pink,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onMarkAll,
          borderRadius: BorderRadius.circular(999),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Text(
              LedgerStrings.markAllReviewed,
              style: LedgerTextStyles.chipLabel.copyWith(fontSize: 12, height: 1.2),
            ),
          ),
        ),
      ),
      child: Column(
        children: [
          for (var i = 0; i < queue.length; i++)
            LedgerTxRow(
              entry: queue[i],
              mark: mark,
              showTopBorder: i > 0,
              onOpen: () => onOpenEntry(queue[i]),
              onToggleReview: () => onToggle(queue[i].id),
            ),
        ],
      ),
    );
  }
}
