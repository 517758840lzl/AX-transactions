import '../../data/ledger_view_filter.dart';
import '../dashboard/dashboard_models.dart';
import '../dashboard/dashboard_sample_data.dart';
import '../dashboard/dashboard_slice_colors.dart';
import 'transactions_analytics.dart';

enum TransactionsStatusFilter { all, open, done }

class TransactionsSpendPart {
  const TransactionsSpendPart({required this.name, required this.amount, required this.colorHex});

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
  })  : rangeFrom = rangeFrom ?? LedgerViewFilter.monthStartIso(),
        rangeTo = rangeTo ?? LedgerViewFilter.todayIso();

  final List<DashboardEntry> entries;
  final String search;
  final TransactionsStatusFilter statusFilter;
  final String? categoryFilter;
  final int txViewIndex;
  final String? calendarDay;
  final LedgerPeriodMode periodMode;
  final LedgerScope scope;
  final String rangeFrom;
  final String rangeTo;
  final bool sampleCleared;

  static TransactionsTabState initial() => TransactionsTabState(entries: DashboardSampleData.seedEntries());

  List<DashboardEntry>? _period;
  List<TransactionsSpendPart>? _parts;

  String get periodLabel => LedgerViewFilter.periodChipLabel(periodMode, rangeFrom, rangeTo);

  bool get showSampleBanner => !sampleCleared && DashboardSampleData.hasSampleEntries(entries);

  List<DashboardEntry> get periodEntries => _period ??= TransactionsAnalytics.filterEntries(
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

  List<DashboardEntry> get listEntries {
    if (txViewIndex == 1 && calendarDay != null) {
      return periodEntries.where((e) => e.date == calendarDay).toList();
    }
    return periodEntries;
  }

  double get periodOut => periodEntries.where((e) => e.isOut).fold(0.0, (s, e) => s + e.amount);

  double get periodIn => periodEntries.where((e) => !e.isOut).fold(0.0, (s, e) => s + e.amount);

  List<TransactionsSpendPart> get spendParts => _parts ??= _buildSpendParts();

  List<TransactionsSpendPart> _buildSpendParts() {
    final names = <String>{};
    for (final e in periodEntries.where((e) => e.isOut)) {
      names.add(e.category);
    }
    final list = names.toList()..sort();
    return [
      for (var i = 0; i < list.length; i++)
        TransactionsSpendPart(
          name: list[i],
          amount: periodEntries.where((e) => e.isOut && e.category == list[i]).fold(0.0, (s, e) => s + e.amount),
          colorHex: DashboardSliceColors.at(i),
        ),
    ].where((p) => p.amount > 0).toList()..sort((a, b) => b.amount.compareTo(a.amount));
  }

  Map<String, double> get prevMonthOutByCategory => TransactionsAnalytics.prevMonthOutByCategory(entries);

  Map<String, double> get spendByDay => TransactionsAnalytics.spendByDay(periodEntries);

  List<String> get txDays {
    final days = listEntries.map((e) => e.date).toSet().toList()..sort((a, b) => b.compareTo(a));
    return days;
  }

  TransactionsTabState copyWith({
    List<DashboardEntry>? entries,
    String? search,
    TransactionsStatusFilter? statusFilter,
    String? categoryFilter,
    bool clearCategoryFilter = false,
    int? txViewIndex,
    String? calendarDay,
    LedgerPeriodMode? periodMode,
    LedgerScope? scope,
    String? rangeFrom,
    String? rangeTo,
    bool? sampleCleared,
  }) {
    return TransactionsTabState(
      entries: entries ?? this.entries,
      search: search ?? this.search,
      statusFilter: statusFilter ?? this.statusFilter,
      categoryFilter: clearCategoryFilter ? null : (categoryFilter ?? this.categoryFilter),
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
    return copyWith(entries: entries.map((e) => e.id == updated.id ? updated : e).toList());
  }

  TransactionsTabState removeEntry(String id) {
    return copyWith(entries: entries.where((e) => e.id != id).toList());
  }
}
