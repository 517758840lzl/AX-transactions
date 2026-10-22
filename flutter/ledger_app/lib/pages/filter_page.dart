import 'package:flutter/material.dart';
import '../data/ledger_view_filter.dart';
import '../l10n/ledger_strings.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_card.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_popup.dart';
import '../widgets/ledger_segment.dart';
import '../widgets/ledger_subpage_head.dart';

class LedgerFilterResult {
  const LedgerFilterResult({
    required this.scope,
    required this.periodMode,
    required this.rangeFrom,
    required this.rangeTo,
  });

  final String scope;
  final String periodMode;
  final String rangeFrom;
  final String rangeTo;
}

/// Web `panel === 'filter'`
class FilterPage extends StatefulWidget {
  const FilterPage({
    super.key,
    required this.scope,
    required this.periodMode,
    required this.rangeFrom,
    required this.rangeTo,
  });

  final String scope;
  final String periodMode;
  final String rangeFrom;
  final String rangeTo;

  static Future<LedgerFilterResult?> open(
    BuildContext context, {
    required String scope,
    required String periodMode,
    required String rangeFrom,
    required String rangeTo,
  }) {
    return Navigator.of(context).push<LedgerFilterResult>(
      MaterialPageRoute(
        builder: (_) => FilterPage(
          scope: scope,
          periodMode: periodMode,
          rangeFrom: rangeFrom,
          rangeTo: rangeTo,
        ),
      ),
    );
  }

  @override
  State<FilterPage> createState() => _FilterPageState();
}

class _FilterPageState extends State<FilterPage> {
  late String _scope;
  late String _period;
  late String _rangeFrom;
  late String _rangeTo;

  @override
  void initState() {
    super.initState();
    _scope = widget.scope;
    _period = widget.periodMode;
    _rangeFrom = widget.rangeFrom;
    _rangeTo = widget.rangeTo;
  }

  void _done() {
    Navigator.pop(
      context,
      LedgerFilterResult(scope: _scope, periodMode: _period, rangeFrom: _rangeFrom, rangeTo: _rangeTo),
    );
  }

  Future<void> _pickDate({required bool start}) async {
    final picked = await showLedgerDate(context, value: start ? _rangeFrom : _rangeTo);
    if (picked == null || !mounted) return;
    setState(() {
      if (start) {
        _rangeFrom = picked;
      } else {
        _rangeTo = picked;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(title: LedgerStrings.filter, onBack: _done),
                LedgerCard(
                  title: LedgerStrings.filterScope,
                  child: LedgerSegment(
                    labels: const [LedgerStrings.scopeMine, LedgerStrings.scopeFamily],
                    index: _scope == LedgerScope.mine ? 0 : 1,
                    onChanged: (i) => setState(() => _scope = i == 0 ? LedgerScope.mine : LedgerScope.family),
                  ),
                ),
                LedgerCard(
                  title: LedgerStrings.time,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      LedgerSegment(
                        labels: const [LedgerStrings.today, LedgerStrings.thisMonth, LedgerStrings.customRange],
                        index: _period == LedgerPeriodMode.today
                            ? 0
                            : _period == LedgerPeriodMode.month
                                ? 1
                                : 2,
                        onChanged: (i) => setState(() {
                          _period = i == 0
                              ? LedgerPeriodMode.today
                              : i == 1
                                  ? LedgerPeriodMode.month
                                  : LedgerPeriodMode.range;
                        }),
                      ),
                      if (_period == LedgerPeriodMode.range) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _pickDate(start: true),
                                child: Text(_rangeFrom, style: LedgerTextStyles.note),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text(LedgerStrings.rangeTo, style: LedgerTextStyles.note),
                            ),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _pickDate(start: false),
                                child: Text(_rangeTo, style: LedgerTextStyles.note),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                LedgerPillButton(label: LedgerStrings.done, onPressed: _done),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
