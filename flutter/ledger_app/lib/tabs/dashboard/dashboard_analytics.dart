import '../../data/ledger_view_filter.dart';
import 'dashboard_models.dart';
import 'dashboard_slice_colors.dart';

abstract final class DashboardAnalytics {
  /// Web `monthSpend` — 本月每日支出（范围过滤后的流水）
  static List<double> monthSpendSeries(List<DashboardEntry> scopedEntries) {
    final start = LedgerViewFilter.monthStartIso();
    final end = LedgerViewFilter.todayIso();
    final byDay = <String, double>{};
    for (final entry in scopedEntries) {
      if (!entry.isOut || entry.date.compareTo(start) < 0 || entry.date.compareTo(end) > 0) continue;
      byDay[entry.date] = (byDay[entry.date] ?? 0) + entry.amount;
    }
    return [for (final day in _eachDay(start, end)) byDay[day] ?? 0];
  }

  static List<String> _eachDay(String start, String end) {
    var cursor = DateTime.parse('${start}T00:00:00');
    final last = DateTime.parse('${end}T00:00:00');
    final out = <String>[];
    while (!cursor.isAfter(last)) {
      out.add(_iso(cursor));
      cursor = cursor.add(const Duration(days: 1));
    }
    return out;
  }

  static String _iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  static double monthOut(Iterable<DashboardEntry> entries, String monthPrefix) {
    return entries.where((e) => e.isOut && e.date.startsWith(monthPrefix)).fold(0.0, (s, e) => s + e.amount);
  }

  static double monthIn(Iterable<DashboardEntry> entries, String monthPrefix) {
    return entries.where((e) => !e.isOut && e.date.startsWith(monthPrefix)).fold(0.0, (s, e) => s + e.amount);
  }

  static List<DashboardEntry> reviewQueue(List<DashboardEntry> entries) {
    final open = entries.where((e) => !e.checked).toList()..sort((a, b) => b.date.compareTo(a.date));
    return open.take(6).toList();
  }

  static List<DashboardCategoryPart> spendCategories(List<DashboardEntry> periodEntries, Map<String, double> caps) {
    final outs = periodEntries.where((e) => e.isOut);
    final names = <String>{};
    for (final e in outs) {
      names.add(e.category);
    }
    final list = names.toList()..sort();
    return [
      for (var i = 0; i < list.length; i++)
        DashboardCategoryPart(
          name: list[i],
          amount: outs.where((e) => e.category == list[i]).fold(0.0, (s, e) => s + e.amount),
          colorHex: DashboardSliceColors.at(i),
          budgetCap: caps[list[i]],
        ),
    ].where((p) => p.amount > 0).toList();
  }

  static List<DashboardCategoryPart> monthCategories(List<DashboardEntry> entries, String monthPrefix, Map<String, double> caps) {
    final outs = entries.where((e) => e.isOut && e.date.startsWith(monthPrefix));
    final names = <String>{};
    for (final e in outs) {
      names.add(e.category);
    }
    final list = names.toList()..sort();
    return [
      for (var i = 0; i < list.length; i++)
        DashboardCategoryPart(
          name: list[i],
          amount: outs.where((e) => e.category == list[i]).fold(0.0, (s, e) => s + e.amount),
          colorHex: DashboardSliceColors.at(i),
          budgetCap: caps[list[i]],
        ),
    ].where((p) => p.amount > 0).toList();
  }

  static List<DashboardRecurringItem> recurring(List<DashboardEntry> entries) {
    final cutoff = DateTime.now().subtract(const Duration(days: 120));
    final minIso = _iso(cutoff);
    final groups = <String, _RecurringBucket>{};
    for (final e in entries) {
      if (!e.isOut || e.date.compareTo(minIso) < 0) continue;
      final key = '${e.title.trim()}|${e.amount}';
      final bucket = groups.putIfAbsent(key, () => _RecurringBucket(e.title, e.amount));
      bucket.dates.add(e.date);
    }
    return groups.values
        .where((g) => g.dates.length >= 2)
        .map((g) => DashboardRecurringItem(title: g.title, amount: g.amount, times: g.dates.length))
        .toList()
      ..sort((a, b) => b.times.compareTo(a.times));
  }

  static int daysLeftInMonth(DateTime now) {
    final last = DateTime(now.year, now.month + 1, 0).day;
    return last - now.day + 1;
  }

  static bool paceOverBudget(double monthOut, double budget, DateTime now) {
    if (budget <= 0) return false;
    final monthDays = DateTime(now.year, now.month + 1, 0).day;
    final day = now.day;
    if (day <= 0) return false;
    return (monthOut / day) * monthDays > budget;
  }
}

class _RecurringBucket {
  _RecurringBucket(this.title, this.amount);

  final String title;
  final double amount;
  final dates = <String>{};
}
