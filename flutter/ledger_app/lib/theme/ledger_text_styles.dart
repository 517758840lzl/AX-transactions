import 'package:flutter/material.dart';
import 'ledger_colors.dart';

/// Matches the type scale in `style.css` so pages do not drift onto hand-written colors.
abstract final class LedgerTextStyles {
  static const pageTitle = TextStyle(fontSize: 26, fontWeight: FontWeight.w700, height: 1.15, letterSpacing: -0.4, color: LedgerColors.ink);

  static const topbarMeta = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.muted);

  static const panelTitle = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.02, color: LedgerColors.ink);

  static const cardTitle = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const panelAction = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const headAction = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const note = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, height: 1.45, color: LedgerColors.muted);

  static const noteSemibold = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.muted);

  static const dayLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.muted);

  static const txTitle = TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: LedgerColors.ink);

  static const txMeta = TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: LedgerColors.muted);

  static const accountTitle = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const accountMeta = TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: LedgerColors.muted);

  static const groupLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.muted);

  static const rowValue = TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: LedgerColors.muted);

  static const chevron = TextStyle(fontSize: 20, fontWeight: FontWeight.w400, color: LedgerColors.muted);

  static const heroLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.onDarkMuted);

  static const heroFoot = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.onDarkSoft);

  static const tabLabel = TextStyle(fontSize: 11, fontWeight: FontWeight.w600);

  static const chipLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const inputHint = TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: LedgerColors.faint);

  static const profileName = TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const detailTitle = TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const body = TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: LedgerColors.ink);

  static const bodyMuted = TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: LedgerColors.muted);

  static const settingsValue = TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: LedgerColors.muted);

  static const settingsRowTitle = TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: LedgerColors.ink);

  static const budgetPace = TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: LedgerColors.pink);

  static const heroDeltaUp = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.heroToneUp);

  static const heroDeltaDown = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: LedgerColors.pink);

  static const listDeltaUp = TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: LedgerColors.up);

  static const listDeltaDown = TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: LedgerColors.down);

  static const calendarWeek = TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: LedgerColors.muted);

  static const calendarDay = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.ink);

  static const rankName = TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  /// `.ledger-rank-label`
  static const rankLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: LedgerColors.ink);

  static const rankLabelActive = TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: LedgerColors.ink);

  /// `.ledger-rank-trend`
  static const rankTrend = TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: LedgerColors.muted);

  static const rankTrendUp = TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: LedgerColors.down);

  static const rankTrendDown = TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: LedgerColors.up);

  /// Total in the center of the ring chart (web SVG 12px, weight 700).
  static const pieCenterAmount = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: LedgerColors.ink,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  static const donutCaption = TextStyle(fontSize: 11, fontWeight: FontWeight.w400, color: LedgerColors.muted);

  static const categoryChipName = TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const recurringTitle = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const reviewChipOpen = TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: LedgerColors.reviewOpen);

  static const reviewChipDone = TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const txIconInitial = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  static const avatarInitial = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: LedgerColors.ink);

  /// `.ledger-banner`
  static const sampleBanner = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.0, color: LedgerColors.ink);

  static const sampleBannerAction = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, height: 1.0, color: LedgerColors.ink);

  static const streakMeta = TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: LedgerColors.muted);
}
