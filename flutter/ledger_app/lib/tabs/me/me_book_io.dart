import 'dart:convert';

import '../../data/ledger_budget.dart';
import '../../data/ledger_catalog.dart';
import '../../data/ledger_entry_log.dart';
import 'me_tab_state.dart';

abstract final class MeBookIo {
  static String exportDocument(MeTabState state, LedgerEntryLog entries, LedgerCatalog catalog, LedgerBudget budget) {
    final snapshot = state.toBookSnapshot();
    snapshot['categories'] = catalog.categories;
    snapshot['budget'] = budget.monthly;
    snapshot['categoryBudgets'] = budget.categoryCaps;
    snapshot['entries'] = [
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
    ];
    return const JsonEncoder.withIndent('  ').convert(snapshot);
  }

  static MeTabState? importFromJson(String raw) {
    if (raw.isEmpty) return null;
    try {
      final parsed = jsonDecode(raw);
      if (parsed is! Map) return null;
      return MeTabState.fromImportMap(Map<String, dynamic>.from(parsed));
    } catch (_) {
      return null;
    }
  }
}
