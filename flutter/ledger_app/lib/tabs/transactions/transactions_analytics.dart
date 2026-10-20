import '../../data/ledger_view_filter.dart';
import '../dashboard/dashboard_models.dart';
import 'transactions_tab_state.dart';

abstract final class TransactionsAnalytics {
  static List<DashboardEntry> filterEntries({
    required List<DashboardEntry> entries,
    required LedgerScope scope,
    required LedgerPeriodMode periodMode,
    required String rangeFrom,
    required String rangeTo,
    required String search,
    required TransactionsStatusFilter statusFilter,
    required String? categoryFilter,
    required String? calendarDay,
    required int txViewIndex,
  }) {
    final bounds = LedgerViewFilter.periodBounds(periodMode, rangeFrom, rangeTo);
    var list = LedgerViewFilter.inPeriod(LedgerViewFilter.byScope(entries, scope), bounds);

    return list.where((entry) {
      if (txViewIndex == 1 && calendarDay != null && entry.date != calendarDay) return false;
      if (categoryFilter != null && entry.category != categoryFilter) return false;
      if (statusFilter == TransactionsStatusFilter.open && entry.checked) return false;
      if (statusFilter == TransactionsStatusFilter.done && !entry.checked) return false;
      final q = search.trim().toLowerCase();
      if (q.isEmpty) return true;
      final hay = '${entry.title} ${entry.category} ${entry.accountName}'.toLowerCase();
      return hay.contains(q);
    }).toList();
  }

  static Map<String, double> prevMonthOutByCategory(List<DashboardEntry> entries) {
    final now = DateTime.now();
    final prev = DateTime(now.year, now.month - 1, 1);
    final prefix = '${prev.year.toString().padLeft(4, '0')}-${prev.month.toString().padLeft(2, '0')}';
    final map = <String, double>{};
    for (final e in entries.where((e) => e.isOut && e.date.startsWith(prefix))) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }

  static Map<String, double> spendByDay(List<DashboardEntry> entries) {
    final map = <String, double>{};
    for (final e in entries.where((e) => e.isOut)) {
      map[e.date] = (map[e.date] ?? 0) + e.amount;
    }
    return map;
  }

  static String dayLabel(String iso) {
    final now = DateTime.now();
    final today = _iso(now);
    final yesterday = _iso(now.subtract(const Duration(days: 1)));
    if (iso == today) return '今天';
    if (iso == yesterday) return '昨天';
    final parts = iso.split('-');
    return '${int.parse(parts[1])}月${int.parse(parts[2])}日';
  }

  static String _iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
