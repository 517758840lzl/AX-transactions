import 'package:flutter/material.dart';

import '../theme/ledger_colors.dart';

enum MoneySize { hero, md, sm, pieCenter }

class MoneyAmount extends StatelessWidget {
  const MoneyAmount({
    super.key,
    required this.value,
    required this.mark,
    this.size = MoneySize.md,
    this.signed = false,
    this.lightOnDark = false,
  });

  final double value;
  final String mark;
  final MoneySize size;
  final bool signed;
  final bool lightOnDark;

  @override
  Widget build(BuildContext context) {
    final negative = value < 0;
    final body = _formatBody(value.abs());
    final color = lightOnDark ? LedgerColors.white : LedgerColors.ink;
    final style = switch (size) {
      MoneySize.hero => TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.w700,
        height: 1.08,
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
      MoneySize.md => TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
      MoneySize.sm => TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
      MoneySize.pieCenter => TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    };
    final sign = signed && value > 0 ? '+' : (negative ? '−' : '');
    return Text.rich(
      TextSpan(
        style: style,
        children: [
          if (sign.isNotEmpty)
            TextSpan(
              text: sign,
              style: style.copyWith(fontWeight: FontWeight.w600),
            ),
          TextSpan(
            text: mark,
            style: style.copyWith(fontWeight: FontWeight.w600),
          ),
          TextSpan(text: body),
        ],
      ),
    );
  }

  static final _thousands = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');

  static String _formatBody(double v) {
    final s = v.toStringAsFixed(2);
    final parts = s.split('.');
    final intPart = parts[0].replaceAllMapped(_thousands, (m) => '${m[1]},');
    return '$intPart.${parts[1]}';
  }
}
