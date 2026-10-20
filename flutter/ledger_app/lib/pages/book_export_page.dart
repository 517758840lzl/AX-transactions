import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class BookExportPage extends StatefulWidget {
  const BookExportPage({super.key, required this.document});

  final String document;

  static Future<void> open(BuildContext context, {required String document}) {
    return Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => BookExportPage(document: document)),
    );
  }

  @override
  State<BookExportPage> createState() => _BookExportPageState();
}

class _BookExportPageState extends State<BookExportPage> {
  var _copied = false;

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.document));
    if (!mounted) return;
    setState(() => _copied = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(title: LedgerStrings.exportData, onBack: () => Navigator.pop(context)),
                const SizedBox(height: 12),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: LedgerColors.neutral,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: SelectableText(widget.document, style: LedgerTextStyles.note.copyWith(color: LedgerColors.ink)),
                  ),
                ),
                const SizedBox(height: 16),
                LedgerPillButton(label: LedgerStrings.exportCopy, onPressed: _copy),
                if (_copied) ...[
                  const SizedBox(height: 12),
                  Text(LedgerStrings.exportCopied, textAlign: TextAlign.center, style: LedgerTextStyles.note),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
