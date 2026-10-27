import 'package:flutter/foundation.dart';
import '../tabs/me/me_models.dart';

/// Categories and quick templates. Stored apart from sample entries, so clearing the sample book leaves them.
class LedgerCatalog extends ChangeNotifier {
  LedgerCatalog({List<String>? categories, List<MeTemplate>? templates})
      : categories = List<String>.from(categories ?? MeStarter.categories),
        templates = List<MeTemplate>.from(templates ?? const []);

  List<String> categories;
  List<MeTemplate> templates;

  void addCategory(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty || categories.contains(trimmed)) return;
    categories = [...categories, trimmed];
    notifyListeners();
  }

  /// Keeps at least one category. Returns the category that entries on the removed one should move to.
  String? removeCategory(String name) {
    if (categories.length <= 1 || !categories.contains(name)) return null;
    final fallback = categories.firstWhere((item) => item != name);
    categories = categories.where((item) => item != name).toList();
    notifyListeners();
    return fallback;
  }

  bool hasSameTemplate(MeTemplate candidate) {
    return templates.any((item) => item.matches(candidate));
  }

  bool addTemplate(MeTemplate template) {
    if (hasSameTemplate(template)) return false;
    templates = [...templates, template];
    notifyListeners();
    return true;
  }

  void removeTemplate(String id) {
    templates = templates.where((item) => item.id != id).toList();
    notifyListeners();
  }

  void replace({required List<String> categories, required List<MeTemplate> templates}) {
    this.categories = List<String>.from(categories.isEmpty ? MeStarter.categories : categories);
    this.templates = List<MeTemplate>.from(templates);
    notifyListeners();
  }
}
