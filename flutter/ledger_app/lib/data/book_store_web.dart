import 'package:shared_preferences/shared_preferences.dart';

const bookStorageKey = 'ledger-book-v1';

Future<String?> readBookDocument() async {
  final preferences = await SharedPreferences.getInstance();
  final document = preferences.getString(bookStorageKey);
  if (document == null || document.isEmpty) return null;
  return document;
}

Future<void> writeBookDocument(String document) async {
  final preferences = await SharedPreferences.getInstance();
  await preferences.setString(bookStorageKey, document);
}

Future<void> discardBookDocument() async {
  final preferences = await SharedPreferences.getInstance();
  await preferences.remove(bookStorageKey);
}
