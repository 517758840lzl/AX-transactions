import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import 'money_amount.dart';

class LedgerNetCard extends StatelessWidget {
  const LedgerNetCard({
    super.key,
    required this.label,
    required this.amount,
    required this.mark,
    this.foot,
  });

  final String label;
  final double amount;
  final String mark;
  final Widget? foot;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
      decoration: BoxDecoration(
        color: LedgerColors.blackSurface,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [BoxShadow(color: LedgerColors.blackSurface.withValues(alpha: 0.22), blurRadius: 40, offset: const Offset(0, 18))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: LedgerTextStyles.heroLabel),
          const SizedBox(height: 6),
          MoneyAmount(value: amount, mark: mark, size: MoneySize.hero, lightOnDark: true),
          if (foot != null) ...[const SizedBox(height: 10), foot!],
        ],
      ),
      ),
    );
  }
}
