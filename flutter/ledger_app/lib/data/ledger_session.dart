import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../tabs/accounts/accounts_models.dart';
import '../tabs/accounts/accounts_sample_data.dart';
import '../tabs/accounts/accounts_tab_state.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../tabs/dashboard/dashboard_sample_data.dart';
import '../tabs/me/me_models.dart';
import 'ledger_budget.dart';
import 'ledger_catalog.dart';
import 'ledger_entry_log.dart';

/// 账户、流水、持仓、预算、分类、模板。写入本机后，重新打开不会回到示例账。
class LedgerAccountBook extends ChangeNotifier {
  LedgerAccountBook({
    required List<LedgerAccount> accounts,
    required List<LedgerHolding> holdings,
    required this.sampleCleared,
  })  : accounts = List<LedgerAccount>.of(accounts),
        holdings = List<LedgerHolding>.of(holdings);

  List<LedgerAccount> accounts;
  List<LedgerHolding> holdings;
  bool sampleCleared;

  void take(AccountsTabState state) {
    accounts = state.accounts;
    holdings = state.holdings;
    sampleCleared = state.sampleCleared;
    notifyListeners();
  }

  void replace({
    required List<LedgerAccount> accounts,
    required List<LedgerHolding> holdings,
    required bool sampleCleared,
  }) {
    this.accounts = List<LedgerAccount>.of(accounts);
    this.holdings = List<LedgerHolding>.of(holdings);
    this.sampleCleared = sampleCleared;
    notifyListeners();
  }

  /// 去掉 id 以 sample- 开头的账户、持仓，并让流水日志丢掉对应示例。
  void clearFilled(LedgerEntryLog entries) {
    accounts = accounts.where((item) => !item.id.startsWith('sample-')).toList();
    holdings = holdings.where((item) => !item.id.startsWith('sample-')).toList();
    sampleCleared = true;
    notifyListeners();
    entries.publish(entries.entries.where((item) => !item.id.startsWith('sample-')).toList());
  }
}

class LedgerSession {
  LedgerSession({
    required this.entries,
    required this.budget,
    required this.catalog,
    required this.accounts,
    required this._preferences,
  }) {
    entries.addListener(_save);
    budget.addListener(_save);
    catalog.addListener(_save);
    accounts.addListener(_save);
  }

  static const _key = 'ledger-book-v1';

  final LedgerEntryLog entries;
  final LedgerBudget budget;
  final LedgerCatalog catalog;
  final LedgerAccountBook accounts;
  final SharedPreferences _preferences;
  Future<void> _writeTask = Future<void>.value();

