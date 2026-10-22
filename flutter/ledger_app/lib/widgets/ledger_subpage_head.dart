import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-subhead`。标题行高锁死，避免真机苹方把字和下面的内容撑开。
class LedgerSubpageHead extends StatelessWidget {
  const LedgerSubpageHead({super.key, required this.title, required this.onBack});

  final String title;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 22,
          height: 44,
          child: OverflowBox(
            minWidth: 44,
            maxWidth: 44,
            minHeight: 44,
            maxHeight: 44,
            alignment: Alignment.centerLeft,
            child: IconButton(
              onPressed: onBack,
              padding: EdgeInsets.zero,
              alignment: Alignment.centerLeft,
              style: IconButton.styleFrom(
                padding: EdgeInsets.zero,
                alignment: Alignment.centerLeft,
                fixedSize: const Size(44, 44),
                minimumSize: const Size(44, 44),
                maximumSize: const Size(44, 44),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              icon: const CustomPaint(
                size: Size(22, 22),
                painter: _BackArrowPainter(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            title,
            style: LedgerTextStyles.pageTitle,
            strutStyle: const StrutStyle(fontSize: 26, height: 1.15, forceStrutHeight: true),
          ),
        ),
      ],
    );
  }
}

/// 箭头尖端贴在按钮左缘，和下面的内容左对齐。
class _BackArrowPainter extends CustomPainter {
  const _BackArrowPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.shortestSide / 14;
    canvas.save();
    canvas.scale(scale);
    final path = Path()
      ..moveTo(14, 7)
      ..lineTo(0, 7)
      ..moveTo(7, 14)
      ..lineTo(0, 7)
      ..lineTo(7, 0);
    canvas.drawPath(
      path,
      Paint()
        ..color = LedgerColors.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.9 / scale
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
