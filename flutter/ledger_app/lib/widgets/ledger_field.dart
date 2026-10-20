import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';

InputDecoration ledgerFieldDecoration([String? hint]) => InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: LedgerColors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
