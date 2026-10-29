import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/ledger_colors.dart';

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
      return IgnorePointer(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 320),
            margin: const EdgeInsets.symmetric(horizontal: 24),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            decoration: BoxDecoration(
              color: LedgerColors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: LedgerColors.line),
              boxShadow: const [
                BoxShadow(color: Color(0x140B051D), blurRadius: 12, offset: Offset(0, 6)),
              ],
            ),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: LedgerColors.ink, fontWeight: FontWeight.w700, fontSize: 14, height: 1.35),
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
