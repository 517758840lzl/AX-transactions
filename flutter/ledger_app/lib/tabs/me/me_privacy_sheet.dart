import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';

abstract final class MePrivacySheet {
  static void show(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: LedgerColors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      clipBehavior: Clip.antiAlias,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(LedgerStrings.privacyTitle, style: LedgerTextStyles.detailTitle),
            const SizedBox(height: 12),
            Text(LedgerStrings.privacyLead, style: LedgerTextStyles.body),
            const SizedBox(height: 8),
            Text(LedgerStrings.privacyKeep, style: LedgerTextStyles.body),
            const SizedBox(height: 8),
            Text(LedgerStrings.privacyFamily, style: LedgerTextStyles.body),
            const SizedBox(height: 8),
            Text(LedgerStrings.storagePermission, style: LedgerTextStyles.body),
          ],
        ),
      ),
    );
  }
}
