import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-card`（设置、模板、分类等）
class LedgerCard extends StatelessWidget {
  const LedgerCard({super.key, this.title, this.trailing, required this.child});

  final String? title;
  final Widget? trailing;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LedgerColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: LedgerColors.line.withValues(alpha: 0.9)),
        boxShadow: [BoxShadow(color: LedgerColors.ink.withValues(alpha: 0.04), blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(child: Text(title!, style: LedgerTextStyles.cardTitle)),
                  ?trailing,
                ],
              ),
            ),
          child,
        ],
      ),
    );
  }
}
