import 'package:flutter/material.dart';

/// 四 Tab 主屏共用 ListView 边距（与 Web `.ledger-phone` 内边距一致）。
abstract final class TabPage {
  /// 底栏在列表外面。有悬浮「+」的页要留出按钮高度。
  static const listPadding = EdgeInsets.fromLTRB(18, 12, 18, 88);

  /// 没有悬浮按钮的页，最后一项只要离开底栏一小段。
  static const listPaddingRest = EdgeInsets.fromLTRB(18, 12, 18, 16);
}
