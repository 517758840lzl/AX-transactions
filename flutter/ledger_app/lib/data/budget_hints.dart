/// 与 `store.ts` `categoryBudgetHintByName` / `defaultMonthlyBudgetHint` 一致
abstract final class BudgetHints {
  static const categoryByName = {
    '餐饮': 1800.0,
    '交通': 400.0,
    '日用': 600.0,
    '居住': 3200.0,
    '收入': 8000.0,
    '订阅': 200.0,
    '娱乐': 500.0,
  };

  static String monthlyPlaceholder() => '5000.00';

  static String categoryPlaceholder(String name) {
    final v = categoryByName[name] ?? 500.0;
    return v.toStringAsFixed(2);
  }
}
