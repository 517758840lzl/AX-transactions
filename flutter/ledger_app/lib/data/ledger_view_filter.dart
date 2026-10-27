import '../l10n/ledger_strings.dart';
import '../tabs/dashboard/dashboard_models.dart';

abstract final class LedgerScope {
  static const mine = 'mine';
  static const family = 'family';
}

abstract final class LedgerPeriodMode {
  static const today = 'today';
  static const month = 'month';
  static const range = 'range';
}

class LedgerPeriodBounds {
  const LedgerPeriodBounds({required this.start, required this.end});

  final String start;
  final String end;
}

abstract final class LedgerViewFilter {
  static String todayIso([DateTime? now]) {
    final n = now ?? DateTime.now();
    return _iso(n);
  }

  static String monthStartIso([DateTime? now]) {
    final n = now ?? DateTime.now();
    return '${n.year.toString().padLeft(4, '0')}-${n.month.toString().padLeft(2, '0')}-01';
  }

  static LedgerPeriodBounds periodBounds(String mode, String rangeFrom, String rangeTo, [DateTime? now]) {
    final today = todayIso(now);
    if (mode == LedgerPeriodMode.today) return LedgerPeriodBounds(start: today, end: today);
    if (mode == LedgerPeriodMode.month) {
      final start = monthStartIso(now);
      return LedgerPeriodBounds(start: start, end: today.compareTo(start) >= 0 ? today : start);
    }
    final start = rangeFrom.compareTo(rangeTo) <= 0 ? rangeFrom : rangeTo;
    final end = rangeFrom.compareTo(rangeTo) <= 0 ? rangeTo : rangeFrom;
    return LedgerPeriodBounds(start: start, end: end.compareTo(today) > 0 ? today : end);
  }

  static List<DashboardEntry> byScope(Iterable<DashboardEntry> entries, String scope) {
    return entries.where((e) => scope == LedgerScope.family ? e.shared : !e.shared).toList();
  }

  static List<DashboardEntry> inPeriod(Iterable<DashboardEntry> entries, LedgerPeriodBounds bounds) {
    return entries.where((e) => e.date.compareTo(bounds.start) >= 0 && e.date.compareTo(bounds.end) <= 0).toList();
  }

  static String _iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  /// Web `periodChipLabel` — period chip in the transactions header.
  static String periodChipLabel(String mode, String rangeFrom, String rangeTo) {
    if (mode == LedgerPeriodMode.today) return LedgerStrings.today;
    if (mode == LedgerPeriodMode.month) return LedgerStrings.monthUnit(DateTime.now().month);
    final start = rangeFrom.compareTo(rangeTo) <= 0 ? rangeFrom : rangeTo;
    final end = rangeFrom.compareTo(rangeTo) <= 0 ? rangeTo : rangeFrom;
    if (start == end) return _dayChipLabel(start);
    final s = start.split('-');
    final e = end.split('-');
    return '${int.parse(s[1])}/${int.parse(s[2])}–${int.parse(e[1])}/${int.parse(e[2])}';
  }

  static String _dayChipLabel(String iso) {
    final now = DateTime.now();
    final today = todayIso(now);
    final yesterday = todayIso(now.subtract(const Duration(days: 1)));
    if (iso == today) return LedgerStrings.todayWord;
    if (iso == yesterday) return LedgerStrings.yesterdayWord;
    final parts = iso.split('-');
    return LedgerStrings.monthDay(int.parse(parts[1]), int.parse(parts[2]));
  }
}
