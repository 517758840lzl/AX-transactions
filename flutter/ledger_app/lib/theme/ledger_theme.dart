import 'package:flutter/material.dart';
import 'ledger_colors.dart';
import 'ledger_text_styles.dart';

abstract final class LedgerTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: LedgerColors.stage,
      colorScheme: const ColorScheme.light(
        primary: LedgerColors.pink,
        onPrimary: LedgerColors.ink,
        surface: LedgerColors.white,
        onSurface: LedgerColors.ink,
      ),
      fontFamily: 'PingFang SC',
      fontFamilyFallback: const ['Hiragino Sans GB', 'Noto Sans SC', 'Inter', 'sans-serif'],
      textTheme: const TextTheme(
        headlineLarge: LedgerTextStyles.pageTitle,
        titleMedium: LedgerTextStyles.panelTitle,
        bodyMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, height: 1.45, color: LedgerColors.ink),
        labelLarge: LedgerTextStyles.noteSemibold,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: LedgerColors.ink,
          textStyle: LedgerTextStyles.panelAction,
          padding: EdgeInsets.zero,
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        hintStyle: LedgerTextStyles.inputHint,
        labelStyle: LedgerTextStyles.noteSemibold,
      ),
      dividerColor: LedgerColors.line,
    );
  }
}
