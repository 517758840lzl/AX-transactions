import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_app/app/ledger_app.dart';
import 'package:ledger_app/l10n/ledger_strings.dart';
import 'package:ledger_app/tabs/me/me_models.dart';
import 'package:ledger_app/widgets/ledger_pill_button.dart';

Future<void> _openMeTab(WidgetTester tester) async {
  await tester.pumpWidget(const LedgerApp());
  await tester.pumpAndSettle();
  await tester.tap(find.byIcon(Icons.person_outline));
  await tester.pumpAndSettle();
}

Future<void> _scrollMeToCategories(WidgetTester tester) async {
  final list = find.byType(ListView).first;
  await tester.drag(list, const Offset(0, -800));
  await tester.pumpAndSettle();
}

Finder get _addCategory => find.descendant(
      of: find.byType(ListView).first,
      matching: find.widgetWithText(LedgerPillButton, LedgerStrings.add),
    );

void main() {
  testWidgets('Me tab categories shows starter list, edit, add row', (tester) async {
    await _openMeTab(tester);
    await _scrollMeToCategories(tester);

    for (final name in MeStarter.categories) {
      expect(find.text(name), findsWidgets);
    }

    expect(find.text(LedgerStrings.edit), findsOneWidget);
    expect(find.text(LedgerStrings.newCategory), findsOneWidget);
    expect(_addCategory, findsOneWidget);
  });

  testWidgets('Me tab can add and remove category in edit mode', (tester) async {
    await _openMeTab(tester);
    await _scrollMeToCategories(tester);

    await tester.enterText(find.byType(TextField), '宠物');
    await tester.tap(_addCategory);
    await tester.pumpAndSettle();

    expect(find.text('宠物'), findsOneWidget);

    await tester.tap(find.text(LedgerStrings.edit));
    await tester.pumpAndSettle();

    await tester.tap(find.text('×').first);
    await tester.pumpAndSettle();

    expect(find.text('餐饮'), findsNothing);
  });
}
