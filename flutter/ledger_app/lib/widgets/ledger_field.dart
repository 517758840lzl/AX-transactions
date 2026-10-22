import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';

class LedgerTapField extends StatelessWidget {
  const LedgerTapField({super.key, required this.value, required this.onTap});

  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: LedgerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: LedgerColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(value, style: const TextStyle(fontSize: 16, color: LedgerColors.ink)),
          ),
        ),
      ),
    );
  }
}

InputDecoration ledgerFieldDecoration([String? hint]) => InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: LedgerColors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
