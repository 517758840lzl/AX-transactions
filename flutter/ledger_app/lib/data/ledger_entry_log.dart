import 'package:flutter/foundation.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../tabs/dashboard/dashboard_sample_data.dart';

/// Entries shared by overview, transactions, and accounts. Saving one refreshes every page.
class LedgerEntryLog extends ChangeNotifier {
  LedgerEntryLog({List<DashboardEntry>? entries}) : entries = entries ?? DashboardSampleData.seedEntries();

  List<DashboardEntry> entries;

  void add(DashboardEntry entry) {
    entries = [entry, ...entries];
    notifyListeners();
  }

  void publish(List<DashboardEntry> next) {
    entries = next;
    notifyListeners();
  }
}
