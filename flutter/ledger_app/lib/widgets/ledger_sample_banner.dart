import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-banner`。浏览器默认行高把整条撑到约 44，真机按这个高度。
class LedgerSampleBanner extends StatelessWidget {
  const LedgerSampleBanner({super.key, required this.onClear});

  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 14),
      constraints: const BoxConstraints(minHeight: 44),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: LedgerColors.wash, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Expanded(
            child: Text(LedgerStrings.sampleBanner, style: LedgerTextStyles.sampleBanner),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: onClear,
            behavior: HitTestBehavior.opaque,
            child: Text(LedgerStrings.sampleClear, style: LedgerTextStyles.sampleBannerAction),
          ),
        ],
      ),
    );
  }
}
