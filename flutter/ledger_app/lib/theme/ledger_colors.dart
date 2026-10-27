import 'package:flutter/material.dart';

/// Matches `src/prototypes/ledger/style.css` and the klarna-mobile design.
abstract final class LedgerColors {
  static const pink = Color(0xFFFFB3C7);
  static const pinkPressed = Color(0xFFF49CB4);
  static const wash = Color(0xFFFFF2F5);
  static const ink = Color(0xFF0B051D);
  static const muted = Color(0xFF6E6878);
  static const faint = Color(0xFF9B96A3);
  static const line = Color(0xFFF0DDE3);
  static const neutral = Color(0xFFF6F4F8);
  static const stage = Color(0xFFF3F0F4);
  static const blackSurface = Color(0xFF0B051D);
  static const white = Color(0xFFFFFFFF);
  static const up = Color(0xFF2F9E62);
  static const down = Color(0xFFE85D75);
  static const chartLine = Color(0xFFE85D75);
  /// rgba(255,255,255,0.62) — hero labels and an unselected segment.
  static const onDarkMuted = Color(0x9EFFFFFF);
  /// rgba(255,255,255,0.88) — hero footnote amount.
  static const onDarkSoft = Color(0xE0FFFFFF);
  static const heroFoot = onDarkSoft;
  static const heroLabel = onDarkMuted;
  /// `.ledger-review-btn.is-open`
  static const reviewOpen = Color(0xFFA9700E);
  static const reviewOpenBg = Color(0x24A9700E);
  static const heroToneUp = Color(0xFF8EE4B0);
  static const budgetOver = Color(0xFFA9700E);
}
