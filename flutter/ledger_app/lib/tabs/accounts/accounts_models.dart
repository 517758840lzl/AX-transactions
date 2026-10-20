enum AccountKind { bank, cash, card, other }

enum HoldingKind { stock, etf, fund }

class LedgerAccount {
  const LedgerAccount({required this.id, required this.name, required this.opening, required this.kind});

  final String id;
  final String name;
  final double opening;
  final AccountKind kind;
}

class LedgerHolding {
  const LedgerHolding({
    required this.id,
    required this.kind,
    required this.code,
    required this.name,
    required this.qty,
    required this.costTotal,
    required this.price,
    required this.priceAsOf,
  });

  final String id;
  final HoldingKind kind;
  final String code;
  final String name;
  final double qty;
  final double costTotal;
  final double price;
  final String priceAsOf;
}