  static Future<LedgerSession> open() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_key);
    if (raw == null || raw.isEmpty) {
      final session = _seed(preferences);
      await session._write();
      return session;
    }
    try {
      final parsed = jsonDecode(raw);
      if (parsed is! Map<String, dynamic> && parsed is! Map) {
        final session = _seed(preferences);
        await session._write();
        return session;
      }
      return _fromMap(Map<String, dynamic>.from(parsed), preferences);
    } catch (_) {
      final session = _seed(preferences);
      await session._write();
      return session;
    }
  }

  static LedgerSession _seed(SharedPreferences preferences) {
    return LedgerSession(
      entries: LedgerEntryLog(),
      budget: LedgerBudget(),
      catalog: LedgerCatalog(),
      accounts: LedgerAccountBook(
        accounts: AccountsSampleData.sampleAccounts(),
        holdings: AccountsSampleData.sampleHoldings(),
        sampleCleared: false,
      ),
      preferences: preferences,
    );
  }

  static LedgerSession _fromMap(Map<String, dynamic> map, SharedPreferences preferences) {
    final sampleCleared = map['sampleCleared'] == true;
    return LedgerSession(
      entries: LedgerEntryLog(entries: _entries(map['entries'], sampleCleared: sampleCleared)),
      budget: LedgerBudget(monthly: _money(map['monthly']), categoryCaps: _caps(map['categoryCaps'])),
      catalog: LedgerCatalog(categories: _names(map['categories']), templates: _templates(map['templates'])),
      accounts: LedgerAccountBook(
        accounts: _accounts(map['accounts'], sampleCleared: sampleCleared),
        holdings: _holdings(map['holdings'], sampleCleared: sampleCleared),
        sampleCleared: sampleCleared,
      ),
      preferences: preferences,
    );
  }

  void _save() {
    _writeTask = _writeTask.then((_) => _write(), onError: (Object _, StackTrace _) => _write());
  }

  Future<void> flush() => _writeTask;

  Future<void> _write() {
    return _preferences.setString(_key, jsonEncode(_snapshot()));
  }

  String exportDocument({
    String nickname = '',
    String gender = 'secret',
    String locale = 'zh',
    String currency = 'USD',
  }) {
    return const JsonEncoder.withIndent('  ').convert({
      ..._snapshot(),
      'nickname': nickname,
      'gender': gender,
      'locale': locale,
      'currency': currency,
    });
  }

  /// 用导出的 JSON 覆盖当前账。昵称等资料由调用方另存。
  bool applyDocument(String raw) {
    try {
      final parsed = jsonDecode(raw);
      if (parsed is! Map) return false;
      final map = Map<String, dynamic>.from(parsed);
      final sampleCleared = map.containsKey('sampleCleared') ? map['sampleCleared'] == true : accounts.sampleCleared;
      if (map['entries'] is List) {
        entries.publish(_entries(map['entries'], sampleCleared: sampleCleared));
      }
      if (map.containsKey('monthly') || map.containsKey('budget') || map.containsKey('categoryCaps') || map.containsKey('categoryBudgets')) {
        final monthly = _money(map['monthly']) ?? _money(map['budget']);
        final caps = map['categoryCaps'] is Map ? _caps(map['categoryCaps']) : _caps(map['categoryBudgets']);
        budget.save(monthly: monthly, categoryCaps: caps, clear: monthly == null && caps.isEmpty);
      }
      if (map['categories'] is List || map['templates'] is List) {
        catalog.replace(
          categories: _names(map['categories']) ?? catalog.categories,
          templates: map['templates'] is List ? _templates(map['templates']) : catalog.templates,
        );
      }
      if (map['accounts'] is List || map['holdings'] is List) {
        accounts.replace(
          accounts: map['accounts'] is List ? _accounts(map['accounts'], sampleCleared: sampleCleared) : accounts.accounts,
          holdings: map['holdings'] is List ? _holdings(map['holdings'], sampleCleared: sampleCleared) : accounts.holdings,
          sampleCleared: sampleCleared,
        );
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Map<String, Object?> _snapshot() {
    return {
      'sampleCleared': accounts.sampleCleared,
      'monthly': budget.monthly,
      'categoryCaps': budget.categoryCaps,
      'categories': catalog.categories,
      'templates': [
        for (final item in catalog.templates)
          {
            'id': item.id,
            'title': item.title,
            'amount': item.amount,
            'direction': item.direction,
            'category': item.category,
            'accountId': item.accountId,
            'shared': item.shared,
          },
      ],
      'accounts': [
        for (final item in accounts.accounts)
          {'id': item.id, 'name': item.name, 'opening': item.opening, 'kind': item.kind.name},
      ],
      'holdings': [
        for (final item in accounts.holdings)
          {
            'id': item.id,
            'kind': item.kind.name,
            'code': item.code,
            'name': item.name,
            'qty': item.qty,
            'costTotal': item.costTotal,
            'price': item.price,
            'priceAsOf': item.priceAsOf,
          },
      ],
      'entries': [
        for (final item in entries.entries)
          {
            'id': item.id,
            'title': item.title,
            'amount': item.amount,
            'direction': item.direction,
            'category': item.category,
            'date': item.date,
            'accountName': item.accountName,
            'accountId': item.accountId,
            'checked': item.checked,
            'shared': item.shared,
          },
      ],
    };
  }
}

List<DashboardEntry> _entries(Object? raw, {required bool sampleCleared}) {
  if (raw is! List) return sampleCleared ? [] : DashboardSampleData.seedEntries();
  return [
    for (final item in raw)
      if (item is Map)
        DashboardEntry(
          id: '${item['id'] ?? ''}',
          title: '${item['title'] ?? ''}',
          amount: _money(item['amount']) ?? 0,
          direction: item['direction'] == 'in' ? 'in' : 'out',
          category: '${item['category'] ?? ''}',
          date: '${item['date'] ?? ''}',
          accountName: '${item['accountName'] ?? ''}',
          accountId: '${item['accountId'] ?? ''}',
          checked: item['checked'] == true,
          shared: item['shared'] == true,
        ),
  ];
}

List<LedgerAccount> _accounts(Object? raw, {required bool sampleCleared}) {
  if (raw is! List) return sampleCleared ? [] : AccountsSampleData.sampleAccounts();
  return [
    for (final item in raw)
      if (item is Map)
        LedgerAccount(
          id: '${item['id'] ?? ''}',
          name: '${item['name'] ?? ''}',
          opening: _money(item['opening']) ?? 0,
          kind: AccountKind.values.firstWhere((kind) => kind.name == item['kind'], orElse: () => AccountKind.cash),
        ),
  ];
}

List<LedgerHolding> _holdings(Object? raw, {required bool sampleCleared}) {
  if (raw is! List) return sampleCleared ? [] : AccountsSampleData.sampleHoldings();
  return [
    for (final item in raw)
      if (item is Map)
        LedgerHolding(
          id: '${item['id'] ?? ''}',
          kind: HoldingKind.values.firstWhere((kind) => kind.name == item['kind'], orElse: () => HoldingKind.stock),
          code: '${item['code'] ?? ''}',
          name: '${item['name'] ?? ''}',
          qty: _money(item['qty']) ?? 0,
          costTotal: _money(item['costTotal']) ?? 0,
          price: _money(item['price']) ?? 0,
          priceAsOf: '${item['priceAsOf'] ?? ''}',
        ),
  ];
}

List<String>? _names(Object? raw) {
  if (raw is! List || raw.isEmpty) return null;
  return [for (final item in raw) item.toString()];
}

List<MeTemplate> _templates(Object? raw) {
  if (raw is! List) return const [];
  return [
    for (final item in raw)
      if (item is Map)
        MeTemplate(
          id: '${item['id'] ?? ''}',
          title: '${item['title'] ?? ''}',
          amount: _money(item['amount']) ?? 0,
          direction: item['direction'] == 'in' ? 'in' : 'out',
          category: '${item['category'] ?? ''}',
          accountId: '${item['accountId'] ?? ''}',
          shared: item['shared'] == true,
        ),
  ];
}

Map<String, double> _caps(Object? raw) {
  if (raw is! Map) return {};
  return {
    for (final entry in raw.entries)
      if (_money(entry.value) != null) entry.key.toString(): _money(entry.value)!,
  };
}

double? _money(Object? raw) {
  if (raw is num) return raw.toDouble();
  return null;
}
