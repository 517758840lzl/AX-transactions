import '../../data/ledger_view_filter.dart';
import '../../l10n/ledger_strings.dart';
import 'dashboard_analytics.dart';
import 'dashboard_models.dart';
import 'dashboard_sample_data.dart';

class DashboardTabState {
  DashboardTabState({
    required this.entries,
    this.monthlyBudget,
    this.categoryBudgets = const {},
    this.sampleCleared = false,
    this.netWorth = 5172.96,
    this.scope = LedgerScope.mine,
    this.periodMode = LedgerPeriodMode.month,
    String? rangeFrom,
    String? rangeTo,
  })  : rangeFrom = rangeFrom ?? LedgerViewFilter.monthStartIso(),
        rangeTo = rangeTo ?? LedgerViewFilter.todayIso();

  final List<DashboardEntry> entries;
  final double? monthlyBudget;
  final Map<String, double> categoryBudgets;
  final bool sampleCleared;
  final double netWorth;
  final String scope;
  final String periodMode;
  final String rangeFrom;
  final String rangeTo;

  static DashboardTabState initial() => DashboardTabState(entries: DashboardSampleData.seedEntries());

  List<DashboardEntry>? _scoped;
  List<DashboardEntry>? _period;
  double? _monthOut;
  double? _monthIn;
  List<DashboardEntry>? _review;
  List<DashboardCategoryPart>? _categories;
  List<DashboardRecurringItem>? _recurring;
  List<double>? _spend;

  List<DashboardEntry> get scopedEntries => _scoped ??= LedgerViewFilter.byScope(entries, scope);

  LedgerPeriodBounds get _periodBounds => LedgerViewFilter.periodBounds(periodMode, rangeFrom, rangeTo);

  List<DashboardEntry> get periodEntries => _period ??= LedgerViewFilter.inPeriod(scopedEntries, _periodBounds);

  String get scopeChipLabel => scope == LedgerScope.mine ? LedgerStrings.scopeChipMine : LedgerStrings.scopeChipFamily;

  double get monthOut => _monthOut ??= periodEntries.where((e) => e.isOut).fold<double>(0, (s, e) => s + e.amount);

  double get monthIn => _monthIn ??= periodEntries.where((e) => !e.isOut).fold<double>(0, (s, e) => s + e.amount);

  double get monthBalance => monthIn - monthOut;

  List<DashboardEntry> get reviewQueue => _review ??= DashboardAnalytics.reviewQueue(scopedEntries);

  List<DashboardCategoryPart> get monthCategories => _categories ??= DashboardAnalytics.spendCategories(periodEntries, categoryBudgets);

  List<DashboardRecurringItem> get recurring => _recurring ??= DashboardAnalytics.recurring(entries);

  List<double> get monthSpendSeries => _spend ??= DashboardAnalytics.monthSpendSeries(scopedEntries);

  bool get showSampleBanner => !sampleCleared && DashboardSampleData.hasSampleEntries(entries);

  double? get budgetLeft => monthlyBudget != null ? monthlyBudget! - monthOut : null;

  double? get safeDaily {
    final left = budgetLeft;
    if (left == null) return null;
    final days = DashboardAnalytics.daysLeftInMonth(DateTime.now());
    return left / days;
  }

  bool get paceOver => monthlyBudget != null && monthlyBudget! > 0 && DashboardAnalytics.paceOverBudget(monthOut, monthlyBudget!, DateTime.now());

  DashboardTabState copyWith({
    List<DashboardEntry>? entries,
    double? monthlyBudget,
    bool clearBudget = false,
    Map<String, double>? categoryBudgets,
    bool? sampleCleared,
    double? netWorth,
    String? scope,
    String? periodMode,
    String? rangeFrom,
    String? rangeTo,
  }) {
    return DashboardTabState(
      entries: entries ?? this.entries,
      monthlyBudget: clearBudget ? null : (monthlyBudget ?? this.monthlyBudget),
      categoryBudgets: categoryBudgets ?? this.categoryBudgets,
      sampleCleared: sampleCleared ?? this.sampleCleared,
      netWorth: netWorth ?? this.netWorth,
      scope: scope ?? this.scope,
      periodMode: periodMode ?? this.periodMode,
      rangeFrom: rangeFrom ?? this.rangeFrom,
      rangeTo: rangeTo ?? this.rangeTo,
    );
  }

  DashboardTabState clearSample() {
    final kept = entries.where((e) => !e.id.startsWith('sample-')).toList();
    return copyWith(entries: kept, sampleCleared: true, netWorth: kept.isEmpty ? 0 : netWorth);
  }

  DashboardTabState markReviewed(Iterable<String> ids) {
    final idSet = ids.toSet();
    for (final e in entries) {
      if (idSet.contains(e.id)) e.checked = true;
    }
    return copyWith(entries: List.from(entries));
  }

  DashboardTabState toggleReview(String id) {
    final entry = entries.firstWhere((e) => e.id == id);
    entry.checked = !entry.checked;
    return copyWith(entries: List.from(entries));
  }

  DashboardTabState updateEntry(DashboardEntry updated) {
    return copyWith(entries: entries.map((e) => e.id == updated.id ? updated : e).toList());
  }

  DashboardTabState removeEntry(String id) {
    return copyWith(entries: entries.where((e) => e.id != id).toList());
  }
}
