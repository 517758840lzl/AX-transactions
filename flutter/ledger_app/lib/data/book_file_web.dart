import 'dart:js_interop';

import 'package:web/web.dart';

import 'book_file_name.dart';

Future<void> saveBookJsonFile(String text) async {
  final blob = Blob(
    [text.toJS].toJS,
    BlobPropertyBag(type: 'application/json'),
  );
  final url = URL.createObjectURL(blob);
  final parent = document.body;
  if (parent == null) {
    throw StateError('body');
  }
  final anchor = HTMLAnchorElement()
    ..href = url
    ..download = bookFileName();
  parent.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
