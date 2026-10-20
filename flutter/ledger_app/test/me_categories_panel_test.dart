import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_app/app/ledger_app.dart';
import 'package:ledger_app/l10n/ledger_strings.dart';
import 'package:ledger_app/tabs/me/me_models.dart';

Future<void> _openMeTab(WidgetTester tester) async {
  await tester.pumpWidget(const LedgerApp());
  await tester.pumpAndSettle();
  await tester.tap(find.byIcon(Icons.person_outline));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('Me tab categories shows starter list, edit, add row', (tester) async {
    await _openMeTab(tester);

    await tester.scrollUntilVisible(find.text(LedgerStrings.add), 120);
    await tester.pumpAndSettle();

    for (final name in MeStarter.categories) {
      expect(find.text(name), findsOneWidget);
    }

    expect(find.text(LedgerStrings.edit), findsOneWidget);
    expect(find.text(LedgerStrings.newCategory), findsOneWidget);
    expect(find.text(LedgerStrings.add), findsOneWidget);
  });

  testWidgets('Me tab can add and remove category in edit mode', (tester) async {
    await _openMeTab(tester);
    await tester.scrollUntilVisible(find.text(LedgerStrings.add), 120);
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '宠物');
    await tester.tap(find.text(LedgerStrings.add));
    await tester.pumpAndSettle();

    expect(find.text('宠物'), findsOneWidget);

    await tester.tap(find.text(LedgerStrings.edit));
    await tester.pumpAndSettle();

    await tester.tap(find.text('×').first);
    await tester.pumpAndSettle();

    expect(find.text('餐饮'), findsNothing);
  });
}
