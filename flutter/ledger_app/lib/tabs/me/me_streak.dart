import '../dashboard/dashboard_models.dart';

abstract final class MeStreak {
  static int streakDays(List<DashboardEntry> entries) {
    final days = entries.map((e) => e.date).toSet();
    if (days.isEmpty) return 0;
    var streak = 0;
    var cursor = DateTime.now();
    for (var guard = 0; guard < 4000; guard++) {
      final iso = _iso(cursor);
      if (days.contains(iso)) {
        streak++;
        cursor = cursor.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }
    return streak;
  }

  static bool loggedToday(List<DashboardEntry> entries) {
    final today = _iso(DateTime.now());
    return entries.any((e) => e.date == today);
  }

  static String _iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
