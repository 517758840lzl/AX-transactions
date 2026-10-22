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
      builder: (ctx) => const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(LedgerStrings.privacyTitle, style: LedgerTextStyles.detailTitle),
            SizedBox(height: 12),
            Text(LedgerStrings.privacy1, style: LedgerTextStyles.body),
            SizedBox(height: 8),
            Text(LedgerStrings.privacy2, style: LedgerTextStyles.body),
            SizedBox(height: 8),
            Text(LedgerStrings.privacy3, style: LedgerTextStyles.body),
          ],
        ),
      ),
    );
  }
}
