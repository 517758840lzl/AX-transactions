import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';

/// Web `.ledger-account-row`: white fill, border, rounded corners, and a light shadow.
class LedgerAccountRowCard extends StatelessWidget {
  const LedgerAccountRowCard({super.key, required this.onTap, required this.child});

  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: LedgerColors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: LedgerColors.line),
          boxShadow: [BoxShadow(color: LedgerColors.ink.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 8))],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
