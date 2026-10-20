import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';

/// Web `SpendLine` 描边样式；支出曲线用 [fitDataRange:false]（0→max），净资产走势用 true（min→max）。
class LedgerTrendLinePainter extends CustomPainter {
  LedgerTrendLinePainter({required this.amounts, this.fitDataRange = false});

  final List<double> amounts;
  final bool fitDataRange;

  static const _padX = 10.0;
  static const _padY = 10.0;

  static final _linePaint = Paint()
    ..color = LedgerColors.chartLine
    ..strokeWidth = 2.5
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  static final _dotFill = Paint()..color = LedgerColors.pink;

  static final _dotStroke = Paint()
    ..color = LedgerColors.ink
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.2;

  double _y(double value, Size size, double minV, double maxV) {
    final plotH = size.height - _padY * 2;
    if (fitDataRange) {
      if ((maxV - minV).abs() < 1e-9) return _padY + plotH / 2;
      final t = (value - minV) / (maxV - minV);
      return _padY + (1 - t) * plotH;
    }
    final max = math.max(maxV, 1.0);
    return size.height - _padY - (value / max) * plotH;
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (amounts.isEmpty) return;

    final minV = amounts.reduce(math.min);
    final maxV = amounts.reduce(math.max);
    final step = amounts.length <= 1 ? 0.0 : (size.width - _padX * 2) / (amounts.length - 1);

    final path = Path();
    for (var i = 0; i < amounts.length; i++) {
      final x = _padX + i * step;
      final y = _y(amounts[i], size, minV, maxV);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, _linePaint);

    for (final i in _markerIndexes(amounts.length, step)) {
      final x = _padX + i * step;
      final y = _y(amounts[i], size, minV, maxV);
      final r = amounts[i] > 0 ? 3.5 : 2.0;
      canvas.drawCircle(Offset(x, y), r, _dotFill);
      canvas.drawCircle(Offset(x, y), r, _dotStroke);
    }
  }

  /// 圆心至少隔开约 12px。7 天、1 月仍逐日画点；3 月隔天取样。
  static List<int> _markerIndexes(int count, double step) {
    if (count <= 2) return [for (var i = 0; i < count; i++) i];
    final stride = step >= 12 || step <= 0 ? 1 : (12 / step).ceil();
    if (stride <= 1) return [for (var i = 0; i < count; i++) i];
    final picked = <int>[];
    for (var index = 0; index < count; index += stride) {
      picked.add(index);
    }
    final last = count - 1;
    final previous = picked.last;
    if (previous != last) {
      if (last - previous < stride) {
        picked[picked.length - 1] = last;
      } else {
        picked.add(last);
      }
    }
    return picked;
  }

  @override
  bool shouldRepaint(covariant LedgerTrendLinePainter oldDelegate) =>
      oldDelegate.fitDataRange != fitDataRange || !listEquals(oldDelegate.amounts, amounts);
}
