import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_book_math.dart';
import '../tabs/accounts/accounts_labels.dart';
import '../tabs/accounts/accounts_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_card.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';
import '../widgets/money_amount.dart';
import 'holding_edit_page.dart';

class HoldingDetailResult {
  const HoldingDetailResult({required this.id, this.holding});

  final String id;
  final LedgerHolding? holding;

  bool get deleted => holding == null;
}

class HoldingDetailPage extends StatefulWidget {
  const HoldingDetailPage({super.key, required this.holding, required this.existing, required this.mark});

  final LedgerHolding holding;
  final List<LedgerHolding> existing;
  final String mark;

  static Future<HoldingDetailResult?> open(
    BuildContext context, {
    required LedgerHolding holding,
    required List<LedgerHolding> existing,
    required String mark,
  }) {
    return Navigator.of(context).push<HoldingDetailResult>(
      MaterialPageRoute(builder: (_) => HoldingDetailPage(holding: holding, existing: existing, mark: mark)),
    );
  }

  @override
  State<HoldingDetailPage> createState() => _HoldingDetailPageState();
}

class _HoldingDetailPageState extends State<HoldingDetailPage> {
  late LedgerHolding _holding;

  @override
  void initState() {
    super.initState();
    _holding = widget.holding;
  }

  Future<void> _edit() async {
    final result = await HoldingEditPage.open(context, holding: _holding, existing: widget.existing);
    if (!mounted || result == null) return;
    if (result.deleted) {
      Navigator.pop(context, HoldingDetailResult(id: _holding.id));
      return;
    }
    setState(() => _holding = result.holding!);
  }

  @override
  Widget build(BuildContext context) {
    final value = AccountsBookMath.holdingMarketValue(_holding);
    final pnl = AccountsBookMath.holdingUnrealizedPnl(_holding);
    final unitCost = _holding.qty <= 0 ? 0.0 : ((_holding.costTotal / _holding.qty) * 100).roundToDouble() / 100;
    final qtyLabel = _holding.kind == HoldingKind.fund ? '${_holding.qty.toStringAsFixed(2)} 份' : '${_trim(_holding.qty)} 股';

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
                  title: _holding.name,
                  onBack: () => Navigator.pop(context, HoldingDetailResult(id: _holding.id, holding: _holding)),
                ),
                LedgerCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${_holding.code} · ${AccountsLabels.holdingKind(_holding.kind)}', style: LedgerTextStyles.note),
                      MoneyAmount(value: value, mark: widget.mark, size: MoneySize.hero),
                      const SizedBox(height: 8),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 6,
                        children: [
                          Text(LedgerStrings.holdingPnl, style: LedgerTextStyles.note),
                          MoneyAmount(value: pnl, mark: widget.mark, size: MoneySize.sm, signed: true),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _fact(LedgerStrings.holdingQty, qtyLabel),
                      _factMoney(LedgerStrings.holdingCostPrice, unitCost),
                      _factMoney(LedgerStrings.holdingCostTotal, _holding.costTotal),
                      _factMoney(LedgerStrings.holdingPrice, _holding.price, suffix: _holding.priceAsOf),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                LedgerPillButton(label: LedgerStrings.editHolding, onPressed: _edit),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _fact(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: LedgerTextStyles.note)),
          Text(value, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink)),
        ],
      ),
    );
  }

  Widget _factMoney(String label, double value, {String? suffix}) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: LedgerTextStyles.note)),
          MoneyAmount(value: value, mark: widget.mark, size: MoneySize.sm),
          if (suffix != null) ...[
            const SizedBox(width: 6),
            Text(suffix, style: LedgerTextStyles.note),
          ],
        ],
      ),
    );
  }

  static String _trim(double value) {
    final text = value.toStringAsFixed(3);
    return text.replaceFirst(RegExp(r'0+$'), '').replaceFirst(RegExp(r'\.$'), '');
  }
}
