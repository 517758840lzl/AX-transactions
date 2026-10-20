import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
import '../../widgets/ledger_panel_link.dart';
import '../../widgets/ledger_trend_line_painter.dart';

class DashboardSpendPacePanel extends StatelessWidget {
  const DashboardSpendPacePanel({
    super.key,
    required this.monthOut,
    required this.dailySpend,
    required this.onOpenTransactions,
  });

  final double monthOut;
  final List<double> dailySpend;
  final VoidCallback onOpenTransactions;

  @override
  Widget build(BuildContext context) {
    return LedgerPanel(
      title: LedgerStrings.spendPace,
      trailing: LedgerPanelLink(label: LedgerStrings.toTransactions, onPressed: onOpenTransactions),
      child: monthOut > 0
          ? RepaintBoundary(
              child: SizedBox(
                height: 120,
                width: double.infinity,
                child: CustomPaint(
                  isComplex: true,
                  willChange: false,
                  painter: LedgerTrendLinePainter(amounts: dailySpend, fitDataRange: false),
                ),
              ),
            )
          : const Text(LedgerStrings.spendChartEmpty, style: LedgerTextStyles.note),
    );
  }
}
