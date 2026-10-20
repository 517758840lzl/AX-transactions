import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_app/data/ledger_session.dart';
import 'package:ledger_app/tabs/accounts/accounts_models.dart';
import 'package:ledger_app/tabs/accounts/accounts_tab_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('cleared book stays cleared after reopen', () async {
    SharedPreferences.setMockInitialValues({});
    final first = await LedgerSession.open();
    expect(first.accounts.sampleCleared, isFalse);
    expect(
      first.entries.entries.any((entry) => entry.id.startsWith('sample-')),
      isTrue,
    );

    first.accounts.clearFilled(first.entries);
    await first.flush();

    final second = await LedgerSession.open();
    expect(second.accounts.sampleCleared, isTrue);
    expect(
      second.entries.entries.any((entry) => entry.id.startsWith('sample-')),
      isFalse,
    );
    expect(
      second.accounts.accounts.any(
        (account) => account.id.startsWith('sample-'),
      ),
      isFalse,
    );
    expect(
      second.accounts.holdings.any(
        (holding) => holding.id.startsWith('sample-'),
      ),
      isFalse,
    );
    expect(second.catalog.categories, contains('餐饮'));
  });

  test('old sample holding opens as nvidia', () async {
    SharedPreferences.setMockInitialValues({
      'ledger-book-v1': jsonEncode({
        'sampleCleared': false,
        'holdings': [
          {
            'id': 'sample-holding-zttc',
            'kind': 'fund',
            'code': '600522',
            'name': '中天科技',
            'qty': 1000,
            'costTotal': 34230,
            'price': 27.19,
            'priceAsOf': '2026-10-20',
          },
        ],
      }),
    });

    final session = await LedgerSession.open();
    final holding = session.accounts.holdings.single;
    expect(holding.name, '英伟达');
    expect(holding.code, 'NVDA');
    expect(holding.kind, HoldingKind.stock);
    expect(holding.qty, 1000);
    expect(holding.price, 27.19);
  });

  test('added holding survives reopen', () async {
    SharedPreferences.setMockInitialValues({});
    final first = await LedgerSession.open();
    first.accounts.clearFilled(first.entries);
    first.accounts.take(
      AccountsTabState(
        accounts: first.accounts.accounts,
        entries: first.entries.entries,
        holdings: const [
          LedgerHolding(
            id: 'nvda',
            kind: HoldingKind.stock,
            code: 'NVDA',
            name: '英伟达',
            qty: 1,
            costTotal: 100,
            price: 120,
            priceAsOf: '2026-10-20',
          ),
        ],
        sampleCleared: true,
      ),
    );
    await first.flush();

    final second = await LedgerSession.open();
    expect(second.accounts.sampleCleared, isTrue);
    expect(second.accounts.holdings, hasLength(1));
    expect(second.accounts.holdings.single.name, '英伟达');
    expect(second.entries.entries, isEmpty);
  });
}
