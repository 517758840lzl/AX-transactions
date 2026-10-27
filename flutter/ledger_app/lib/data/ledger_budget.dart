import 'package:flutter/foundation.dart';

/// Monthly budget and category budgets shared by overview and Me.
class LedgerBudget extends ChangeNotifier {
  LedgerBudget({this.monthly, Map<String, double>? categoryCaps}) : categoryCaps = categoryCaps ?? {};

  double? monthly;
  Map<String, double> categoryCaps;

  void save({double? monthly, Map<String, double> categoryCaps = const {}, bool clear = false}) {
    if (clear) {
      this.monthly = null;
      this.categoryCaps = {};
    } else {
      this.monthly = monthly;
      this.categoryCaps = Map<String, double>.from(categoryCaps);
    }
    notifyListeners();
  }
}
