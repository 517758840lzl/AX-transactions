import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-panel-head button` / `.ledger-head-action`
class LedgerPanelLink extends StatelessWidget {
  const LedgerPanelLink({super.key, required this.label, required this.onPressed, this.large = false});

  final String label;
  final VoidCallback? onPressed;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: LedgerColors.ink,
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        textStyle: large ? LedgerTextStyles.headAction : LedgerTextStyles.panelAction,
      ),
      child: Text(label),
    );
  }
}
