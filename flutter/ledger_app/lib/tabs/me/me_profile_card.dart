import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_card.dart';
import 'me_gender_icon.dart';

class MeProfileCard extends StatelessWidget {
  const MeProfileCard({
    super.key,
    required this.displayName,
    required this.avatarInitial,
    required this.streakMeta,
    required this.hasNickname,
    required this.gender,
    required this.onTap,
  });

  final String displayName;
  final String avatarInitial;
  final String streakMeta;
  final bool hasNickname;
  final String gender;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LedgerCard(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: LedgerColors.pink,
                child: Text(avatarInitial, style: LedgerTextStyles.avatarInitial),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(child: Text(displayName, style: LedgerTextStyles.profileName)),
                        if (hasNickname) ...[const SizedBox(width: 6), MeGenderIcon(gender: gender)],
                      ],
                    ),
                    if (!hasNickname) const Text(LedgerStrings.profileHint, style: LedgerTextStyles.note),
                    Text(streakMeta, style: LedgerTextStyles.streakMeta),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
