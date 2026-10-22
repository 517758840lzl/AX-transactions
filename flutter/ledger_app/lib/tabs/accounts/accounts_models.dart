abstract final class AccountKind {
  static const bank = 'bank';
  static const cash = 'cash';
  static const card = 'card';
  static const other = 'other';
  static const values = <String>[bank, cash, card, other];

  static String read(Object? raw) {
    final name = '$raw';
    for (final kind in values) {
      if (kind == name) return kind;
    }
    return cash;
  }
}

abstract final class HoldingKind {
  static const stock = 'stock';
  static const etf = 'etf';
  static const fund = 'fund';
  static const values = <String>[stock, etf, fund];

  static String read(Object? raw) {
    final name = '$raw';
    for (final kind in values) {
      if (kind == name) return kind;
    }
    return stock;
  }
}

class LedgerAccount {
  const LedgerAccount({required this.id, required this.name, required this.opening, required this.kind});

  final String id;
  final String name;
  final double opening;
  final String kind;
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
  final String kind;
  final String code;
  final String name;
  final double qty;
  final double costTotal;
  final double price;
  final String priceAsOf;
}
