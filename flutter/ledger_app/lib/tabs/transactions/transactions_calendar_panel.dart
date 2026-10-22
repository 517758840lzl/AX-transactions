import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_panel.dart';
class TransactionsCalendarPanel extends StatelessWidget {
  const TransactionsCalendarPanel({
    super.key,
    required this.spendByDay,
    required this.selectedDay,
    required this.onSelectDay,
  });

  final Map<String, double> spendByDay;
  final String? selectedDay;
  final ValueChanged<String> onSelectDay;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final year = now.year;
    final month = now.month;
    final first = DateTime(year, month, 1);
    final last = DateTime(year, month + 1, 0);
    final startPad = first.weekday % 7;
    final monthLabel = LedgerStrings.yearMonth(year, month);
    final maxSpend = spendByDay.values.fold(0.0, (a, b) => a > b ? a : b);
    final maxHeat = maxSpend > 0 ? maxSpend : 1;

    final cells = <DateTime?>[];
    for (var i = 0; i < startPad; i++) {
      cells.add(null);
    }
    for (var d = 1; d <= last.day; d++) {
      cells.add(DateTime(year, month, d));
    }

    String iso(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

    return LedgerPanel(
      title: '${LedgerStrings.txViewCalendar} · $monthLabel',
      child: Column(
        children: [
          Row(
            children: [
              for (final w in LedgerStrings.weekday)
                Expanded(child: Center(child: Text(w, style: LedgerTextStyles.calendarWeek))),
            ],
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 6, crossAxisSpacing: 6),
            itemCount: cells.length,
            itemBuilder: (context, index) {
              final cell = cells[index];
              if (cell == null) return const SizedBox.shrink();
              final dayIso = iso(cell);
              final spend = spendByDay[dayIso] ?? 0;
              final selected = selectedDay == dayIso;
              final heat = spend > 0 ? (spend / maxHeat).clamp(0.2, 1.0) : 0.0;
              return Material(
                color: selected ? LedgerColors.pink.withValues(alpha: 0.35) : LedgerColors.white,
                borderRadius: BorderRadius.circular(10),
                child: InkWell(
                  onTap: () => onSelectDay(dayIso),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: spend > 0 ? LedgerColors.pink.withValues(alpha: heat) : LedgerColors.line),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${cell.day}',
                      style: LedgerTextStyles.calendarDay.copyWith(fontWeight: selected ? FontWeight.w800 : FontWeight.w600),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
