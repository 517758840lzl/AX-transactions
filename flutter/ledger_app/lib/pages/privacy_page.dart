import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_subpage_head.dart';

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key});

  static const pageUrl = 'https://www.baidu.com';

  static Future<void> open(BuildContext context) {
    return Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrivacyPage()));
  }

  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  late final WebViewController _controller;
  var _failed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _failed = false);
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) setState(() => _failed = true);
          },
        ),
      )
      ..loadRequest(Uri.parse(PrivacyPage.pageUrl));
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
                            onPressed: () => _controller.loadRequest(Uri.parse(PrivacyPage.pageUrl)),
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
