import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../widgets/ledger_card.dart';
import 'transactions_category_rank_list.dart';
import 'transactions_spend_donut.dart';
import 'transactions_tab_state.dart';

class TransactionsCategoryCard extends StatelessWidget {
  const TransactionsCategoryCard({
    super.key,
    required this.state,
    required this.mark,
    required this.onPickCategory,
  });

  final TransactionsTabState state;
  final String mark;
  final ValueChanged<String> onPickCategory;

  @override
  Widget build(BuildContext context) {
    final parts = state.spendParts;
    if (parts.isEmpty) return const SizedBox.shrink();
    final total = state.periodOut;
    return LedgerCard(
      title: '${LedgerStrings.categoryPeriod} · ${state.periodLabel}',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TransactionsSpendDonut(
            parts: parts,
            total: total,
            mark: mark,
            activeCategory: state.categoryFilter,
            onPick: onPickCategory,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TransactionsCategoryRankList(
              parts: parts,
              total: total,
              mark: mark,
              activeCategory: state.categoryFilter,
              prevByCategory: state.prevMonthOutByCategory,
              onPick: onPickCategory,
            ),
          ),
        ],
      ),
    );
  }
}
