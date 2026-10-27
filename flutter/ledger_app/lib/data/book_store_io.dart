import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

const bookStorageKey = 'ledger-book-v1';
const _fileName = 'ledger_book.db';

String _bookPath(String directory) {
  final separator = Platform.isWindows ? '\\' : '/';
  if (directory.endsWith('/') || directory.endsWith('\\')) {
    return '$directory$_fileName';
  }
  return '$directory$separator$_fileName';
}

const _rowId = 1;

Database? _database;
var _prepared = false;

Future<void> _prepare() async {
  if (_prepared) return;
  if (Platform.isLinux || Platform.isWindows || Platform.isMacOS) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }
  _prepared = true;
}

Future<Database> _open() async {
  final current = _database;
  if (current != null && current.isOpen) return current;
  await _prepare();
  final filePath = _bookPath(await getDatabasesPath());
  final opened = await openDatabase(
    filePath,
    version: 1,
    onCreate: (db, version) async {
      await db.execute(
        'CREATE TABLE book (id INTEGER PRIMARY KEY, document TEXT NOT NULL)',
      );
    },
  );
  _database = opened;
  return opened;
}

Future<void> _put(Database db, String document) {
  return db.insert(
    'book',
    {'id': _rowId, 'document': document},
    conflictAlgorithm: ConflictAlgorithm.replace,
  );
}

Future<String?> readBookDocument() async {
  final db = await _open();
  final rows = await db.query(
    'book',
    columns: ['document'],
    where: 'id = ?',
    whereArgs: [_rowId],
    limit: 1,
  );
  if (rows.isNotEmpty) {
    final document = rows.first['document'];
    if (document is String && document.isNotEmpty) return document;
  }
  final preferences = await SharedPreferences.getInstance();
  final legacy = preferences.getString(bookStorageKey);
  if (legacy == null || legacy.isEmpty) return null;
  await _put(db, legacy);
  await preferences.remove(bookStorageKey);
  return legacy;
}

Future<void> writeBookDocument(String document) async {
  final db = await _open();
  await _put(db, document);
}

Future<void> discardBookDocument() async {
  final current = _database;
  _database = null;
  if (current != null && current.isOpen) {
    await current.close();
  }
  await _prepare();
  await deleteDatabase(_bookPath(await getDatabasesPath()));
  final preferences = await SharedPreferences.getInstance();
  await preferences.remove(bookStorageKey);
}
