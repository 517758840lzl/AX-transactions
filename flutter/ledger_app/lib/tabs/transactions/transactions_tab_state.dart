import '../../data/ledger_view_filter.dart';
import '../dashboard/dashboard_models.dart';
import '../dashboard/dashboard_sample_data.dart';
import '../dashboard/dashboard_slice_colors.dart';
import 'transactions_analytics.dart';

abstract final class TransactionsStatusFilter {
  static const all = 'all';
  static const open = 'open';
  static const done = 'done';
}

class TransactionsSpendPart {
  const TransactionsSpendPart({
    required this.name,
    required this.amount,
    required this.colorHex,
  });

  final String name;
  final double amount;
  final String colorHex;
}

class TransactionsTabState {
  TransactionsTabState({
    required this.entries,
    this.search = '',
    this.statusFilter = TransactionsStatusFilter.all,
    this.categoryFilter,
    this.txViewIndex = 0,
    this.calendarDay,
    this.periodMode = LedgerPeriodMode.month,
    this.scope = LedgerScope.mine,
    String? rangeFrom,
    String? rangeTo,
    this.sampleCleared = false,
  }) : rangeFrom = rangeFrom ?? LedgerViewFilter.monthStartIso(),
       rangeTo = rangeTo ?? LedgerViewFilter.todayIso();

  final List<DashboardEntry> entries;
  final String search;
  final String statusFilter;
  final String? categoryFilter;
  final int txViewIndex;
  final String? calendarDay;
  final String periodMode;
  final String scope;
  final String rangeFrom;
  final String rangeTo;
  final bool sampleCleared;

  static TransactionsTabState initial() =>
      TransactionsTabState(entries: DashboardSampleData.seedEntries());

  List<DashboardEntry>? _period;
  List<DashboardEntry>? _list;
  List<TransactionsSpendPart>? _parts;
  double? _periodOut;
  double? _periodIn;
  List<String>? _txDays;
  Map<String, double>? _spendByDay;
  Map<String, double>? _prevMonthOut;

  String get periodLabel =>
      LedgerViewFilter.periodChipLabel(periodMode, rangeFrom, rangeTo);

  bool get showSampleBanner =>
      !sampleCleared && DashboardSampleData.hasSampleEntries(entries);

  List<DashboardEntry> get periodEntries =>
      _period ??= TransactionsAnalytics.filterEntries(
        entries: entries,
        scope: scope,
        periodMode: periodMode,
        rangeFrom: rangeFrom,
        rangeTo: rangeTo,
        search: search,
        statusFilter: statusFilter,
        categoryFilter: categoryFilter,
        calendarDay: null,
        txViewIndex: 0,
      );

  List<DashboardEntry> get listEntries =>
      _list ??= txViewIndex == 1 && calendarDay != null
      ? periodEntries.where((e) => e.date == calendarDay).toList()
      : periodEntries;

  double get periodOut {
    final cached = _periodOut;
    if (cached != null) return cached;
    var sum = 0.0;
    for (final entry in periodEntries) {
      if (entry.isOut) sum += entry.amount;
    }
    return _periodOut = sum;
  }

  double get periodIn {
    final cached = _periodIn;
    if (cached != null) return cached;
    var sum = 0.0;
    for (final entry in periodEntries) {
      if (!entry.isOut) sum += entry.amount;
    }
    return _periodIn = sum;
  }

  List<TransactionsSpendPart> get spendParts => _parts ??= _buildSpendParts();

  List<TransactionsSpendPart> _buildSpendParts() {
    final totals = <String, double>{};
    for (final entry in periodEntries) {
      if (!entry.isOut) continue;
      totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount;
    }
    final names = totals.keys.toList()..sort();
    final parts = <TransactionsSpendPart>[];
    for (var i = 0; i < names.length; i++) {
      final amount = totals[names[i]]!;
      if (amount <= 0) continue;
      parts.add(
        TransactionsSpendPart(
          name: names[i],
          amount: amount,
          colorHex: DashboardSliceColors.at(i),
        ),
      );
    }
    parts.sort((a, b) => b.amount.compareTo(a.amount));
    return parts;
  }

  Map<String, double> get prevMonthOutByCategory =>
      _prevMonthOut ??= TransactionsAnalytics.prevMonthOutByCategory(entries);

  Map<String, double> get spendByDay =>
      _spendByDay ??= TransactionsAnalytics.spendByDay(periodEntries);

  List<String> get txDays =>
      _txDays ??= (listEntries.map((e) => e.date).toSet().toList()
        ..sort((a, b) => b.compareTo(a)));

  TransactionsTabState copyWith({
    List<DashboardEntry>? entries,
    String? search,
    String? statusFilter,
    String? categoryFilter,
    bool clearCategoryFilter = false,
    int? txViewIndex,
    String? calendarDay,
    String? periodMode,
    String? scope,
    String? rangeFrom,
    String? rangeTo,
    bool? sampleCleared,
  }) {
    return TransactionsTabState(
      entries: entries ?? this.entries,
      search: search ?? this.search,
      statusFilter: statusFilter ?? this.statusFilter,
      categoryFilter: clearCategoryFilter
          ? null
          : (categoryFilter ?? this.categoryFilter),
      txViewIndex: txViewIndex ?? this.txViewIndex,
      calendarDay: calendarDay ?? this.calendarDay,
      periodMode: periodMode ?? this.periodMode,
      scope: scope ?? this.scope,
      rangeFrom: rangeFrom ?? this.rangeFrom,
      rangeTo: rangeTo ?? this.rangeTo,
      sampleCleared: sampleCleared ?? this.sampleCleared,
    );
  }

  TransactionsTabState clearSample() {
    final kept = entries.where((e) => !e.id.startsWith('sample-')).toList();
    return copyWith(entries: kept, sampleCleared: true);
  }

  TransactionsTabState toggleChecked(String id) {
    final entry = entries.firstWhere((e) => e.id == id);
    entry.checked = !entry.checked;
    return copyWith(entries: List.from(entries));
  }

  TransactionsTabState updateEntry(DashboardEntry updated) {
    return copyWith(
      entries: entries.map((e) => e.id == updated.id ? updated : e).toList(),
    );
  }

  TransactionsTabState removeEntry(String id) {
    return copyWith(entries: entries.where((e) => e.id != id).toList());
  }
}
