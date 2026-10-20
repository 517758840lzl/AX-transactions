import 'package:flutter/material.dart';
import '../data/budget_hints.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class BudgetSaveResult {
  const BudgetSaveResult({this.monthlyBudget, this.categoryBudgets = const {}, this.cleared = false});

  final double? monthlyBudget;
  final Map<String, double> categoryBudgets;
  final bool cleared;
}

/// Web `panel === 'budget'`
class BudgetPage extends StatefulWidget {
  const BudgetPage({
    super.key,
    required this.categories,
    this.monthlyBudget,
    this.categoryBudgets = const {},
  });

  final List<String> categories;
  final double? monthlyBudget;
  final Map<String, double> categoryBudgets;

  static Future<BudgetSaveResult?> open(
    BuildContext context, {
    required List<String> categories,
    double? monthlyBudget,
    Map<String, double> categoryBudgets = const {},
  }) {
    return Navigator.of(context).push<BudgetSaveResult>(
      MaterialPageRoute(
        builder: (_) => BudgetPage(
          categories: categories,
          monthlyBudget: monthlyBudget,
          categoryBudgets: categoryBudgets,
        ),
      ),
    );
  }

  @override
  State<BudgetPage> createState() => _BudgetPageState();
}

class _BudgetPageState extends State<BudgetPage> {
  late final TextEditingController _monthly;
  late final Map<String, TextEditingController> _categoryCtrls;

  @override
  void initState() {
    super.initState();
    _monthly = TextEditingController(
      text: widget.monthlyBudget != null && widget.monthlyBudget! > 0 ? widget.monthlyBudget!.toStringAsFixed(2) : '',
    );
    _categoryCtrls = {
      for (final name in widget.categories)
        name: TextEditingController(
          text: widget.categoryBudgets[name] != null && widget.categoryBudgets[name]! > 0
              ? widget.categoryBudgets[name]!.toStringAsFixed(2)
              : '',
        ),
    };
  }

  @override
  void dispose() {
    _monthly.dispose();
    for (final c in _categoryCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  InputDecoration _fieldDecoration(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: LedgerColors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      );

  void _save() {
    final monthlyRaw = _monthly.text.trim();
    final monthlyVal = double.tryParse(monthlyRaw);
    final monthly = monthlyVal != null && monthlyVal > 0 ? (monthlyVal * 100).roundToDouble() / 100 : null;

    final caps = <String, double>{};
    for (final name in widget.categories) {
      final raw = _categoryCtrls[name]!.text.trim();
      if (raw.isEmpty) continue;
      final v = double.tryParse(raw);
      if (v != null && v > 0) caps[name] = (v * 100).roundToDouble() / 100;
    }

    Navigator.pop(context, BudgetSaveResult(monthlyBudget: monthly, categoryBudgets: caps));
  }

  void _clearAll() {
    Navigator.pop(context, const BudgetSaveResult(cleared: true));
  }

  @override
  Widget build(BuildContext context) {
    final hasBudget = widget.monthlyBudget != null && widget.monthlyBudget! > 0;
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(title: LedgerStrings.monthlyBudget, onBack: () => Navigator.pop(context)),
                Text(LedgerStrings.budgetHint, style: LedgerTextStyles.note),
                const SizedBox(height: 16),
                Text(LedgerStrings.monthlyBudget, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _monthly,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _fieldDecoration(BudgetHints.monthlyPlaceholder()),
                ),
                const SizedBox(height: 20),
                Text(LedgerStrings.categoryBudget, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(LedgerStrings.categoryBudgetHint, style: LedgerTextStyles.note),
                const SizedBox(height: 12),
                for (final name in widget.categories) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(width: 56, child: Text(name, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink))),
                        Expanded(
                          child: TextField(
                            controller: _categoryCtrls[name],
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: _fieldDecoration(BudgetHints.categoryPlaceholder(name)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _save),
                if (hasBudget) ...[
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: _clearAll,
                    child: Text(LedgerStrings.budgetClear, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.budgetOver, fontWeight: FontWeight.w700)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
