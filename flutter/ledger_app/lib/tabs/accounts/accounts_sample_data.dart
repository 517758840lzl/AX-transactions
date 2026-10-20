import 'accounts_models.dart';

abstract final class AccountsSampleData {
  static const accountKindOrder = [AccountKind.bank, AccountKind.cash, AccountKind.card, AccountKind.other];

  static List<LedgerAccount> sampleAccounts() => const [
        LedgerAccount(id: 'sample-cash', name: '现金', opening: 860, kind: AccountKind.cash),
        LedgerAccount(id: 'sample-card', name: 'Visa', opening: 4200, kind: AccountKind.card),
      ];

  /// 与 Make 原型账户 Tab 演示一致（中天科技 · 市值 ¥27,190）
  static List<LedgerHolding> sampleHoldings() {
    final today = DateTime.now();
    final iso =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    return [
      LedgerHolding(
        id: 'sample-holding-zttc',
        kind: HoldingKind.fund,
        code: '600522',
        name: '中天科技',
        qty: 1000,
        costTotal: 34230,
        price: 27.19,
        priceAsOf: iso,
      ),
    ];
  }

  static bool hasSample(List<LedgerAccount> accounts) => accounts.any((a) => a.id.startsWith('sample-'));

  static bool hasSampleHoldings(List<LedgerHolding> holdings) => holdings.any((h) => h.id.startsWith('sample-'));
}
