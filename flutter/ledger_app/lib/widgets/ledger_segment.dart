import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// 对应 `.ledger-segment`（流水列表/日历、深色 hero 周期等）
class LedgerSegment extends StatelessWidget {
  const LedgerSegment({super.key, required this.labels, required this.index, required this.onChanged, this.onDark = false});

  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final bg = onDark ? LedgerColors.white.withValues(alpha: 0.1) : LedgerColors.wash;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Expanded(
              child: Material(
                color: i == index ? (onDark ? LedgerColors.white : LedgerColors.white) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                elevation: i == index && !onDark ? 0 : 0,
                child: InkWell(
                  onTap: () => onChanged(i),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 36),
                    alignment: Alignment.center,
                    decoration: i == index && !onDark
                        ? BoxDecoration(
                            color: LedgerColors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: LedgerColors.ink.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
                          )
                        : null,
                    child: Text(
                      labels[i],
                      style: LedgerTextStyles.noteSemibold.copyWith(
                        color: i == index ? LedgerColors.ink : (onDark ? LedgerColors.onDarkMuted : LedgerColors.muted),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
