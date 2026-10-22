import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/ledger_text_styles.dart';

OverlayEntry? _noteEntry;
Timer? _noteTimer;

void showCenterNote(BuildContext context, String message) {
  _noteTimer?.cancel();
  final previous = _noteEntry;
  _noteEntry = null;
  if (previous != null && previous.mounted) previous.remove();
  final overlay = Overlay.maybeOf(context);
  if (overlay == null) return;
  final entry = OverlayEntry(
    builder: (context) {
      final colors = Theme.of(context).colorScheme;
      return IgnorePointer(
        child: Center(
          child: Material(
            color: colors.inverseSurface,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(
                message,
                style: LedgerTextStyles.note.copyWith(color: colors.onInverseSurface),
              ),
            ),
          ),
        ),
      );
    },
  );
  _noteEntry = entry;
  overlay.insert(entry);
  _noteTimer = Timer(const Duration(seconds: 2), () {
    if (_noteEntry != entry) return;
    if (entry.mounted) entry.remove();
    _noteEntry = null;
  });
}

void dismissCenterNote() {
  _noteTimer?.cancel();
  _noteTimer = null;
  final current = _noteEntry;
  _noteEntry = null;
  if (current != null && current.mounted) current.remove();
}
