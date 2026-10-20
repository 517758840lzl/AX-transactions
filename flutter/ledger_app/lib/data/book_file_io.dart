import 'dart:io';

import 'package:flutter/services.dart';

import 'book_file_name.dart';

const _downloads = MethodChannel('ledger/downloads');

Future<void> saveBookJsonFile(String text) async {
  final name = bookFileName();
  if (Platform.isAndroid || Platform.isIOS) {
    await _downloads.invokeMethod<void>('save', {'name': name, 'text': text});
    return;
  }
  final home =
      Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'];
  if (home == null || home.isEmpty) {
    throw StateError('home');
  }
  final separator = Platform.isWindows ? '\\' : '/';
  await File('$home${separator}Downloads$separator$name').writeAsString(text);
}
