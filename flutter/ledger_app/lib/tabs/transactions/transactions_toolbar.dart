import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../widgets/ledger_segment.dart';
import 'transactions_filter_chip.dart';
import 'transactions_tab_state.dart';

class TransactionsToolbar extends StatelessWidget {
  const TransactionsToolbar({
    super.key,
    required this.state,
    required this.onSearchChanged,
    required this.onViewChanged,
    required this.onStatusFilterChanged,
    required this.onClearCategoryFilter,
  });

  final TransactionsTabState state;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<int> onViewChanged;
  final ValueChanged<TransactionsStatusFilter> onStatusFilterChanged;
  final VoidCallback onClearCategoryFilter;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: LedgerColors.neutral,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: LedgerColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: LedgerStrings.searchPlaceholder,
              filled: true,
              fillColor: LedgerColors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: LedgerColors.line)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: LedgerColors.line)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
            ),
          ),
          const SizedBox(height: 10),
          LedgerSegment(
            labels: const [LedgerStrings.txViewList, LedgerStrings.txViewCalendar],
            index: state.txViewIndex,
            onChanged: onViewChanged,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              TransactionsFilterChip(
                label: LedgerStrings.filterAll,
                selected: state.statusFilter == TransactionsStatusFilter.all,
                onTap: () => onStatusFilterChanged(TransactionsStatusFilter.all),
              ),
              TransactionsFilterChip(
                label: LedgerStrings.filterOpen,
                selected: state.statusFilter == TransactionsStatusFilter.open,
                onTap: () => onStatusFilterChanged(TransactionsStatusFilter.open),
              ),
              TransactionsFilterChip(
                label: LedgerStrings.filterDone,
                selected: state.statusFilter == TransactionsStatusFilter.done,
                onTap: () => onStatusFilterChanged(TransactionsStatusFilter.done),
              ),
              if (state.categoryFilter != null)
                TransactionsFilterChip(
                  label: '${LedgerStrings.filterCategory} ${state.categoryFilter} ×',
                  selected: true,
                  onTap: onClearCategoryFilter,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
