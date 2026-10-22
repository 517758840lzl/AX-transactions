import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'ledger_colors.dart';
import 'ledger_text_styles.dart';

abstract final class LedgerTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      splashFactory: InkRipple.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      scaffoldBackgroundColor: LedgerColors.stage,
      colorScheme: const ColorScheme.light(
        primary: LedgerColors.pink,
        onPrimary: LedgerColors.ink,
        surface: LedgerColors.white,
        onSurface: LedgerColors.ink,
      ),
      fontFamily: defaultTargetPlatform == TargetPlatform.iOS ? 'PingFang SC' : null,
      fontFamilyFallback: const ['PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Noto Sans CJK SC', 'sans-serif'],
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
      dialogTheme: const DialogThemeData(
        backgroundColor: LedgerColors.white,
        surfaceTintColor: LedgerColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
        clipBehavior: Clip.antiAlias,
      ),
      datePickerTheme: const DatePickerThemeData(
        backgroundColor: LedgerColors.white,
        surfaceTintColor: LedgerColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: LedgerColors.white,
        surfaceTintColor: LedgerColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        clipBehavior: Clip.antiAlias,
      ),
      popupMenuTheme: const PopupMenuThemeData(
        color: LedgerColors.white,
        surfaceTintColor: LedgerColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
      ),
      menuTheme: const MenuThemeData(
        style: MenuStyle(
          backgroundColor: WidgetStatePropertyAll(LedgerColors.white),
          surfaceTintColor: WidgetStatePropertyAll(LedgerColors.white),
          shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16)))),
        ),
      ),
    );
  }
}
