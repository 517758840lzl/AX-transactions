import 'dashboard_models.dart';

abstract final class DashboardSampleData {
  static String _daysAgo(int n) {
    final d = DateTime.now().subtract(Duration(days: n));
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  static String _dateInMonth(int monthOffset, int day) {
    final now = DateTime.now();
    final d = DateTime(now.year, now.month + monthOffset, day);
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  static List<DashboardEntry> seedEntries() => [
        DashboardEntry(id: 'sample-lunch', title: '午饭', amount: 18.4, direction: 'out', category: '餐饮', date: _daysAgo(0), accountName: '现金', accountId: 'sample-cash', checked: false),
        DashboardEntry(id: 'sample-metro', title: '地铁', amount: 2.75, direction: 'out', category: '交通', date: _daysAgo(0), accountName: '现金', accountId: 'sample-cash', checked: true),
        DashboardEntry(id: 'sample-coffee', title: '咖啡', amount: 6.5, direction: 'out', category: '餐饮', date: _daysAgo(1), accountName: 'Visa', accountId: 'sample-card', checked: false),
        DashboardEntry(id: 'sample-market', title: '超市', amount: 54.2, direction: 'out', category: '日用', date: _daysAgo(1), accountName: 'Visa', accountId: 'sample-card', checked: true, shared: true),
        DashboardEntry(id: 'sample-film', title: '电影', amount: 16, direction: 'out', category: '娱乐', date: _daysAgo(4), accountName: 'Visa', accountId: 'sample-card', checked: false),
        DashboardEntry(id: 'sample-sub', title: '视频会员', amount: 15.99, direction: 'out', category: '订阅', date: _daysAgo(8), accountName: 'Visa', accountId: 'sample-card', checked: true),
        DashboardEntry(id: 'sample-rent', title: '房租', amount: 1450, direction: 'out', category: '居住', date: _daysAgo(15), accountName: 'Visa', accountId: 'sample-card', checked: true, shared: true),
        DashboardEntry(id: 'sample-pay', title: '工资', amount: 3200, direction: 'in', category: '收入', date: _daysAgo(19), accountName: 'Visa', accountId: 'sample-card', checked: true),
        DashboardEntry(id: 'sample-prev-coffee', title: '咖啡', amount: 7.2, direction: 'out', category: '餐饮', date: _dateInMonth(-1, 6), accountName: 'Visa', accountId: 'sample-card', checked: true),
        DashboardEntry(id: 'sample-prev-market', title: '超市', amount: 48, direction: 'out', category: '日用', date: _dateInMonth(-1, 14), accountName: 'Visa', accountId: 'sample-card', checked: true, shared: true),
        DashboardEntry(id: 'sample-prev-ride', title: '地铁', amount: 18, direction: 'out', category: '交通', date: _dateInMonth(-1, 21), accountName: 'Visa', accountId: 'sample-card', checked: false),
        DashboardEntry(id: 'sample-prev-rent', title: '房租', amount: 1450, direction: 'out', category: '居住', date: _dateInMonth(-1, 5), accountName: 'Visa', accountId: 'sample-card', checked: true, shared: true),
      ];

  static bool hasSampleEntries(List<DashboardEntry> entries) => entries.any((e) => e.id.startsWith('sample-'));
}
