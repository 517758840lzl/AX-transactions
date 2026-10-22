import 'package:flutter/material.dart';
import '../data/ledger_budget.dart';
import '../data/ledger_catalog.dart';
import '../data/ledger_entry_log.dart';
import '../data/ledger_session.dart';
import '../l10n/ledger_strings.dart';
import '../pages/entry_edit_page.dart';
import '../tabs/accounts/accounts_screen.dart';
import '../tabs/dashboard/dashboard_screen.dart';
import '../tabs/me/me_screen.dart';
import '../tabs/me/me_tab_state.dart';
import '../tabs/transactions/transactions_screen.dart';
import '../theme/ledger_colors.dart';
import '../widgets/ledger_bottom_nav.dart';
import '../widgets/ledger_fab.dart';

class LedgerFrame extends StatefulWidget {
  const LedgerFrame({super.key, this.session});

  final LedgerSession? session;

  @override
  State<LedgerFrame> createState() => _LedgerFrameState();
}

class _LedgerFrameState extends State<LedgerFrame> {
  var tab = 0;
  var _currencyIndex = 0;
  late final LedgerEntryLog _entries;
  late final LedgerBudget _budget;
  late final LedgerCatalog _catalog;
  LedgerAccountBook? _accounts;
  final _pages = List<Widget?>.filled(4, null);

  String get mark => MeTabState.markAt(_currencyIndex);

  @override
  void initState() {
    super.initState();
    final session = widget.session;
    _entries = session?.entries ?? LedgerEntryLog();
    _budget = session?.budget ?? LedgerBudget();
    _catalog = session?.catalog ?? LedgerCatalog();
    _accounts = session?.accounts;
  }

  void _setCurrencyIndex(int index) {
    if (index == _currencyIndex) return;
    setState(() {
      _currencyIndex = index;
      // 金额符号变了：重建总览/流水/账户；「我的」保留本页状态
      _pages[0] = null;
      _pages[1] = null;
      _pages[2] = null;
    });
  }

  Future<void> _createEntry() async {
    final result = await EntryEditPage.openNew(
      context,
      mark: mark,
      catalog: _catalog,
      savedEntries: _entries.entries,
    );
    if (result?.action == EntryEditAction.saved && result?.entry != null) {
      _entries.add(result!.entry!);
    }
  }

  void _openTransactions() => setState(() => tab = 1);

  Widget _page(int index) {
    return _pages[index] ??= switch (index) {
      0 => DashboardScreen(mark: mark, entries: _entries, budget: _budget, catalog: _catalog, book: _accounts, onOpenTransactions: _openTransactions, onCreateEntry: _createEntry),
      1 => TransactionsScreen(mark: mark, entries: _entries, catalog: _catalog, book: _accounts),
      2 => AccountsScreen(mark: mark, entries: _entries, book: _accounts),
      _ => MeScreen(
          mark: mark,
          budget: _budget,
          catalog: _catalog,
          entries: _entries,
          session: widget.session,
          currencyIndex: _currencyIndex,
          onCurrencyChanged: _setCurrencyIndex,
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.stage,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 390),
          child: ColoredBox(
            color: LedgerColors.white,
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Expanded(
                    child: Stack(
                      children: [
                        IndexedStack(
                          index: tab,
                          children: [
                            for (var i = 0; i < 4; i++)
                              tab == i || _pages[i] != null ? _page(i) : const SizedBox.shrink(),
                          ],
                        ),
                        if (tab == 0 || tab == 1) LedgerFab(onPressed: _createEntry),
                      ],
                    ),
                  ),
                  LedgerBottomNav(
                    index: tab,
                    onChanged: (i) => setState(() => tab = i),
                    labels: const [
                      LedgerStrings.tabDashboard,
                      LedgerStrings.tabTransactions,
                      LedgerStrings.tabAccounts,
                      LedgerStrings.tabMe,
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
