import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import 'me_models.dart';

class MeGenderIcon extends StatelessWidget {
  const MeGenderIcon({super.key, required this.gender});

  final MeGender gender;

  @override
  Widget build(BuildContext context) {
    final label = switch (gender) {
      MeGender.female => LedgerStrings.genderFemale,
      MeGender.male => LedgerStrings.genderMale,
      MeGender.secret => LedgerStrings.genderSecret,
    };
    return Semantics(
      label: label,
      child: Icon(
        switch (gender) {
          MeGender.female => Icons.female,
          MeGender.male => Icons.male,
          MeGender.secret => Icons.lock_outline,
        },
        size: 18,
        color: LedgerColors.muted,
      ),
    );
  }
}
