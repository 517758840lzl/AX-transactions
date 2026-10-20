import 'package:flutter/material.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/money_amount.dart';
import 'dashboard_models.dart';

class DashboardCategoryChip extends StatelessWidget {
  const DashboardCategoryChip({super.key, required this.part, required this.mark, required this.onTap});

  final DashboardCategoryPart part;
  final String mark;
  final VoidCallback onTap;

  Color _parseColor(String hex) {
    final value = int.parse(hex.substring(1), radix: 16);
    return Color(0xFF000000 | value);
  }

  @override
  Widget build(BuildContext context) {
    final cat = _parseColor(part.colorHex);
    final cap = part.budgetCap;
    final ratio = cap != null && cap > 0 ? (part.amount / cap).clamp(0.0, 1.0) : null;
    return Material(
      color: Color.alphaBlend(cat.withValues(alpha: 0.12), Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Color.alphaBlend(cat.withValues(alpha: 0.28), const Color(0xFFF0DDE3))),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          width: 96,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              children: [
                Text(part.name, style: LedgerTextStyles.categoryChipName),
                const SizedBox(height: 5),
                MoneyAmount(value: part.amount, mark: mark, size: MoneySize.sm),
                if (ratio != null) ...[
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(value: ratio, minHeight: 4, backgroundColor: cat.withValues(alpha: 0.15), color: ratio >= 1 ? cat : cat.withValues(alpha: 0.85)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
