import 'package:flutter/material.dart';
import '../theme/ledger_text_styles.dart';

/// Web `.ledger-subhead`。标题行高锁死，避免真机苹方把字和下面的内容撑开。
class LedgerSubpageHead extends StatelessWidget {
  const LedgerSubpageHead({super.key, required this.title, required this.onBack});

  final String title;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: onBack,
          color: Theme.of(context).colorScheme.onSurface,
          style: IconButton.styleFrom(
            padding: EdgeInsets.zero,
            fixedSize: const Size(44, 44),
            minimumSize: const Size(44, 44),
            maximumSize: const Size(44, 44),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            iconSize: 26,
          ),
          icon: const Icon(Icons.arrow_back),
        ),
        Expanded(
          child: Text(
            title,
            style: LedgerTextStyles.pageTitle,
            strutStyle: const StrutStyle(fontSize: 26, height: 1.15, forceStrutHeight: true),
          ),
        ),
      ],
    );
  }
}
