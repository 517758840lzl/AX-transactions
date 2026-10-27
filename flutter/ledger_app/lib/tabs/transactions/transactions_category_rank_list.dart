import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/money_amount.dart';
import 'transactions_tab_state.dart';

/// Web `.ledger-rank`. Row 1 vertically centers the dot and name with the amount and change. Row 2 is a full-width bar.
class TransactionsCategoryRankList extends StatelessWidget {
  const TransactionsCategoryRankList({
    super.key,
    required this.parts,
    required this.total,
    required this.mark,
    required this.activeCategory,
    required this.prevByCategory,
    required this.onPick,
  });

  final List<TransactionsSpendPart> parts;
  final double total;
  final String mark;
  final String? activeCategory;
  final Map<String, double> prevByCategory;
  final ValueChanged<String> onPick;

  Color _color(String hex) {
    final v = int.parse(hex.substring(1), radix: 16);
    return Color(0xFF000000 | v);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final part in parts)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => onPick(part.name),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(color: _color(part.colorHex), shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  part.name,
                                  style: activeCategory == part.name ? LedgerTextStyles.rankLabelActive : LedgerTextStyles.rankLabel,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            MoneyAmount(value: part.amount, mark: mark, size: MoneySize.sm),
                            const SizedBox(height: 2),
                            _TrendBadge(amount: part.amount, prev: prevByCategory[part.name] ?? 0),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: SizedBox(
                        height: 4,
                        width: double.infinity,
                        child: ColoredBox(
                          color: LedgerColors.wash,
                          child: Align(
                            alignment: Alignment.centerLeft,
                            widthFactor: total > 0 ? (part.amount / total).clamp(0.04, 1.0) : 0,
                            child: ColoredBox(color: _color(part.colorHex)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _TrendBadge extends StatelessWidget {
  const _TrendBadge({required this.amount, required this.prev});

  final double amount;
  final double prev;

  @override
  Widget build(BuildContext context) {
    final TextStyle style;
    final String label;
    if (amount > prev) {
      label = LedgerStrings.rankUp;
      style = LedgerTextStyles.rankTrendUp;
    } else if (amount < prev) {
      label = LedgerStrings.rankDown;
      style = LedgerTextStyles.rankTrendDown;
    } else {
      label = LedgerStrings.rankFlat;
      style = LedgerTextStyles.rankTrend;
    }
    return Text(label, style: style);
  }
}
