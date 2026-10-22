import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_app/l10n/ledger_strings.dart';
import 'package:ledger_app/app/ledger_app.dart';

void main() {
  testWidgets('Ledger frame shows four tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const LedgerApp());
    await tester.pumpAndSettle();

    for (final label in [
      LedgerStrings.tabDashboard,
      LedgerStrings.tabTransactions,
      LedgerStrings.tabAccounts,
      LedgerStrings.tabMe,
    ]) {
      expect(find.text(label), findsWidgets);
    }
  });
}
