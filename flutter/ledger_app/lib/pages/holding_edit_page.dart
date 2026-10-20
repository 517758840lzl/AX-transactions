import 'package:flutter/material.dart';
import '../data/ledger_view_filter.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_labels.dart';
import '../tabs/accounts/accounts_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_choice_row.dart';
import '../widgets/ledger_field.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class HoldingEditResult {
  const HoldingEditResult.saved(this.holding) : deleted = false;
  const HoldingEditResult.deleted() : holding = null, deleted = true;

  final LedgerHolding? holding;
  final bool deleted;
}

class HoldingEditPage extends StatefulWidget {
  const HoldingEditPage({super.key, this.holding, this.existing = const []});

  final LedgerHolding? holding;
  final List<LedgerHolding> existing;

  static Future<HoldingEditResult?> open(
    BuildContext context, {
    LedgerHolding? holding,
    List<LedgerHolding> existing = const [],
  }) {
    return Navigator.of(context).push<HoldingEditResult>(
      MaterialPageRoute(builder: (_) => HoldingEditPage(holding: holding, existing: existing)),
    );
  }

  @override
  State<HoldingEditPage> createState() => _HoldingEditPageState();
}

class _HoldingEditPageState extends State<HoldingEditPage> {
  static const _kinds = [HoldingKind.stock, HoldingKind.etf, HoldingKind.fund];

  late final TextEditingController _code;
  late final TextEditingController _name;
  late final TextEditingController _qty;
  late final TextEditingController _cost;
  late final TextEditingController _price;
  late int _kindIndex;
  late String _priceDate;

  @override
  void initState() {
    super.initState();
    final holding = widget.holding;
    _code = TextEditingController(text: holding?.code ?? '');
    _name = TextEditingController(text: holding?.name ?? '');
    _qty = TextEditingController(text: holding == null ? '' : _trim(holding.qty));
    _cost = TextEditingController(text: holding == null ? '' : _trim(_unitCost(holding)));
    _price = TextEditingController(text: holding == null ? '' : _trim(holding.price));
    _kindIndex = holding == null ? 0 : _kinds.indexOf(holding.kind).clamp(0, _kinds.length - 1);
    _priceDate = holding?.priceAsOf ?? LedgerViewFilter.todayIso();
  }

  @override
  void dispose() {
    _code.dispose();
    _name.dispose();
    _qty.dispose();
    _cost.dispose();
    _price.dispose();
    super.dispose();
  }

  String get _codeHint => switch (_kindIndex) {
        1 => LedgerStrings.holdingCodeEtf,
        2 => LedgerStrings.holdingCodeFund,
        _ => LedgerStrings.holdingCodeStock,
      };

  String get _nameHint => switch (_kindIndex) {
        1 => LedgerStrings.holdingNameEtf,
        2 => LedgerStrings.holdingNameFund,
        _ => LedgerStrings.holdingNameStock,
      };

  bool get _canSave {
    if (_code.text.trim().isEmpty || _name.text.trim().isEmpty) return false;
    final qty = double.tryParse(_qty.text.trim());
    final cost = double.tryParse(_cost.text.trim());
    final price = double.tryParse(_price.text.trim());
    return qty != null && qty > 0 && cost != null && cost >= 0 && price != null && price > 0;
  }

  bool _isDuplicate(HoldingKind kind, String code) {
    final key = code.trim().toUpperCase();
    return widget.existing.any(
      (item) => item.id != widget.holding?.id && item.kind == kind && item.code.trim().toUpperCase() == key,
    );
  }

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_priceDate) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked == null) return;
    setState(() => _priceDate = LedgerViewFilter.todayIso(picked));
  }

  void _save() {
    if (!_canSave) return;
    final kind = _kinds[_kindIndex];
    final code = _code.text.trim();
    if (_isDuplicate(kind, code)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text(LedgerStrings.holdingDuplicate)));
      return;
    }
    final qty = double.parse(_qty.text.trim());
    final cost = double.parse(_cost.text.trim());
    final price = double.parse(_price.text.trim());
    Navigator.pop(
      context,
      HoldingEditResult.saved(
        LedgerHolding(
          id: widget.holding?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
          kind: kind,
          code: code,
          name: _name.text.trim(),
          qty: qty,
          costTotal: ((qty * cost) * 100).roundToDouble() / 100,
          price: (price * 100).roundToDouble() / 100,
          priceAsOf: _priceDate,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.holding != null;
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(
                  title: editing ? LedgerStrings.editHolding : LedgerStrings.newHolding,
                  onBack: () => Navigator.pop(context),
                ),
                Text(LedgerStrings.holdingKindLabel, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                LedgerChoiceRow(
                  labels: [for (final kind in _kinds) AccountsLabels.holdingKind(kind)],
                  index: _kindIndex,
                  onChanged: (index) => setState(() => _kindIndex = index),
                ),
                const SizedBox(height: 16),
                _field(LedgerStrings.holdingCode, _code, _codeHint),
                _field(LedgerStrings.holdingName, _name, _nameHint),
                _field(LedgerStrings.holdingQty, _qty, '0', decimal: true),
                _field(LedgerStrings.holdingCostPrice, _cost, LedgerStrings.holdingCostPricePh, decimal: true),
                _field(LedgerStrings.holdingPrice, _price, '0.00', decimal: true),
                Text(LedgerStrings.holdingPriceAsOf, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                OutlinedButton(onPressed: _pickDate, child: Text(_priceDate, style: LedgerTextStyles.note)),
                const SizedBox(height: 20),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _canSave ? _save : null),
                if (editing) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.pop(context, const HoldingEditResult.deleted()),
                    child: Text(LedgerStrings.deleteHolding, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.budgetOver, fontWeight: FontWeight.w700)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController controller, String hint, {bool decimal = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            keyboardType: decimal ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
            onChanged: (_) => setState(() {}),
            decoration: ledgerFieldDecoration(hint),
          ),
        ],
      ),
    );
  }

  static double _unitCost(LedgerHolding holding) {
    if (holding.qty <= 0) return 0;
    return ((holding.costTotal / holding.qty) * 100).roundToDouble() / 100;
  }

  static String _trim(double value) {
    final text = value.toStringAsFixed(3);
    return text.replaceFirst(RegExp(r'0+$'), '').replaceFirst(RegExp(r'\.$'), '');
  }
}
