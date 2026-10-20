import 'package:flutter/material.dart';
import '../data/ledger_session.dart';
import '../theme/ledger_theme.dart';
import 'ledger_shell.dart';

class LedgerScrollBehavior extends MaterialScrollBehavior {
  const LedgerScrollBehavior();

  @override
  ScrollViewKeyboardDismissBehavior getKeyboardDismissBehavior(BuildContext context) {
    return ScrollViewKeyboardDismissBehavior.onDrag;
  }
}

class LedgerApp extends StatelessWidget {
  const LedgerApp({super.key, this.session});

  final LedgerSession? session;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SpendLogBook',
      debugShowCheckedModeBanner: false,
      theme: LedgerTheme.light(),
      scrollBehavior: const LedgerScrollBehavior(),
      home: LedgerShell(session: session),
    );
  }
}
