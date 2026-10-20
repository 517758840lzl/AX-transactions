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

  static const currencies = ['USD', 'EUR', 'CNY'];

  final String nickname;
  final MeGender gender;
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

  String get displayName => nickname.isEmpty ? '未设置' : nickname;

  String get avatarInitial => nickname.isEmpty ? '未' : nickname.substring(0, 1);

  bool get hasNickname => nickname.isNotEmpty;

  factory MeTabState.initial() => MeTabState();

  Map<String, Object?> toBookSnapshot() => {
        'nickname': nickname,
        'gender': gender.name,
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
    MeGender? gender,
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
      final gender = MeGender.values.firstWhere((g) => g.name == genderRaw, orElse: () => MeGender.secret);
      return MeTabState(
        nickname: nick,
        gender: gender,
        localeIndex: map['locale'] == 'en' ? 1 : 0,
        currencyIndex: currencies.indexOf(cur).clamp(0, currencies.length - 1),
        budget: b is num && b > 0 ? b.toDouble() : null,
        categories: cats is List ? cats.map((e) => e.toString()).toList() : List.from(MeStarter.categories),
      );
    } catch (_) {
      return null;
    }
  }
}
