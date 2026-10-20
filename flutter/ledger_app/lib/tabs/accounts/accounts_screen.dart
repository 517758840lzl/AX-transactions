import 'package:flutter/material.dart';
import '../../data/ledger_entry_log.dart';
import '../../data/ledger_session.dart';
import '../../l10n/ledger_strings.dart';
import '../../layout/tab_page.dart';
import '../../pages/account_detail_page.dart';
import '../../pages/account_edit_page.dart';
import '../../pages/holding_detail_page.dart';
import '../../pages/holding_edit_page.dart';
import '../../pages/transfer_page.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_pill_button.dart';
import '../../widgets/ledger_sample_banner.dart';
import 'accounts_account_group.dart';
import 'accounts_book_math.dart';
import 'accounts_holding_group.dart';
import 'accounts_models.dart';
import 'accounts_sample_data.dart';
import 'accounts_tab_state.dart';
import 'accounts_trend_hero.dart';

class AccountsScreen extends StatefulWidget {
  const AccountsScreen({super.key, required this.mark, required this.entries, this.book});

  final String mark;
  final LedgerEntryLog entries;
  final LedgerAccountBook? book;

  @override
  State<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends State<AccountsScreen> {
  late AccountsTabState _state;

  @override
  void initState() {
    super.initState();
    final book = widget.book;
    _state = book == null
        ? AccountsTabState.initial().copyWith(entries: widget.entries.entries)
        : AccountsTabState(
            accounts: book.accounts,
            entries: widget.entries.entries,
            holdings: book.holdings,
            sampleCleared: book.sampleCleared,
          );
    widget.entries.addListener(_syncEntries);
    book?.addListener(_syncBook);
  }

  @override
  void dispose() {
    widget.entries.removeListener(_syncEntries);
    widget.book?.removeListener(_syncBook);
    super.dispose();
  }

  void _syncEntries() {
    if (!mounted) return;
    setState(() => _state = _state.copyWith(entries: widget.entries.entries));
  }

  void _syncBook() {
    if (!mounted) return;
    final book = widget.book;
    if (book == null) return;
    setState(() {
      _state = _state.copyWith(
        accounts: book.accounts,
        holdings: book.holdings,
        sampleCleared: book.sampleCleared,
      );
    });
  }

  void _commit(AccountsTabState next, {bool publishEntries = false}) {
    setState(() => _state = next);
    widget.book?.take(next);
    if (publishEntries) widget.entries.publish(next.entries);
  }

  String get _windowFromPrior {
    final from = AccountsBookMath.windowStartIso(_state.windowDays);
    return AccountsBookMath.isoBefore(from);
  }

  Future<void> _addAccount() async {
    final result = await AccountEditPage.open(context);
    if (!mounted || result == null || result.account == null) return;
    _commit(_state.upsertAccount(result.account!));
  }

  Future<void> _openAccount(LedgerAccount account) async {
    final result = await AccountDetailPage.open(
      context,
      account: account,
      entries: _state.entries,
      mark: widget.mark,
      windowDays: _state.windowDays,
    );
    if (!mounted || result == null) return;
    final next = result.deleted ? _state.removeAccount(result.id) : _state.upsertAccount(result.account!);
    _commit(next, publishEntries: true);
  }

  Future<void> _addHolding() async {
    final result = await HoldingEditPage.open(context, existing: _state.holdings);
    if (!mounted || result == null || result.holding == null) return;
    _commit(_state.upsertHolding(result.holding!));
  }

  Future<void> _openHolding(LedgerHolding holding) async {
    final result = await HoldingDetailPage.open(context, holding: holding, existing: _state.holdings, mark: widget.mark);
    if (!mounted || result == null) return;
    _commit(result.deleted ? _state.removeHolding(result.id) : _state.upsertHolding(result.holding!));
  }

  Future<void> _transfer() async {
    final created = await TransferPage.open(context, accounts: _state.accounts);
    if (!mounted || created == null) return;
    _commit(_state.copyWith(entries: [...created, ..._state.entries]), publishEntries: true);
  }

  @override
  Widget build(BuildContext context) {
    final mark = widget.mark;
    final stock = _state.holdings.where((h) => h.kind == HoldingKind.stock || h.kind == HoldingKind.etf).toList();
    final funds = _state.holdings.where((h) => h.kind == HoldingKind.fund).toList();

    return ListView(
      padding: TabPage.listPaddingRest,
      children: [
        Row(
          children: [
            Expanded(child: Text(LedgerStrings.accounts, style: Theme.of(context).textTheme.headlineLarge)),
            Text('${_state.accounts.length}${LedgerStrings.accountCount}', style: LedgerTextStyles.topbarMeta),
          ],
        ),
        if (_state.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 24),
            child: Text(LedgerStrings.accountsEmpty, style: LedgerTextStyles.bodyMuted),
          )
        else ...[
          AccountsTrendHero(
            state: _state,
            mark: mark,
            onWindowChanged: (i) => setState(() => _state = _state.copyWith(windowIndex: i)),
          ),
          for (final kind in AccountsSampleData.accountKindOrder)
            AccountsAccountGroup(
              kind: kind,
              accounts: _state.accounts,
              entries: _state.entries,
              mark: mark,
              windowFromPriorIso: _windowFromPrior,
              onOpenAccount: _openAccount,
            ),
          if (stock.isNotEmpty)
            AccountsHoldingGroup(
              title: LedgerStrings.holdingsStock,
              holdings: stock,
              mark: mark,
              toneOffset: 2,
              onOpen: _openHolding,
            ),
          if (funds.isNotEmpty)
            AccountsHoldingGroup(
              title: LedgerStrings.holdingsFund,
              holdings: funds,
              mark: mark,
              toneOffset: 5,
              onOpen: _openHolding,
            ),
        ],
        if (_state.showTransfer) ...[
          const SizedBox(height: 10),
          LedgerPillButton(label: LedgerStrings.transfer, onPressed: _transfer, secondary: true),
        ],
        const SizedBox(height: 10),
        LedgerPillButton(label: LedgerStrings.addAccount, onPressed: _addAccount),
        const SizedBox(height: 10),
        LedgerPillButton(label: LedgerStrings.addHolding, onPressed: _addHolding, secondary: true),
        if (_state.showSampleBanner) LedgerSampleBanner(onClear: () => _commit(_state.clearSample(), publishEntries: true)),
      ],
    );
  }
}
