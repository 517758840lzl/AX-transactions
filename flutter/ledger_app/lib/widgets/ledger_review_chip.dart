import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-review-btn.is-open` / `.is-done`
class LedgerReviewChip extends StatelessWidget {
  const LedgerReviewChip({super.key, required this.checked, required this.onTap});

  final bool checked;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: checked ? LedgerColors.pink : LedgerColors.reviewOpenBg,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          constraints: const BoxConstraints(minWidth: 44, minHeight: 20),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          alignment: Alignment.center,
          child: Text(
            checked ? LedgerStrings.checked : LedgerStrings.unchecked,
            textAlign: TextAlign.center,
            style: (checked ? LedgerTextStyles.reviewChipDone : LedgerTextStyles.reviewChipOpen).copyWith(height: 1.0),
          ),
        ),
      ),
    );
  }
}
