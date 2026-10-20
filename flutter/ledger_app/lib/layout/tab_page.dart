import 'package:flutter/material.dart';

/// 四 Tab 主屏共用 ListView 边距（与 Web `.ledger-phone` 内边距一致）。
abstract final class TabPage {
  /// 底栏在列表外面。底部留出悬浮「+」，避免最后一行被挡住。
  static const listPadding = EdgeInsets.fromLTRB(18, 12, 18, 88);
}
