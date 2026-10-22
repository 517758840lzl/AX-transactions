import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../data/ledger_view_filter.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

class LedgerChoice {
  const LedgerChoice(this.id, this.label);

  final String id;
  final String label;
}

const _columnWidth = 390.0;
const _sideGap = 24.0;

/// 左右留出间距，宽度跟着屏幕走，并停在页面内容列里。
EdgeInsets ledgerPopupInset(BuildContext context) {
  final screen = MediaQuery.sizeOf(context).width;
  final extra = math.max(0.0, screen - _columnWidth) / 2;
  return EdgeInsets.fromLTRB(_sideGap + extra, 24, _sideGap + extra, 24);
}

const _popupConstraints = BoxConstraints(minWidth: 0, maxWidth: double.infinity);

/// 选项弹层。宽度是屏幕减去两边间距。
Future<String?> showLedgerChoices(
  BuildContext context, {
  required String selected,
  required List<LedgerChoice> options,
}) {
  return showDialog<String>(
    context: context,
    builder: (ctx) => Dialog(
      constraints: _popupConstraints,
      insetPadding: ledgerPopupInset(ctx),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final option in options)
              InkWell(
                onTap: () => Navigator.pop(ctx, option.id),
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: option.id == selected ? LedgerColors.wash : LedgerColors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    option.label,
                    style: LedgerTextStyles.body.copyWith(fontWeight: option.id == selected ? FontWeight.w700 : FontWeight.w400),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

/// 日历。不能选今天之后的日期。
Future<String?> showLedgerDate(BuildContext context, {required String value}) {
  return showDialog<String>(
    context: context,
    builder: (ctx) => _DatePopup(initial: value, max: LedgerViewFilter.todayIso()),
  );
}

class _DatePopup extends StatefulWidget {
  const _DatePopup({required this.initial, required this.max});

  final String initial;
  final String max;

  @override
  State<_DatePopup> createState() => _DatePopupState();
}

class _DatePopupState extends State<_DatePopup> {
  late DateTime _cursor;

  @override
  void initState() {
    super.initState();
    final parsed = DateTime.tryParse(widget.initial) ?? DateTime.now();
    _cursor = DateTime(parsed.year, parsed.month);
  }

  @override
  Widget build(BuildContext context) {
    final year = _cursor.year;
    final month = _cursor.month;
    final first = DateTime(year, month, 1);
    final days = DateTime(year, month + 1, 0).day;
    final pad = first.weekday % 7;
    const marks = LedgerStrings.calendarWeek;

    return Dialog(
      constraints: _popupConstraints,
      insetPadding: ledgerPopupInset(context),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                _nav(() => setState(() => _cursor = DateTime(year, month - 1))),
                Expanded(
                  child: Text(LedgerStrings.yearMonth(year, month), textAlign: TextAlign.center, style: LedgerTextStyles.cardTitle),
                ),
                _nav(() => setState(() => _cursor = DateTime(year, month + 1)), next: true),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                for (final mark in marks)
                  Expanded(child: Text(mark, textAlign: TextAlign.center, style: LedgerTextStyles.txMeta)),
              ],
            ),
            const SizedBox(height: 4),
            GridView.count(
              crossAxisCount: 7,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 2,
              crossAxisSpacing: 2,
              childAspectRatio: 1,
              children: [
                for (var i = 0; i < pad; i++) const SizedBox.shrink(),
                for (var day = 1; day <= days; day++) _day(year, month, day),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                style: TextButton.styleFrom(
                  backgroundColor: LedgerColors.neutral,
                  foregroundColor: LedgerColors.ink,
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(context, widget.max),
                child: const Text(LedgerStrings.today, style: LedgerTextStyles.cardTitle),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _nav(VoidCallback onTap, {bool next = false}) {
    return Material(
      color: LedgerColors.neutral,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(next ? Icons.chevron_right : Icons.chevron_left, color: LedgerColors.ink),
        ),
      ),
    );
  }

  Widget _day(int year, int month, int day) {
    final iso = LedgerViewFilter.todayIso(DateTime(year, month, day));
    final disabled = iso.compareTo(widget.max) > 0;
    final selected = iso == widget.initial;
    return Material(
      color: selected ? LedgerColors.ink : LedgerColors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: disabled ? null : () => Navigator.pop(context, iso),
        borderRadius: BorderRadius.circular(12),
        child: Center(
          child: Text(
            '$day',
            style: LedgerTextStyles.body.copyWith(
              color: selected ? LedgerColors.white : disabled ? LedgerColors.faint : LedgerColors.ink,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
