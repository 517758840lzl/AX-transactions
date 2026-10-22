import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import 'me_models.dart';

class MeGenderIcon extends StatelessWidget {
  const MeGenderIcon({super.key, required this.gender});

  final String gender;

  @override
  Widget build(BuildContext context) {
    final String label;
    final IconData icon;
    if (gender == MeGender.female) {
      label = LedgerStrings.genderFemale;
      icon = Icons.female;
    } else if (gender == MeGender.male) {
      label = LedgerStrings.genderMale;
      icon = Icons.male;
    } else {
      label = LedgerStrings.genderSecret;
      icon = Icons.lock_outline;
    }
    return Semantics(
      label: label,
      child: Icon(
        icon,
        size: 18,
        color: LedgerColors.muted,
      ),
    );
  }
}
