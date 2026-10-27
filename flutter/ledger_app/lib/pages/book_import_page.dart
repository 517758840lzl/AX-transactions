import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class BookImportPage extends StatefulWidget {
  const BookImportPage({super.key, required this.onApply});

  /// Returns null on success, or the message to show on the page when import fails.
  final String? Function(String raw) onApply;

  static Future<void> open(BuildContext context, {required String? Function(String raw) onApply}) {
    return Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => BookImportPage(onApply: onApply)),
    );
  }

  @override
  State<BookImportPage> createState() => _BookImportPageState();
}

class _BookImportPageState extends State<BookImportPage> {
  final _text = TextEditingController();
  String _note = '';
  var _ok = false;

  @override
  void initState() {
    super.initState();
    _text.addListener(_onText);
  }

  void _onText() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _text.removeListener(_onText);
    _text.dispose();
    super.dispose();
  }

  void _import() {
    final error = widget.onApply(_text.text.trim());
    setState(() {
      _ok = error == null;
      _note = error ?? LedgerStrings.importDone;
    });
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
                LedgerSubpageHead(title: LedgerStrings.importData, onBack: () => Navigator.pop(context)),
                const SizedBox(height: 12),
                TextField(
                  controller: _text,
                  minLines: 10,
                  maxLines: 16,
                  decoration: const InputDecoration(
                    hintText: LedgerStrings.importPaste,
                    filled: true,
                    fillColor: LedgerColors.neutral,
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                LedgerPillButton(label: LedgerStrings.importData, onPressed: _text.text.trim().isEmpty ? null : _import),
                if (_note.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    _note,
                    textAlign: TextAlign.center,
                    style: LedgerTextStyles.note.copyWith(color: _ok ? LedgerColors.up : LedgerColors.down),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
