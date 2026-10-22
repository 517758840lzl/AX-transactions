import '../../l10n/ledger_strings.dart';
import '../dashboard/dashboard_models.dart';
import '../dashboard/dashboard_sample_data.dart';
import 'me_models.dart';
import 'me_streak.dart';

class MeTabState {
  MeTabState({
    this.nickname = '',
    this.gender = MeGender.secret,
    this.localeIndex = 0,
    this.currencyIndex = 0,
    this.budget,
    this.categoryBudgets = const {},
    this.statusNote,
    List<String>? categories,
    List<MeTemplate>? templates,
    List<DashboardEntry>? entries,
  })  : categories = categories ?? List.from(MeStarter.categories),
        templates = templates ?? const [],
        entries = entries ?? DashboardSampleData.seedEntries();

  static const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'HKD', 'TWD', 'SGD', 'AUD', 'KRW', 'CAD'];

  static const currencyMarks = <String, String>{
    'USD': r'$',
    'EUR': '€',
    'JPY': '円',
    'GBP': '£',
    'HKD': 'HK\$',
    'TWD': 'NT\$',
    'SGD': 'S\$',
    'AUD': 'A\$',
    'KRW': '₩',
    'CAD': 'C\$',
  };

  static String markFor(String code) => currencyMarks[code] ?? r'$';

  static String markAt(int index) {
    if (index < 0 || index >= currencies.length) return r'$';
    return markFor(currencies[index]);
  }

  static int indexOfCurrency(String? code) {
    if (code == null || code == 'CNY') return 0;
    final index = currencies.indexOf(code);
    return index < 0 ? 0 : index;
  }

  final String nickname;
  final String gender;
  final int localeIndex;
  final int currencyIndex;
  final double? budget;
  final Map<String, double> categoryBudgets;
  final String? statusNote;
  final List<String> categories;
  final List<MeTemplate> templates;
  final List<DashboardEntry> entries;

  int get logStreak => MeStreak.streakDays(entries);

  bool get loggedToday => MeStreak.loggedToday(entries);

  String get displayName => nickname.isEmpty ? LedgerStrings.unsetName : nickname;

  String get avatarInitial => nickname.isEmpty ? LedgerStrings.unsetMark : nickname.substring(0, 1);

  bool get hasNickname => nickname.isNotEmpty;

  factory MeTabState.initial() => MeTabState();

  Map<String, Object?> toBookSnapshot() => {
        'nickname': nickname,
        'gender': gender,
        'locale': localeIndex == 0 ? 'zh' : 'en',
        'currency': currencies[currencyIndex],
        'budget': budget,
        'categoryBudgets': categoryBudgets,
        'categories': categories,
        'templates': templates
            .map((t) => {'id': t.id, 'title': t.title, 'amount': t.amount, 'direction': t.direction})
            .toList(),
        'accounts': <Map<String, Object?>>[],
        'entries': <Map<String, Object?>>[],
        'holdings': <Map<String, Object?>>[],
      };

  MeTabState copyWith({
    String? nickname,
    String? gender,
    int? localeIndex,
    int? currencyIndex,
    double? budget,
    bool clearBudget = false,
    Map<String, double>? categoryBudgets,
    String? statusNote,
    bool clearStatusNote = false,
    List<String>? categories,
    List<MeTemplate>? templates,
    List<DashboardEntry>? entries,
  }) {
    return MeTabState(
      nickname: nickname ?? this.nickname,
      gender: gender ?? this.gender,
      localeIndex: localeIndex ?? this.localeIndex,
      currencyIndex: currencyIndex ?? this.currencyIndex,
      budget: clearBudget ? null : (budget ?? this.budget),
      categoryBudgets: categoryBudgets ?? this.categoryBudgets,
      statusNote: clearStatusNote ? null : (statusNote ?? this.statusNote),
      categories: categories ?? this.categories,
      templates: templates ?? this.templates,
      entries: entries ?? this.entries,
    );
  }

  MeTabState removeCategory(String name) {
    if (categories.length <= 1) return this;
    final fallback = categories.firstWhere((c) => c != name);
    final nextEntries = entries.map((e) => e.category == name ? e.copyWith(category: fallback) : e).toList();
    return copyWith(
      categories: categories.where((c) => c != name).toList(),
      entries: nextEntries,
    );
  }

  MeTabState addCategory(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty || categories.contains(trimmed)) return this;
    return copyWith(categories: [...categories, trimmed]);
  }

  MeTabState removeTemplate(String id) {
    return copyWith(templates: templates.where((t) => t.id != id).toList());
  }

  static MeTabState? fromImportMap(Map<String, dynamic> map) {
    try {
      final nick = map['nickname'] as String? ?? '';
      final cur = map['currency'] as String? ?? 'USD';
      final b = map['budget'];
      final cats = map['categories'];
      final genderRaw = map['gender'] as String? ?? 'secret';
      final gender = MeGender.read(genderRaw);
      return MeTabState(
        nickname: nick,
        gender: gender,
        localeIndex: map['locale'] == 'en' ? 1 : 0,
        currencyIndex: indexOfCurrency(cur),
        budget: b is num && b > 0 ? b.toDouble() : null,
        categories: cats is List ? cats.map((e) => e.toString()).toList() : List.from(MeStarter.categories),
      );
    } catch (_) {
      return null;
    }
  }
}
