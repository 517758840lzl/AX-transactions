String bookFileName() {
  final now = DateTime.now();
  String two(int value) => value.toString().padLeft(2, '0');
  return 'ledger-${now.year}-${two(now.month)}-${two(now.day)}-${two(now.hour)}${two(now.minute)}.json';
}
