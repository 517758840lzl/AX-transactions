import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';

class LedgerFab extends StatelessWidget {
  const LedgerFab({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 22,
      bottom: 16,
      child: Material(
        color: LedgerColors.pink,
        shape: const CircleBorder(),
        elevation: 0,
        shadowColor: LedgerColors.pink.withValues(alpha: 0.65),
        child: Tooltip(
          message: LedgerStrings.entryNew,
          child: InkWell(
            onTap: onPressed,
            customBorder: const CircleBorder(),
            child: const SizedBox(
              width: 56,
              height: 56,
              child: Center(child: Text('+', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w400, color: LedgerColors.ink, height: 1))),
            ),
          ),
        ),
      ),
    );
  }
}
