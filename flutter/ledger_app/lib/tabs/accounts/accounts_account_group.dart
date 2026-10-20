import 'package:flutter/material.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/money_amount.dart';
import '../dashboard/dashboard_models.dart';
import 'accounts_account_row.dart';
import 'accounts_book_math.dart';
import 'accounts_labels.dart';
import 'accounts_models.dart';
import 'accounts_sample_data.dart';

class AccountsAccountGroup extends StatelessWidget {
  const AccountsAccountGroup({
    super.key,
    required this.kind,
    required this.accounts,
    required this.entries,
    required this.mark,
    required this.windowFromPriorIso,
    required this.onOpenAccount,
  });

  final AccountKind kind;
  final List<LedgerAccount> accounts;
  final List<DashboardEntry> entries;
  final String mark;
  final String windowFromPriorIso;
  final ValueChanged<LedgerAccount> onOpenAccount;

  @override
  Widget build(BuildContext context) {
    final group = accounts.where((a) => a.kind == kind).toList();
    if (group.isEmpty) return const SizedBox.shrink();
    final rows = <AccountsAccountRow>[];
    var total = 0.0;
    final toneBase = AccountsSampleData.accountKindOrder.indexOf(kind);
    for (var i = 0; i < group.length; i++) {
      final now = AccountsBookMath.accountTotal(group[i], entries);
      final prior = AccountsBookMath.accountBalanceOnDate(group[i], entries, windowFromPriorIso);
      total += now;
      rows.add(
        AccountsAccountRow(
          account: group[i],
          balance: now,
          deltaPct: AccountsBookMath.formatPct(now - prior, prior),
          deltaUp: now >= prior,
          mark: mark,
          toneIndex: i + toneBase,
          onTap: () => onOpenAccount(group[i]),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(AccountsLabels.accountKind(kind), style: LedgerTextStyles.groupLabel),
              MoneyAmount(value: total, mark: mark, size: MoneySize.sm),
            ],
          ),
          ...rows,
        ],
      ),
    );
  }
}
