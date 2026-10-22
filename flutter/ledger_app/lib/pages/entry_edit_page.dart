import 'package:flutter/material.dart';
import '../data/ledger_catalog.dart';
import '../data/ledger_view_filter.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_models.dart';
import '../tabs/accounts/accounts_sample_data.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../tabs/me/me_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_choice_row.dart';
import '../widgets/ledger_field.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_popup.dart';
import '../widgets/ledger_subpage_head.dart';

abstract final class EntryEditAction {
  static const saved = 'saved';
  static const deleted = 'deleted';
}

class EntryEditResult {
  const EntryEditResult({required this.action, this.entry});

  final String action;
  final DashboardEntry? entry;
}

/// Web `panel === 'entry'`（示例账点开可改账户等）
class EntryEditPage extends StatefulWidget {
  const EntryEditPage({
    super.key,
    this.entry,
    required this.mark,
    required this.catalog,
    this.savedEntries = const [],
  });

  final DashboardEntry? entry;
  final String mark;
  final LedgerCatalog catalog;
  final List<DashboardEntry> savedEntries;

  bool get isNew => entry == null;

  static Future<EntryEditResult?> open(
    BuildContext context, {
    required DashboardEntry entry,
    required String mark,
    required LedgerCatalog catalog,
    List<DashboardEntry> savedEntries = const [],
  }) {
    return Navigator.of(context).push<EntryEditResult>(
      MaterialPageRoute(
        builder: (_) => EntryEditPage(entry: entry, mark: mark, catalog: catalog, savedEntries: savedEntries),
      ),
    );
  }

  static Future<EntryEditResult?> openNew(
    BuildContext context, {
    required String mark,
    required LedgerCatalog catalog,
    List<DashboardEntry> savedEntries = const [],
  }) {
    return Navigator.of(context).push<EntryEditResult>(
      MaterialPageRoute(builder: (_) => EntryEditPage(mark: mark, catalog: catalog, savedEntries: savedEntries)),
    );
  }

  @override
  State<EntryEditPage> createState() => _EntryEditPageState();
}

class _EntryEditPageState extends State<EntryEditPage> {
  late bool _isOut;
  late final TextEditingController _amount;
  late final TextEditingController _title;
  late String _date;
  late String _category;
  late String _accountId;
  late bool _shared;
  var _saveReady = false;
  String? _highlightedTitle;

  List<LedgerAccount> get _accounts => AccountsSampleData.sampleAccounts();

  List<String> get _categories {
    final names = widget.catalog.categories;
    return names.isEmpty ? MeStarter.categories : names;
  }

  @override
  void initState() {
    super.initState();
    widget.catalog.addListener(_onCatalog);
    final entry = widget.entry;
    final accounts = _accounts;
    _isOut = entry?.isOut ?? true;
    _amount = TextEditingController(text: entry == null ? '' : entry.amount.toStringAsFixed(2));
    _title = TextEditingController(text: entry?.title ?? '');
    _date = entry?.date ?? LedgerViewFilter.todayIso();
    _category = entry?.category ?? _categories.first;
    _accountId = entry?.accountId ?? (accounts.isEmpty ? '' : accounts.first.id);
    _shared = entry?.shared ?? false;
    _amount.addListener(_onDraftText);
    _title.addListener(_onDraftText);
    _syncDraftFlags();
  }

  void _onDraftText() {
    if (!mounted) return;
    final ready = _canSave;
    final highlighted = _highlightedFromTitle();
    if (ready == _saveReady && highlighted == _highlightedTitle) return;
    setState(() {
      _saveReady = ready;
      _highlightedTitle = highlighted;
    });
  }

  void _syncDraftFlags() {
    _saveReady = _canSave;
    _highlightedTitle = _highlightedFromTitle();
  }

  String? _highlightedFromTitle() {
    final title = _title.text.trim();
    if (title.isEmpty) return null;
    for (final suggestion in _titleSuggestions) {
      if (suggestion == title) return title;
    }
    return null;
  }

  void _onCatalog() {
    if (!mounted) return;
    if (!_categories.contains(_category)) _category = _categories.first;
    setState(() {});
  }

  @override
  void dispose() {
    widget.catalog.removeListener(_onCatalog);
    _amount.removeListener(_onDraftText);
    _title.removeListener(_onDraftText);
    _amount.dispose();
    _title.dispose();
    super.dispose();
  }

  InputDecoration get _fieldDecoration => InputDecoration(
        filled: true,
        fillColor: LedgerColors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      );

