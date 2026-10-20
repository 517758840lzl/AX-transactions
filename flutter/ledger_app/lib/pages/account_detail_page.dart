import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_book_math.dart';
import '../tabs/accounts/accounts_labels.dart';
import '../tabs/accounts/accounts_models.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_card.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';
import '../widgets/ledger_trend_line_painter.dart';
import '../widgets/money_amount.dart';
import 'account_edit_page.dart';

class AccountDetailResult {
  const AccountDetailResult({required this.id, this.account});

  final String id;
  final LedgerAccount? account;

  bool get deleted => account == null;
}

class AccountDetailPage extends StatefulWidget {
  const AccountDetailPage({
    super.key,
    required this.account,
    required this.entries,
    required this.mark,
    required this.windowDays,
  });

  final LedgerAccount account;
  final List<DashboardEntry> entries;
  final String mark;
  final int windowDays;

  static Future<AccountDetailResult?> open(
    BuildContext context, {
    required LedgerAccount account,
    required List<DashboardEntry> entries,
    required String mark,
    required int windowDays,
  }) {
    return Navigator.of(context).push<AccountDetailResult>(
      MaterialPageRoute(
        builder: (_) => AccountDetailPage(account: account, entries: entries, mark: mark, windowDays: windowDays),
      ),
    );
  }

  @override
  State<AccountDetailPage> createState() => _AccountDetailPageState();
}

class _AccountDetailPageState extends State<AccountDetailPage> {
  late LedgerAccount _account;

  @override
  void initState() {
    super.initState();
    _account = widget.account;
  }

  Future<void> _edit() async {
    final result = await AccountEditPage.open(context, account: _account);
    if (!mounted || result == null) return;
    if (result.deleted) {
      Navigator.pop(context, AccountDetailResult(id: _account.id));
      return;
    }
    setState(() => _account = result.account!);
  }

  @override
  Widget build(BuildContext context) {
    final total = AccountsBookMath.accountTotal(_account, widget.entries);
    final from = AccountsBookMath.windowStartIso(widget.windowDays);
    final prior = AccountsBookMath.accountBalanceOnDate(_account, widget.entries, AccountsBookMath.isoBefore(from));
    final delta = total - prior;
    final today = _today();
    var inflow = 0.0;
    var outflow = 0.0;
    for (final entry in widget.entries) {
      if (entry.accountId != _account.id || entry.date.compareTo(from) < 0 || entry.date.compareTo(today) > 0) continue;
      if (entry.isOut) {
        outflow += entry.amount;
      } else {
        inflow += entry.amount;
      }
    }
    final series = AccountsBookMath.windowSnapshot([_account], widget.entries, const [], widget.windowDays).amounts;

    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(title: _account.name, onBack: () => Navigator.pop(context, AccountDetailResult(id: _account.id, account: _account))),
                LedgerCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AccountsLabels.accountKind(_account.kind), style: LedgerTextStyles.note),
                      MoneyAmount(value: total, mark: widget.mark, size: MoneySize.hero),
                      const SizedBox(height: 8),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 6,
                        children: [
                          Text(LedgerStrings.accountPeriodDelta, style: LedgerTextStyles.note),
                          MoneyAmount(value: delta, mark: widget.mark, size: MoneySize.sm, signed: true),
                          Text(AccountsBookMath.formatPct(delta, prior), style: delta >= 0 ? LedgerTextStyles.listDeltaUp : LedgerTextStyles.listDeltaDown),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 4,
                        children: [
                          Text(LedgerStrings.accountPeriodNet, style: LedgerTextStyles.note),
                          MoneyAmount(value: inflow - outflow, mark: widget.mark, size: MoneySize.sm, signed: true),
                          Text('· ${LedgerStrings.periodIncome}', style: LedgerTextStyles.note),
                          MoneyAmount(value: inflow, mark: widget.mark, size: MoneySize.sm),
                          Text('· ${LedgerStrings.periodSpend}', style: LedgerTextStyles.note),
                          MoneyAmount(value: outflow, mark: widget.mark, size: MoneySize.sm),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 120,
                        width: double.infinity,
                        child: CustomPaint(painter: LedgerTrendLinePainter(amounts: series)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                LedgerPillButton(label: LedgerStrings.editAccount, onPressed: _edit),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _today() {
    final now = DateTime.now();
    return '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }
}
