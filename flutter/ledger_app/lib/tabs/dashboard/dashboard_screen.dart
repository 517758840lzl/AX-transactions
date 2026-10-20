import 'package:flutter/material.dart';
import '../../data/ledger_budget.dart';
import '../../data/ledger_catalog.dart';
import '../../data/ledger_entry_log.dart';
import '../../data/ledger_session.dart';
import '../../l10n/ledger_strings.dart';
import '../../layout/tab_page.dart';
import '../../widgets/ledger_chip_button.dart';
import '../../pages/budget_page.dart';
import '../../pages/entry_edit_page.dart';
import '../../pages/filter_page.dart';
import 'dashboard_budget_panel.dart';
import 'dashboard_categories_panel.dart';
import 'dashboard_models.dart';
import 'dashboard_net_summary.dart';
import 'dashboard_recurring_panel.dart';
import 'dashboard_review_panel.dart';
import '../../widgets/ledger_sample_banner.dart';
import '../accounts/accounts_book_math.dart';
import 'dashboard_spend_pace_panel.dart';
import 'dashboard_tab_state.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.mark,
    required this.entries,
    required this.budget,
    required this.catalog,
    this.book,
    this.onOpenTransactions,
    this.onCreateEntry,
  });

  final String mark;
  final LedgerEntryLog entries;
  final LedgerBudget budget;
  final LedgerCatalog catalog;
  final LedgerAccountBook? book;
  final VoidCallback? onOpenTransactions;
  final VoidCallback? onCreateEntry;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late DashboardTabState _state;

  @override
  void initState() {
    super.initState();
    _state = DashboardTabState.initial().copyWith(
      entries: widget.entries.entries,
      monthlyBudget: widget.budget.monthly,
      categoryBudgets: widget.budget.categoryCaps,
    );
    widget.entries.addListener(_syncEntries);
    widget.budget.addListener(_syncBudget);
    widget.book?.addListener(_syncBook);
  }

  @override
  void dispose() {
    widget.entries.removeListener(_syncEntries);
    widget.budget.removeListener(_syncBudget);
    widget.book?.removeListener(_syncBook);
    super.dispose();
  }

  void _syncBook() {
    if (!mounted) return;
    setState(() {});
  }

  void _syncBudget() {
    if (!mounted) return;
    setState(() {
      _state = _state.copyWith(
        clearBudget: widget.budget.monthly == null,
        monthlyBudget: widget.budget.monthly,
        categoryBudgets: Map<String, double>.from(widget.budget.categoryCaps),
      );
    });
  }

  void _syncEntries() {
    if (!mounted) return;
    setState(() => _state = _state.copyWith(entries: widget.entries.entries));
  }

  void _publish(DashboardTabState next) {
    _state = next;
    widget.entries.publish(next.entries);
  }

  Future<void> _editBudget() async {
    final result = await BudgetPage.open(
      context,
      categories: widget.catalog.categories,
      monthlyBudget: _state.monthlyBudget,
      categoryBudgets: _state.categoryBudgets,
    );
    if (result == null) return;
    widget.budget.save(
      clear: result.cleared,
      monthly: result.monthlyBudget,
      categoryCaps: result.categoryBudgets,
    );
  }

  Future<void> _openFilter() async {
    final result = await FilterPage.open(
      context,
      scope: _state.scope,
      periodMode: _state.periodMode,
      rangeFrom: _state.rangeFrom,
      rangeTo: _state.rangeTo,
    );
    if (result == null) return;
    setState(() {
      _state = _state.copyWith(
        scope: result.scope,
        periodMode: result.periodMode,
        rangeFrom: result.rangeFrom,
        rangeTo: result.rangeTo,
      );
    });
  }

  Future<void> _openEntry(DashboardEntry entry) async {
    final result = await EntryEditPage.open(
      context,
      entry: entry,
      mark: widget.mark,
      catalog: widget.catalog,
      savedEntries: widget.entries.entries,
    );
    if (result == null) return;
    if (result.action == EntryEditAction.deleted) {
      _publish(_state.removeEntry(entry.id));
    } else if (result.entry != null) {
      _publish(_state.updateEntry(result.entry!));
    }
  }

  @override
  Widget build(BuildContext context) {
    final mark = widget.mark;
    return ListView(
      padding: TabPage.listPadding,
      children: [
        Row(
          children: [
            Expanded(child: Text('${DateTime.now().month}月${LedgerStrings.tabDashboard}', style: Theme.of(context).textTheme.headlineLarge)),
            LedgerChipButton(label: _state.scopeChipLabel, onPressed: _openFilter),
          ],
        ),
        const SizedBox(height: 12),
        DashboardNetSummary(
          mark: mark,
          netWorth: widget.book == null
              ? _state.netWorth
              : AccountsBookMath.bookNetWorth(widget.book!.accounts, widget.entries.entries, widget.book!.holdings),
          monthOut: _state.monthOut,
          monthIn: _state.monthIn,
          monthBalance: _state.monthBalance,
        ),
        DashboardBudgetPanel(
          mark: mark,
          monthOut: _state.monthOut,
          budget: _state.monthlyBudget,
          budgetLeft: _state.budgetLeft,
          safeDaily: _state.safeDaily,
          paceOver: _state.paceOver,
          onSetupOrEdit: _editBudget,
        ),
        DashboardSpendPacePanel(
          monthOut: _state.monthOut,
          dailySpend: _state.monthSpendSeries,
          onOpenTransactions: () => widget.onOpenTransactions?.call(),
        ),
        DashboardReviewPanel(
          mark: mark,
          queue: _state.reviewQueue,
          onMarkAll: () => _publish(_state.markReviewed(_state.reviewQueue.map((e) => e.id))),
          onToggle: (id) => _publish(_state.toggleReview(id)),
          onOpenEntry: _openEntry,
        ),
        DashboardRecurringPanel(
          mark: mark,
          items: _state.recurring.take(5).toList(),
          onCreate: widget.onCreateEntry,
          onOpen: (item) {
            final sample = _state.entries.firstWhere((e) => e.title == item.title && e.amount == item.amount);
            _openEntry(sample);
          },
        ),
        DashboardCategoriesPanel(
          mark: mark,
          parts: _state.monthCategories,
          onOpenReport: () => widget.onOpenTransactions?.call(),
          onPickCategory: (_) => widget.onOpenTransactions?.call(),
        ),
        if (_state.showSampleBanner)
          LedgerSampleBanner(onClear: () {
            final book = widget.book;
            if (book == null) {
              _publish(_state.clearSample());
              return;
            }
            book.clearFilled(widget.entries);
          }),
      ],
    );
  }
}
