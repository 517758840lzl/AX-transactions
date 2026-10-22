import 'dart:async';

import 'package:flutter/material.dart';
import '../../data/ledger_catalog.dart';
import '../../data/ledger_entry_log.dart';
import '../../data/ledger_session.dart';
import '../../l10n/ledger_strings.dart';
import '../../layout/tab_page.dart';
import '../../pages/entry_edit_page.dart';
import '../../pages/filter_page.dart';
import '../../widgets/ledger_chip_button.dart';
import '../../widgets/ledger_sample_banner.dart';
import '../dashboard/dashboard_models.dart';
import 'transactions_calendar_panel.dart';
import 'transactions_category_card.dart';
import 'transactions_list_panel.dart';
import 'transactions_tab_state.dart';
import 'transactions_toolbar.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key, required this.mark, required this.entries, required this.catalog, this.book});

  final String mark;
  final LedgerEntryLog entries;
  final LedgerCatalog catalog;
  final LedgerAccountBook? book;

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  late TransactionsTabState _state;
  Timer? _searchTimer;

  @override
  void initState() {
    super.initState();
    _state = TransactionsTabState.initial().copyWith(entries: widget.entries.entries);
    widget.entries.addListener(_syncEntries);
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    widget.entries.removeListener(_syncEntries);
    super.dispose();
  }

  void _syncEntries() {
    if (!mounted) return;
    setState(() => _state = _state.copyWith(entries: widget.entries.entries));
  }

  void _publish(TransactionsTabState next) {
    _state = next;
    widget.entries.publish(next.entries);
  }

  void _onSearchChanged(String query) {
    _searchTimer?.cancel();
    _searchTimer = Timer(const Duration(milliseconds: 120), () {
      if (!mounted) return;
      setState(() => _state = _state.copyWith(search: query));
    });
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
      final periodChanged = result.periodMode != _state.periodMode ||
          result.rangeFrom != _state.rangeFrom ||
          result.rangeTo != _state.rangeTo;
      _state = _state.copyWith(
        scope: result.scope,
        periodMode: result.periodMode,
        rangeFrom: result.rangeFrom,
        rangeTo: result.rangeTo,
        clearCategoryFilter: periodChanged,
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
    final calendarDay = _state.calendarDay ?? _todayIso();

    return ListView(
      scrollCacheExtent: TabPage.scrollCache,
      padding: TabPage.listPadding,
      children: [
        Row(
          children: [
            Expanded(child: Text(LedgerStrings.transactions, style: Theme.of(context).textTheme.headlineLarge)),
            LedgerChipButton(label: _state.periodLabel, onPressed: _openFilter),
          ],
        ),
        const SizedBox(height: 14),
        TransactionsToolbar(
          state: _state,
          onSearchChanged: _onSearchChanged,
          onViewChanged: (i) => setState(() => _state = _state.copyWith(txViewIndex: i, calendarDay: i == 1 ? calendarDay : _state.calendarDay)),
          onStatusFilterChanged: (f) => setState(() => _state = _state.copyWith(statusFilter: f)),
          onClearCategoryFilter: () => setState(() => _state = _state.copyWith(clearCategoryFilter: true)),
        ),
        TransactionsCategoryCard(
          state: _state,
          mark: mark,
          onPickCategory: (name) => setState(() => _state = _state.copyWith(categoryFilter: name)),
        ),
        if (_state.txViewIndex == 1)
          TransactionsCalendarPanel(
            spendByDay: _state.spendByDay,
            selectedDay: _state.calendarDay ?? calendarDay,
            onSelectDay: (day) => setState(() => _state = _state.copyWith(calendarDay: day)),
          ),
        TransactionsListPanel(
          state: _state,
          mark: mark,
          onOpenEntry: _openEntry,
          onToggleReview: (id) => _publish(_state.toggleChecked(id)),
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

  static String _todayIso() {
    final n = DateTime.now();
    return '${n.year.toString().padLeft(4, '0')}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
  }
}
