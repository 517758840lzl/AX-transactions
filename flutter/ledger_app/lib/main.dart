import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/ledger_app.dart';
import 'data/ledger_session.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );
  final session = await LedgerSession.open();
  runApp(LedgerApp(session: session));
}
