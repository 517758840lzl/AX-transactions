import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';

class LedgerPillButton extends StatelessWidget {
  const LedgerPillButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.secondary = false,
    this.compact = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool secondary;
  /// Web `.ledger-add-row .ledger-pill` — not full width.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: secondary ? LedgerColors.white : LedgerColors.pink,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: secondary ? const BorderSide(color: LedgerColors.line) : BorderSide.none,
      ),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          constraints: BoxConstraints(minHeight: compact ? 44 : 48),
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(horizontal: 18, vertical: compact ? 10 : 0),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: onPressed == null ? LedgerColors.faint : LedgerColors.ink,
            ),
          ),
        ),
      ),
    );
    if (compact) return button;
    return SizedBox(width: double.infinity, child: button);
  }
}
