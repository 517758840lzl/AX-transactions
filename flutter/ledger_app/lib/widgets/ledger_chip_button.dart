import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

class LedgerChipButton extends StatelessWidget {
  const LedgerChipButton({super.key, required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: LedgerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: const BorderSide(color: LedgerColors.line),
      ),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
          child: Text(label, style: LedgerTextStyles.chipLabel),
        ),
      ),
    );
  }
}
