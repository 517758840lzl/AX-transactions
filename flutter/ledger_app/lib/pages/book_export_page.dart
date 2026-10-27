import 'package:flutter/material.dart';

import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/center_note.dart';
import '../widgets/ledger_subpage_head.dart';

class BookExportPage extends StatefulWidget {
  const BookExportPage({
    super.key,
    required this.onClear,
  });

  final VoidCallback onClear;

  static Future<void> open(
    BuildContext context, {
    required VoidCallback onClear,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BookExportPage(onClear: onClear),
      ),
    );
  }

  @override
  State<BookExportPage> createState() => _BookExportPageState();
}

class _BookExportPageState extends State<BookExportPage> {
  @override
  void dispose() {
    dismissCenterNote();
    super.dispose();
  }

  void _toast(String message) {
    showCenterNote(context, message);
  }

  Future<void> _clear() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(LedgerStrings.clearBook),
        content: const Text(LedgerStrings.clearBookConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(LedgerStrings.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              LedgerStrings.clearBook,
              style: LedgerTextStyles.noteSemibold.copyWith(
                color: LedgerColors.down,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    widget.onClear();
    _toast(LedgerStrings.clearBookDone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.stage,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(
                  title: LedgerStrings.dataManage,
                  onBack: () => Navigator.pop(context),
                ),
                const SizedBox(height: 16),
                Material(
                  color: LedgerColors.white,
                  borderRadius: BorderRadius.circular(16),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      InkWell(
                        onTap: _clear,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  LedgerStrings.clearBook,
                                  style: LedgerTextStyles.settingsRowTitle
                                      .copyWith(color: LedgerColors.down),
                                ),
                              ),
                              const Icon(
                                Icons.error_outline,
                                color: LedgerColors.down,
                                size: 22,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
