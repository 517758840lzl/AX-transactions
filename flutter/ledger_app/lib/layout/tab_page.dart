import 'package:flutter/rendering.dart';

/// Shared ListView padding for the four main tabs, matching the web `.ledger-phone` inset.
abstract final class TabPage {
  /// The tab bar sits outside the list. Pages with a floating add button leave room for it.
  static const listPadding = EdgeInsets.fromLTRB(18, 12, 18, 88);

  /// Pages without a floating button only need a short gap above the tab bar.
  static const listPaddingRest = EdgeInsets.fromLTRB(18, 12, 18, 16);

  /// The main list builds the next screen ahead of time so scrolling does less layout work.
  static const scrollCache = ScrollCacheExtent.pixels(480);
}
