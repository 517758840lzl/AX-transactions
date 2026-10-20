import 'package:flutter/material.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../tabs/dashboard/dashboard_slice_colors.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import 'ledger_review_chip.dart';
import 'money_amount.dart';

/// Web `.ledger-tx` 行（总览待核对、流水列表共用）
class LedgerTxRow extends StatelessWidget {
  const LedgerTxRow({
    super.key,
    required this.entry,
    required this.mark,
    required this.onOpen,
    required this.onToggleReview,
    this.showTopBorder = false,
  });

  final DashboardEntry entry;
  final String mark;
  final VoidCallback onOpen;
  final VoidCallback onToggleReview;
  final bool showTopBorder;

  @override
  Widget build(BuildContext context) {
    final colorHex = DashboardSliceColors.at(entry.category.hashCode);
    final color = Color(0xFF000000 | int.parse(colorHex.substring(1), radix: 16));
    final initial = entry.category.isEmpty ? '?' : entry.category.substring(0, 1);

    return Container(
      decoration: BoxDecoration(
        border: showTopBorder ? Border(top: BorderSide(color: LedgerColors.line.withValues(alpha: 0.85))) : null,
      ),
      padding: const EdgeInsets.symmetric(vertical: 10),
      constraints: const BoxConstraints(minHeight: 56),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
            child: Text(initial, style: LedgerTextStyles.txIconInitial),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: onOpen,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.title, style: LedgerTextStyles.txTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text('${entry.category} · ${entry.accountName}', style: LedgerTextStyles.txMeta),
                ],
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              MoneyAmount(value: entry.isOut ? -entry.amount : entry.amount, mark: mark, size: MoneySize.md, signed: true),
              const SizedBox(height: 6),
              LedgerReviewChip(checked: entry.checked, onTap: onToggleReview),
            ],
          ),
        ],
      ),
    );
  }
}
