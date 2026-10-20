import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_app/tabs/accounts/accounts_book_math.dart';
import 'package:ledger_app/tabs/accounts/accounts_sample_data.dart';
import 'package:ledger_app/tabs/dashboard/dashboard_sample_data.dart';

void main() {
  test('sample accounts + holdings match prototype hero foot', () {
    final accounts = AccountsSampleData.sampleAccounts();
    final entries = DashboardSampleData.seedEntries();
    final holdings = AccountsSampleData.sampleHoldings();

    final cash = AccountsBookMath.accountsBalanceTotal(accounts, entries);
    expect(cash, closeTo(5172.96, 0.01));

    final holdingsTotal = AccountsBookMath.holdingsMarketTotal(holdings);
    expect(holdingsTotal, closeTo(27190, 0.01));

    final nw = AccountsBookMath.bookNetWorth(accounts, entries, holdings);
    expect(nw, closeTo(32362.96, 0.01));

    final from = AccountsBookMath.windowStartIso(30);
    final prior = AccountsBookMath.bookNetWorthOnDate(accounts, entries, holdings, AccountsBookMath.isoBefore(from));
    final delta = nw - prior;
    expect(AccountsBookMath.formatPct(delta, prior), '+5.3%');
  });
}
