import 'package:flutter/material.dart';
import '../../theme/ledger_colors.dart';

class MeSettingsDivider extends StatelessWidget {
  const MeSettingsDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, thickness: 1, color: LedgerColors.line);
  }
}
