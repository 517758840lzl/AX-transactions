import '../dashboard/dashboard_models.dart';
import 'accounts_models.dart';

class AccountsWindowSnapshot {
  const AccountsWindowSnapshot({
    required this.amounts,
    required this.prior,
    required this.netWorth,
    required this.cashBalance,
    required this.holdingsTotal,
  });

  final List<double> amounts;
  final double prior;
  final double netWorth;
  final double cashBalance;
  final double holdingsTotal;

  double get delta => netWorth - prior;
}

abstract final class AccountsBookMath {
  static const windowDays = [7, 30];

  static double signedEntry(DashboardEntry e) => e.isOut ? -e.amount : e.amount;

  static double accountTotal(LedgerAccount account, List<DashboardEntry> entries) {
    return entries.where((e) => e.accountId == account.id).fold(account.opening, (sum, e) => sum + signedEntry(e));
  }

  static double accountBalanceOnDate(LedgerAccount account, List<DashboardEntry> entries, String iso) {
    return accountNowAndPrior(account, entries, iso).prior;
  }

  /// 当前余额与截止某日的余额一次扫完，结果与分开两次过滤相同。
  static ({double now, double prior}) accountNowAndPrior(LedgerAccount account, List<DashboardEntry> entries, String priorIso) {
    var now = account.opening;
    var prior = account.opening;
    for (final entry in entries) {
      if (entry.accountId != account.id) continue;
      final signed = signedEntry(entry);
      now += signed;
      if (entry.date.compareTo(priorIso) <= 0) prior += signed;
    }
    return (now: now, prior: prior);
  }

  static double accountsBalanceTotal(List<LedgerAccount> accounts, List<DashboardEntry> entries) {
    return accounts.fold(0.0, (sum, a) => sum + accountTotal(a, entries));
  }

  static double holdingMarketValue(LedgerHolding h) => _round(h.qty * h.price);

  static double holdingsMarketTotal(List<LedgerHolding> holdings) => holdings.fold(0.0, (s, h) => s + holdingMarketValue(h));

  static double holdingUnrealizedPnl(LedgerHolding h) => _round(holdingMarketValue(h) - h.costTotal);

  static double bookNetWorth(List<LedgerAccount> accounts, List<DashboardEntry> entries, List<LedgerHolding> holdings) {
    return _round(accountsBalanceTotal(accounts, entries) + holdingsMarketTotal(holdings));
  }

  static double bookNetWorthOnDate(List<LedgerAccount> accounts, List<DashboardEntry> entries, List<LedgerHolding> holdings, String iso) {
    final cash = accounts.fold(0.0, (s, a) => s + accountBalanceOnDate(a, entries, iso));
    return _round(cash + holdingsMarketTotal(holdings));
  }

  static String windowStartIso(int windowDays) {
    final cursor = DateTime.now().subtract(Duration(days: windowDays - 1));
    return _iso(cursor);
  }

  static String isoBefore(String iso) {
    final d = DateTime.parse('${iso}T00:00:00').subtract(const Duration(days: 1));
    return _iso(d);
  }

  /// 一次扫过流水，按日累加。避免「每天 × 每笔」重复过滤。
  static AccountsWindowSnapshot windowSnapshot(
    List<LedgerAccount> accounts,
    List<DashboardEntry> entries,
    List<LedgerHolding> holdings,
    int windowDays,
  ) {
    final holdingsValue = holdingsMarketTotal(holdings);
    final opening = accounts.fold(0.0, (sum, account) => sum + account.opening);
    final start = windowStartIso(windowDays);
    final end = _iso(DateTime.now());
    var before = opening;
    final deltas = <String, double>{};
    for (final entry in entries) {
      final signed = signedEntry(entry);
      if (entry.date.compareTo(start) < 0) {
        before += signed;
      } else if (entry.date.compareTo(end) <= 0) {
        deltas[entry.date] = (deltas[entry.date] ?? 0) + signed;
      }
    }
    final amounts = <double>[];
    var running = before;
    var cursor = DateTime.parse('${start}T00:00:00');
    final last = DateTime.parse('${end}T00:00:00');
    while (!cursor.isAfter(last)) {
      final day = _iso(cursor);
      running += deltas[day] ?? 0;
      amounts.add(_round(running + holdingsValue));
      cursor = cursor.add(const Duration(days: 1));
    }
    return AccountsWindowSnapshot(
      amounts: amounts,
      prior: _round(before + holdingsValue),
      netWorth: _round(running + holdingsValue),
      cashBalance: _round(running),
      holdingsTotal: holdingsValue,
    );
  }

  static String formatPct(double delta, double base) {
    if (base == 0) return delta == 0 ? '0%' : '—';
    final pct = (delta / base.abs()) * 100;
    final sign = pct > 0 ? '+' : '';
    return '$sign${pct.toStringAsFixed(1)}%';
  }

  static double _round(double v) => (v * 100).roundToDouble() / 100;

  static String _iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