  bool get _canSave {
    final title = _title.text.trim();
    final amount = double.tryParse(_amount.text.trim());
    return title.isNotEmpty && amount != null && amount > 0 && _accounts.isNotEmpty;
  }

  List<String> get _titleSuggestions {
    final counts = <String, int>{};
    for (final entry in widget.savedEntries) {
      final title = entry.title.trim();
      if (title.isEmpty) continue;
      counts[title] = (counts[title] ?? 0) + 1;
    }
    final titles = counts.keys.toList()
      ..sort((a, b) {
        final byCount = counts[b]!.compareTo(counts[a]!);
        return byCount != 0 ? byCount : a.compareTo(b);
      });
    return titles.take(6).toList();
  }

  Future<void> _pickDate() async {
    final picked = await showLedgerDate(context, value: _date);
    if (picked == null || !mounted) return;
    setState(() => _date = picked);
  }

  String get _accountLabel {
    for (final account in _accounts) {
      if (account.id == _accountId) return account.name;
    }
    return _accounts.isEmpty ? '' : _accounts.first.name;
  }

  Future<void> _pickAccount() async {
    if (_accounts.isEmpty) return;
    final picked = await showLedgerChoices(
      context,
      selected: _accountId,
      options: [for (final account in _accounts) LedgerChoice(account.id, account.name)],
    );
    if (picked == null || !mounted) return;
    setState(() => _accountId = picked);
  }

  void _save() {
    if (!_canSave) return;
    final title = _title.text.trim();
    final amount = double.parse(_amount.text.trim());
    final account = _accounts.firstWhere((a) => a.id == _accountId, orElse: () => _accounts.first);
    final existing = widget.entry;
    final updated = existing == null
        ? DashboardEntry(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            title: title,
            amount: amount,
            direction: _isOut ? 'out' : 'in',
            category: _category,
            date: _date,
            accountName: account.name,
            accountId: account.id,
            checked: false,
            shared: _shared,
          )
        : existing.copyWith(
            title: title,
            amount: amount,
            direction: _isOut ? 'out' : 'in',
            category: _category,
            date: _date,
            accountId: account.id,
            accountName: account.name,
            shared: _shared,
          );
    Navigator.pop(context, EntryEditResult(action: EntryEditAction.saved, entry: updated));
  }

  void _delete() {
    Navigator.pop(context, const EntryEditResult(action: EntryEditAction.deleted));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(title: widget.isNew ? LedgerStrings.entryNew : LedgerStrings.entryEdit, onBack: () => Navigator.pop(context)),
                LedgerChoiceRow(
                  labels: const [LedgerStrings.expense, LedgerStrings.income],
                  index: _isOut ? 0 : 1,
                  onChanged: (i) => setState(() => _isOut = i == 0),
                ),
                const SizedBox(height: 16),
                Text(LedgerStrings.amount, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _amount,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _fieldDecoration,
                ),
                const SizedBox(height: 14),
                Text(LedgerStrings.name, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(controller: _title, decoration: _fieldDecoration),
                if (_titleSuggestions.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(LedgerStrings.titleSuggestions, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final title in _titleSuggestions)
                        _chip(title, _highlightedTitle == title, () => _title.text = title),
                    ],
                  ),
                ],
                const SizedBox(height: 14),
                Text(LedgerStrings.category, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final name in _categories)
                      _chip(name, _category == name, () => setState(() => _category = name)),
                  ],
                ),
                const SizedBox(height: 14),
                Text(LedgerStrings.date, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                LedgerTapField(value: _date, onTap: _pickDate),
                const SizedBox(height: 14),
                Text(LedgerStrings.account, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                LedgerTapField(value: _accountLabel, onTap: _pickAccount),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => setState(() => _shared = !_shared),
                  child: Row(
                    children: [
                      Checkbox(
                        value: _shared,
                        activeColor: LedgerColors.pink,
                        checkColor: LedgerColors.ink,
                        side: const BorderSide(color: LedgerColors.line, width: 1.5),
                        onChanged: (value) => setState(() => _shared = value ?? false),
                      ),
                      Text(LedgerStrings.shared, style: LedgerTextStyles.body),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _saveReady ? _save : null),
                if (!widget.isNew) ...[
                  const SizedBox(height: 16),
                  TextButton(onPressed: _delete, child: Text(LedgerStrings.deleteEntry, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.down))),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return Material(
      color: selected ? LedgerColors.pink : LedgerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: selected ? LedgerColors.pink : LedgerColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(label, style: LedgerTextStyles.chipLabel.copyWith(fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}
