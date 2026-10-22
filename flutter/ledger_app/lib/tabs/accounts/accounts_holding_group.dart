import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_account_row_card.dart';
import '../../widgets/money_amount.dart';
import '../dashboard/dashboard_slice_colors.dart';
import 'accounts_book_math.dart';
import 'accounts_labels.dart';
import 'accounts_models.dart';

class AccountsHoldingGroup extends StatelessWidget {
  const AccountsHoldingGroup({
    super.key,
    required this.title,
    required this.holdings,
    required this.mark,
    required this.toneOffset,
    required this.onOpen,
  });

  final String title;
  final List<LedgerHolding> holdings;
  final String mark;
  final int toneOffset;
  final ValueChanged<LedgerHolding> onOpen;

  @override
  Widget build(BuildContext context) {
    final total = AccountsBookMath.holdingsMarketTotal(holdings);
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: LedgerTextStyles.groupLabel),
              if (holdings.isNotEmpty) MoneyAmount(value: total, mark: mark, size: MoneySize.sm),
            ],
          ),
          for (var i = 0; i < holdings.length; i++)
            _HoldingRow(holding: holdings[i], mark: mark, toneIndex: i + toneOffset, onTap: () => onOpen(holdings[i])),
        ],
      ),
    );
  }
}

class _HoldingRow extends StatelessWidget {
  const _HoldingRow({required this.holding, required this.mark, required this.toneIndex, required this.onTap});

  final LedgerHolding holding;
  final String mark;
  final int toneIndex;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hex = DashboardSliceColors.at(toneIndex);
    final color = Color(0xFF000000 | int.parse(hex.substring(1), radix: 16));
    final value = AccountsBookMath.holdingMarketValue(holding);
    final pnl = AccountsBookMath.holdingUnrealizedPnl(holding);
    final fund = holding.kind == HoldingKind.fund;
    final qtyLabel = LedgerStrings.qtyWithUnit(
      fund ? holding.qty.toStringAsFixed(2) : holding.qty.toStringAsFixed(0),
      fund ? LedgerStrings.fundShare : LedgerStrings.stockShare,
    );

    return LedgerAccountRowCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
            child: Text(holding.name.substring(0, 1), style: LedgerTextStyles.txIconInitial),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(holding.name, style: LedgerTextStyles.accountTitle),
                Text('${holding.code} · ${AccountsLabels.holdingKind(holding.kind)} · $qtyLabel', style: LedgerTextStyles.accountMeta),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              MoneyAmount(value: value, mark: mark, size: MoneySize.md),
              MoneyAmount(value: pnl, mark: mark, size: MoneySize.sm, signed: true),
            ],
          ),
        ],
      ),
    );
  }
}
