import 'package:flutter/material.dart';
import '../../data/ledger_budget.dart';
import '../../data/ledger_catalog.dart';
import '../../data/ledger_entry_log.dart';
import '../../l10n/ledger_strings.dart';
import '../../layout/tab_page.dart';
import 'me_book_io.dart';
import 'me_categories_panel.dart';
import '../../data/ledger_session.dart';
import '../../pages/book_export_page.dart';
import '../../pages/book_import_page.dart';
import '../../pages/budget_page.dart';
import '../../pages/privacy_page.dart';
import '../../pages/profile_page.dart';
import '../../widgets/center_note.dart';
import 'me_profile_card.dart';
import 'me_settings_panel.dart';
import 'me_streak.dart';
import 'me_tab_state.dart';

class MeScreen extends StatefulWidget {
  const MeScreen({
    super.key,
    this.mark = r'$',
    required this.budget,
    required this.catalog,
    required this.entries,
    this.session,
    this.currencyIndex = 0,
    this.onCurrencyChanged,
  });

  final String mark;
  final LedgerBudget budget;
  final LedgerCatalog catalog;
  final LedgerEntryLog entries;
  final LedgerSession? session;
  final int currencyIndex;
  final ValueChanged<int>? onCurrencyChanged;

  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  late MeTabState _state;

  @override
  void initState() {
    super.initState();
    _state = MeTabState.initial().copyWith(
      budget: widget.budget.monthly,
      categoryBudgets: widget.budget.categoryCaps,
      currencyIndex: widget.currencyIndex,
    );
    widget.budget.addListener(_syncBudget);
    widget.catalog.addListener(_refresh);
    widget.entries.addListener(_refresh);
  }

  @override
  void didUpdateWidget(covariant MeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currencyIndex != widget.currencyIndex && _state.currencyIndex != widget.currencyIndex) {
      _state = _state.copyWith(currencyIndex: widget.currencyIndex);
    }
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    widget.budget.removeListener(_syncBudget);
    widget.catalog.removeListener(_refresh);
    widget.entries.removeListener(_refresh);
    super.dispose();
  }

  void _syncBudget() {
    if (!mounted) return;
    setState(() {
      _state = _state.copyWith(
        clearBudget: widget.budget.monthly == null,
        budget: widget.budget.monthly,
        categoryBudgets: Map<String, double>.from(widget.budget.categoryCaps),
      );
    });
  }

  String get _streakMeta {
    final saved = widget.entries.entries;
    final streak = MeStreak.streakDays(saved);
    final today = MeStreak.loggedToday(saved);
    return '${LedgerStrings.streakDays} $streak · ${today ? LedgerStrings.streakToday : LedgerStrings.streakNone}';
  }

  Future<void> _editProfile() async {
    final result = await ProfilePage.open(context, nickname: _state.nickname, gender: _state.gender);
    if (result == null) return;
    setState(() => _state = _state.copyWith(nickname: result.nickname, gender: result.gender));
  }

  Future<void> _editBudget() async {
    final result = await BudgetPage.open(
      context,
      categories: widget.catalog.categories,
      monthlyBudget: _state.budget,
      categoryBudgets: _state.categoryBudgets,
    );
    if (result == null) return;
    widget.budget.save(
      clear: result.cleared,
      monthly: result.monthlyBudget,
      categoryCaps: result.categoryBudgets,
    );
  }

  String _exportDocument() {
    final session = widget.session;
    if (session != null) {
      return session.exportDocument(
        nickname: _state.nickname,
        gender: _state.gender,
        locale: _state.localeIndex == 0 ? 'zh' : 'en',
        currency: MeTabState.currencies[_state.currencyIndex],
      );
    }
    return MeBookIo.exportDocument(_state, widget.entries, widget.catalog, widget.budget);
  }

  String? _applyImport(String raw) {
    final session = widget.session;
    if (session != null) {
      if (!session.applyDocument(raw)) return LedgerStrings.importInvalid;
    } else if (MeBookIo.importFromJson(raw) == null) {
      return LedgerStrings.importInvalid;
    }
    final imported = MeBookIo.importFromJson(raw);
    if (imported != null && mounted) {
      setState(() {
        _state = _state.copyWith(
          nickname: imported.nickname,
          gender: imported.gender,
          localeIndex: imported.localeIndex,
          currencyIndex: imported.currencyIndex,
          clearStatusNote: true,
        );
      });
      widget.onCurrencyChanged?.call(imported.currencyIndex);
      if (session == null) {
        widget.budget.save(monthly: imported.budget, categoryCaps: widget.budget.categoryCaps);
        widget.catalog.replace(categories: imported.categories, templates: widget.catalog.templates);
      }
    }
    return null;
  }

  void _clearBook() {
    final session = widget.session;
    if (session != null) {
      session.clearBook();
      return;
    }
    widget.entries.publish([]);
    widget.budget.save(clear: true);
    widget.catalog.replace(categories: widget.catalog.categories, templates: const []);
  }

  Future<void> _openExport() => BookExportPage.open(context, currentDocument: _exportDocument, onClear: _clearBook);

  Future<void> _openImport() => BookImportPage.open(context, onApply: _applyImport);

  Future<void> _openPrivacy() => PrivacyPage.open(context);

  void _changeCurrency(int index) {
    setState(() => _state = _state.copyWith(currencyIndex: index));
    widget.onCurrencyChanged?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      scrollCacheExtent: TabPage.scrollCache,
      padding: TabPage.listPaddingRest,
      children: [
        Text(LedgerStrings.me, style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 14),
        MeProfileCard(
          displayName: _state.displayName,
          avatarInitial: _state.avatarInitial,
          streakMeta: _streakMeta,
          hasNickname: _state.hasNickname,
          gender: _state.gender,
          onTap: _editProfile,
        ),
        MeSettingsPanel(
          state: _state,
          mark: widget.mark,
          onBudgetTap: _editBudget,
          onExport: _openExport,
          onImport: _openImport,
          onPrivacy: _openPrivacy,
          onLocaleChanged: (i) => setState(() => _state = _state.copyWith(localeIndex: i)),
          onCurrencyChanged: _changeCurrency,
        ),
        MeCategoriesPanel(
          categories: widget.catalog.categories,
          onAdd: (name) {
            widget.catalog.addCategory(name);
            showCenterNote(context, LedgerStrings.categoryAdded(name));
          },
          onRemove: (name) {
            final fallback = widget.catalog.removeCategory(name);
            if (fallback == null) return;
            widget.entries.publish([
              for (final entry in widget.entries.entries)
                entry.category == name ? entry.copyWith(category: fallback) : entry,
            ]);
          },
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
