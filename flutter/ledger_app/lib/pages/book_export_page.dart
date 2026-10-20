import 'dart:async';

import 'package:flutter/material.dart';

import '../data/book_file.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_subpage_head.dart';

class BookExportPage extends StatefulWidget {
  const BookExportPage({
    super.key,
    required this.currentDocument,
    required this.onClear,
  });

  final String Function() currentDocument;
  final VoidCallback onClear;

  static Future<void> open(
    BuildContext context, {
    required String Function() currentDocument,
    required VoidCallback onClear,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            BookExportPage(currentDocument: currentDocument, onClear: onClear),
      ),
    );
  }

  @override
  State<BookExportPage> createState() => _BookExportPageState();
}

class _BookExportPageState extends State<BookExportPage> {
  OverlayEntry? _toastEntry;
  Timer? _toastTimer;

  @override
  void dispose() {
    _toastTimer?.cancel();
    _toastEntry?.remove();
    _toastEntry = null;
    super.dispose();
  }

  void _toast(String message) {
    _toastTimer?.cancel();
    _toastEntry?.remove();
    final entry = OverlayEntry(
      builder: (context) {
        final colors = Theme.of(context).colorScheme;
        return IgnorePointer(
          child: Center(
            child: Material(
              color: colors.inverseSurface,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Text(
                  message,
                  style: LedgerTextStyles.note.copyWith(
                    color: colors.onInverseSurface,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
    _toastEntry = entry;
    Overlay.of(context).insert(entry);
    _toastTimer = Timer(const Duration(seconds: 2), () {
      if (_toastEntry != entry) return;
      entry.remove();
      _toastEntry = null;
    });
  }

  Future<void> _download() async {
    try {
      await saveBookJsonFile(widget.currentDocument());
      if (!mounted) return;
      _toast(LedgerStrings.exportSaved);
    } catch (error) {
      debugPrint('book download failed: $error');
      if (!mounted) return;
      _toast(LedgerStrings.exportFailed);
    }
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
                        onTap: _download,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  LedgerStrings.exportBackup,
                                  style: LedgerTextStyles.settingsRowTitle,
                                ),
                              ),
                              const Icon(
                                Icons.file_download_outlined,
                                color: LedgerColors.ink,
                                size: 22,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Divider(
                        height: 1,
                        thickness: 1,
                        color: LedgerColors.line,
                      ),
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
