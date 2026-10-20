import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/money_amount.dart';
import 'transactions_tab_state.dart';

class TransactionsSpendDonut extends StatelessWidget {
  const TransactionsSpendDonut({
    super.key,
    required this.parts,
    required this.total,
    required this.mark,
    required this.activeCategory,
    required this.onPick,
  });

  final List<TransactionsSpendPart> parts;
  final double total;
  final String mark;
  final String? activeCategory;
  final ValueChanged<String> onPick;

  Color _color(String hex) {
    final v = int.parse(hex.substring(1), radix: 16);
    return Color(0xFF000000 | v);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 130,
      height: 130,
      child: CustomPaint(
        painter: _DonutPainter(
          parts: parts,
          total: total,
          activeCategory: activeCategory,
          colorOf: _color,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                LedgerStrings.periodSpend,
                style: LedgerTextStyles.donutCaption,
              ),
              MoneyAmount(value: total, mark: mark, size: MoneySize.pieCenter),
            ],
          ),
        ),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  _DonutPainter({
    required this.parts,
    required this.total,
    required this.activeCategory,
    required this.colorOf,
  });

  final List<TransactionsSpendPart> parts;
  final double total;
  final String? activeCategory;
  final Color Function(String hex) colorOf;

  @override
  void paint(Canvas canvas, Size size) {
    if (total <= 0 || parts.isEmpty) {
      final paint = Paint()
        ..color = LedgerColors.line
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14;
      canvas.drawCircle(Offset(size.width / 2, size.height / 2), 50, paint);
      return;
    }
    final center = Offset(size.width / 2, size.height / 2);
    const radius = 50.0;
    const gapRad = 3 / radius;
    var start = -math.pi / 2;
    for (var i = 0; i < parts.length; i++) {
      final part = parts[i];
      var sweep = (part.amount / total) * 2 * math.pi;
      if (parts.length > 1) {
        sweep = math.max(sweep - gapRad, 0.02);
      }
      final paint = Paint()
        ..color = colorOf(part.colorHex)
        ..style = PaintingStyle.stroke
        ..strokeWidth = activeCategory == part.name ? 22 : 16
        ..strokeCap = StrokeCap.butt;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
      start += (part.amount / total) * 2 * math.pi;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) {
    if (oldDelegate.total != total ||
        oldDelegate.activeCategory != activeCategory ||
        oldDelegate.parts.length != parts.length) {
      return true;
    }
    for (var i = 0; i < parts.length; i++) {
      final next = parts[i];
      final previous = oldDelegate.parts[i];
      if (next.name != previous.name || next.amount != previous.amount || next.colorHex != previous.colorHex) {
        return true;
      }
    }
    return false;
  }
}
