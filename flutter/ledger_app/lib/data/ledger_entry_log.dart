import 'package:flutter/foundation.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../tabs/dashboard/dashboard_sample_data.dart';

/// 总览、流水、账户共用的流水。记一笔写入后各页一起刷新。
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
