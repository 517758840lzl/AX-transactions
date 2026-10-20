import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_segment.dart';
import '../../widgets/money_amount.dart';
import 'accounts_tab_state.dart';
import '../../widgets/ledger_trend_line_painter.dart';

class AccountsTrendHero extends StatelessWidget {
  const AccountsTrendHero({
    super.key,
    required this.state,
    required this.mark,
    required this.onWindowChanged,
  });

  final AccountsTabState state;
  final String mark;
  final ValueChanged<int> onWindowChanged;

  @override
  Widget build(BuildContext context) {
    final delta = state.windowDelta;
    final prior = state.windowPrior;
    final deltaUp = delta >= 0;
    final amounts = state.trendAmounts;

    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
      decoration: BoxDecoration(
        color: LedgerColors.blackSurface,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [BoxShadow(color: LedgerColors.blackSurface.withValues(alpha: 0.22), blurRadius: 40, offset: const Offset(0, 18))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(LedgerStrings.netAssets, style: LedgerTextStyles.heroLabel),
          MoneyAmount(value: state.netWorth, mark: mark, size: MoneySize.hero, lightOnDark: true),
          if (state.holdingsTotal > 0) ...[
            const SizedBox(height: 10),
            Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 4,
              children: [
                Text(LedgerStrings.accountBalance, style: LedgerTextStyles.heroFoot),
                MoneyAmount(value: state.cashBalance, mark: mark, size: MoneySize.sm, lightOnDark: true),
                Text(' · ', style: TextStyle(color: LedgerColors.onDarkSoft.withValues(alpha: 0.88))),
                Text(LedgerStrings.holdingMarketValue, style: LedgerTextStyles.heroFoot),
                MoneyAmount(value: state.holdingsTotal, mark: mark, size: MoneySize.sm, lightOnDark: true),
              ],
            ),
          ],
          const SizedBox(height: 14),
          LedgerSegment(
            onDark: true,
            labels: const [LedgerStrings.accountsWindow7, LedgerStrings.accountsWindow30],
            index: state.windowIndex,
            onChanged: onWindowChanged,
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              // 与 Web `viewBox="0 0 320 120"` 同宽高比，随卡片宽度缩放
              final h = (constraints.maxWidth * 120 / 320).clamp(64.0, 120.0);
              return RepaintBoundary(
                child: SizedBox(
                  height: h,
                  width: double.infinity,
                  child: CustomPaint(
                    isComplex: true,
                    willChange: false,
                    painter: LedgerTrendLinePainter(amounts: amounts, fitDataRange: true),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 8),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 6,
            children: [
              const Text(LedgerStrings.accountPeriodDelta, style: LedgerTextStyles.heroLabel),
              MoneyAmount(value: delta, mark: mark, size: MoneySize.sm, signed: true, lightOnDark: true),
              Text(_formatPct(delta, prior), style: deltaUp ? LedgerTextStyles.heroDeltaUp : LedgerTextStyles.heroDeltaDown),
            ],
          ),
        ],
      ),
    );
  }

  static String _formatPct(double delta, double base) {
    if (base == 0) return delta == 0 ? '0%' : '—';
    final pct = (delta / base.abs()) * 100;
    final sign = pct > 0 ? '+' : '';
    return '$sign${pct.toStringAsFixed(1)}%';
  }
}
