import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_subpage_head.dart';

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key});

  static const policyAsset = 'assets/privacy.html';

  static Future<void> open(BuildContext context) {
    return Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrivacyPage()));
  }

  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  static const _pathAccess = MethodChannel('ledger/path_access');

  late final WebViewController _controller;
  var _failed = false;

  bool get _watchPathAccess => !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.disabled)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _failed = false);
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) setState(() => _failed = true);
          },
        ),
      );
    if (_watchPathAccess) {
      _pathAccess.setMethodCallHandler(_onPathAccess);
      unawaited(_pathAccess.invokeMethod<void>('watch'));
    }
    _loadPolicy();
  }

  @override
  void dispose() {
    if (_watchPathAccess) {
      _pathAccess.setMethodCallHandler(null);
      unawaited(_pathAccess.invokeMethod<void>('stop'));
    }
    super.dispose();
  }

  Future<void> _onPathAccess(MethodCall call) async {
    if (call.method != 'granted' || !mounted) return;
    setState(() => _failed = false);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadPolicy();
    });
  }

  void _loadPolicy() {
    _controller.loadFlutterAsset(PrivacyPage.policyAsset);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 8, 18, 0),
                  child: LedgerSubpageHead(title: LedgerStrings.privacyTitle, onBack: () => Navigator.pop(context)),
                ),
                Expanded(
                  child: _failed
                      ? Center(
                          child: TextButton(
                            onPressed: _loadPolicy,
                            child: Text(LedgerStrings.privacyRetry, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink)),
                          ),
                        )
                      : WebViewWidget(controller: _controller),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
