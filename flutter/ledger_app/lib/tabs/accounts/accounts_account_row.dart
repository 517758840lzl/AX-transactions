import 'package:flutter/material.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_account_row_card.dart';
import '../../widgets/money_amount.dart';
import '../dashboard/dashboard_slice_colors.dart';
import 'accounts_labels.dart';
import 'accounts_models.dart';

class AccountsAccountRow extends StatelessWidget {
  const AccountsAccountRow({
    super.key,
    required this.account,
    required this.balance,
    required this.deltaPct,
    required this.deltaUp,
    required this.mark,
    required this.toneIndex,
    required this.onTap,
  });

  final LedgerAccount account;
  final double balance;
  final String deltaPct;
  final bool deltaUp;
  final String mark;
  final int toneIndex;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hex = DashboardSliceColors.at(toneIndex);
    final color = Color(0xFF000000 | int.parse(hex.substring(1), radix: 16));
    return LedgerAccountRowCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
            child: Text(account.name.substring(0, 1), style: LedgerTextStyles.txIconInitial),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(account.name, style: LedgerTextStyles.accountTitle),
                Text(AccountsLabels.accountKind(account.kind), style: LedgerTextStyles.accountMeta),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              MoneyAmount(value: balance, mark: mark, size: MoneySize.md),
              Text(deltaPct, style: deltaUp ? LedgerTextStyles.listDeltaUp : LedgerTextStyles.listDeltaDown),
            ],
          ),
        ],
      ),
    );
  }
}
