import 'package:flutter/material.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';

class TransactionsFilterChip extends StatelessWidget {
  const TransactionsFilterChip({super.key, required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? LedgerColors.ink : LedgerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: selected ? LedgerColors.ink : LedgerColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(
            label,
            style: LedgerTextStyles.noteSemibold.copyWith(color: selected ? LedgerColors.white : LedgerColors.muted),
          ),
        ),
      ),
    );
  }
}
