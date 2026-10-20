import '../dashboard/dashboard_models.dart';
import '../dashboard/dashboard_sample_data.dart';
import 'accounts_book_math.dart';
import 'accounts_models.dart';
import 'accounts_sample_data.dart';

class AccountsTabState {
  AccountsTabState({
    required this.accounts,
    required this.entries,
    required this.holdings,
    this.windowIndex = 1,
    this.sampleCleared = false,
  });

  final List<LedgerAccount> accounts;
  final List<DashboardEntry> entries;
  final List<LedgerHolding> holdings;
  final int windowIndex;
  final bool sampleCleared;

  static AccountsTabState initial() => AccountsTabState(
        accounts: AccountsSampleData.sampleAccounts(),
        entries: DashboardSampleData.seedEntries(),
        holdings: AccountsSampleData.sampleHoldings(),
      );

  int get windowDays => AccountsBookMath.windowDays[windowIndex.clamp(0, 1)];

  AccountsWindowSnapshot? _window;

  AccountsWindowSnapshot get _snapshot => _window ??= AccountsBookMath.windowSnapshot(accounts, entries, holdings, windowDays);

  double get netWorth => _snapshot.netWorth;

  double get cashBalance => _snapshot.cashBalance;

  double get holdingsTotal => _snapshot.holdingsTotal;

  List<double> get trendAmounts => _snapshot.amounts;

  double get windowDelta => _snapshot.delta;

  double get windowPrior => _snapshot.prior;

  bool get showSampleBanner =>
      !sampleCleared && (AccountsSampleData.hasSample(accounts) || AccountsSampleData.hasSampleHoldings(holdings));

  bool get showTransfer => accounts.length >= 2;

  bool get isEmpty => accounts.isEmpty && holdings.isEmpty;

  AccountsTabState copyWith({
    List<LedgerAccount>? accounts,
    List<DashboardEntry>? entries,
    List<LedgerHolding>? holdings,
    int? windowIndex,
    bool? sampleCleared,
  }) {
    return AccountsTabState(
      accounts: accounts ?? this.accounts,
      entries: entries ?? this.entries,
      holdings: holdings ?? this.holdings,
      windowIndex: windowIndex ?? this.windowIndex,
      sampleCleared: sampleCleared ?? this.sampleCleared,
    );
  }

  AccountsTabState upsertAccount(LedgerAccount account) {
    final exists = accounts.any((item) => item.id == account.id);
    final next = exists ? [for (final item in accounts) item.id == account.id ? account : item] : [...accounts, account];
    return copyWith(accounts: next);
  }

  AccountsTabState removeAccount(String id) {
    return copyWith(
      accounts: accounts.where((item) => item.id != id).toList(),
      entries: entries.where((entry) => entry.accountId != id).toList(),
    );
  }

  AccountsTabState upsertHolding(LedgerHolding holding) {
    final exists = holdings.any((item) => item.id == holding.id);
    final next = exists ? [for (final item in holdings) item.id == holding.id ? holding : item] : [...holdings, holding];
    return copyWith(holdings: next);
  }

  AccountsTabState removeHolding(String id) {
    return copyWith(holdings: holdings.where((item) => item.id != id).toList());
  }

  AccountsTabState clearSample() {
    return copyWith(
      accounts: accounts.where((a) => !a.id.startsWith('sample-')).toList(),
      entries: entries.where((e) => !e.id.startsWith('sample-')).toList(),
      holdings: holdings.where((h) => !h.id.startsWith('sample-')).toList(),
      sampleCleared: true,
    );
  }
}
