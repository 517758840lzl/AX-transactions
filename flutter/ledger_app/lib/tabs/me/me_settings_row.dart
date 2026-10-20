import 'package:flutter/material.dart';
import '../../theme/ledger_text_styles.dart';

class MeSettingsRow extends StatelessWidget {
  const MeSettingsRow({super.key, required this.title, required this.onTap, required this.trailing});

  final String title;
  final VoidCallback onTap;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Expanded(child: Text(title, style: LedgerTextStyles.settingsRowTitle)),
            DefaultTextStyle(style: LedgerTextStyles.settingsValue, child: trailing),
          ],
        ),
      ),
    );
  }
}
