class DashboardEntry {
  DashboardEntry({
    required this.id,
    required this.title,
    required this.amount,
    required this.direction,
    required this.category,
    required this.date,
    required this.accountName,
    required this.accountId,
    this.checked = true,
    this.shared = false,
  });

  final String id;
  final String title;
  final double amount;
  final String direction;
  final String category;
  final String date;
  final String accountName;
  final String accountId;
  bool checked;
  final bool shared;

  bool get isOut => direction == 'out';

  DashboardEntry copyWith({
    String? title,
    double? amount,
    String? direction,
    String? category,
    String? date,
    String? accountName,
    String? accountId,
    bool? checked,
    bool? shared,
  }) {
    return DashboardEntry(
      id: id,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      direction: direction ?? this.direction,
      category: category ?? this.category,
      date: date ?? this.date,
      accountName: accountName ?? this.accountName,
      accountId: accountId ?? this.accountId,
      checked: checked ?? this.checked,
      shared: shared ?? this.shared,
    );
  }
}

class DashboardCategoryPart {
  const DashboardCategoryPart({required this.name, required this.amount, required this.colorHex, this.budgetCap});

  final String name;
  final double amount;
  final String colorHex;
  final double? budgetCap;
}

class DashboardRecurringItem {
  const DashboardRecurringItem({required this.title, required this.amount, required this.times});

  final String title;
  final double amount;
  final int times;
}
