import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_net_card.dart';
import '../../widgets/money_amount.dart';

class DashboardNetSummary extends StatelessWidget {
  const DashboardNetSummary({
    super.key,
    required this.mark,
    required this.netWorth,
    required this.monthOut,
    required this.monthIn,
    required this.monthBalance,
  });

  final String mark;
  final double netWorth;
  final double monthOut;
  final double monthIn;
  final double monthBalance;

  @override
  Widget build(BuildContext context) {
    return LedgerNetCard(
      label: LedgerStrings.netAssets,
      amount: netWorth,
      mark: mark,
      foot: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 4,
        children: [
          Text(LedgerStrings.monthSpend, style: LedgerTextStyles.heroFoot),
          MoneyAmount(value: monthOut, mark: mark, size: MoneySize.sm, lightOnDark: true),
          Text(' · ', style: TextStyle(color: LedgerColors.onDarkSoft.withValues(alpha: 0.88))),
          Text(LedgerStrings.monthIncome, style: LedgerTextStyles.heroFoot),
          MoneyAmount(value: monthIn, mark: mark, size: MoneySize.sm, lightOnDark: true),
          Text(' · ', style: TextStyle(color: LedgerColors.onDarkSoft.withValues(alpha: 0.88))),
          Text(LedgerStrings.monthBalance, style: LedgerTextStyles.heroFoot),
          MoneyAmount(value: monthBalance, mark: mark, size: MoneySize.sm, signed: true, lightOnDark: true),
        ],
      ),
    );
  }
}
