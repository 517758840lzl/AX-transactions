import 'package:flutter/material.dart';
import '../data/ledger_view_filter.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_models.dart';
import '../tabs/dashboard/dashboard_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_field.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class TransferPage extends StatefulWidget {
  const TransferPage({super.key, required this.accounts});

  final List<LedgerAccount> accounts;

  static Future<List<DashboardEntry>?> open(BuildContext context, {required List<LedgerAccount> accounts}) {
    return Navigator.of(context).push<List<DashboardEntry>>(
      MaterialPageRoute(builder: (_) => TransferPage(accounts: accounts)),
    );
  }

  @override
  State<TransferPage> createState() => _TransferPageState();
}

class _TransferPageState extends State<TransferPage> {
  late String _fromId;
  late String _toId;
  late String _date;
  final _amount = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fromId = widget.accounts.first.id;
    _toId = widget.accounts.length > 1 ? widget.accounts[1].id : widget.accounts.first.id;
    _date = LedgerViewFilter.todayIso();
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  bool get _canSave {
    final amount = double.tryParse(_amount.text.trim());
    return widget.accounts.length >= 2 && _fromId != _toId && amount != null && amount > 0;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(_date) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked == null) return;
    setState(() => _date = LedgerViewFilter.todayIso(picked));
  }

  void _save() {
    if (!_canSave) return;
    final amount = (double.parse(_amount.text.trim()) * 100).roundToDouble() / 100;
    final from = widget.accounts.firstWhere((item) => item.id == _fromId);
    final to = widget.accounts.firstWhere((item) => item.id == _toId);
    final stamp = DateTime.now().microsecondsSinceEpoch;
    Navigator.pop(context, [
      DashboardEntry(
        id: 'transfer-$stamp-in',
        title: '${LedgerStrings.transferFrom} ${from.name}',
        amount: amount,
        direction: 'in',
        category: LedgerStrings.transferCategory,
        date: _date,
        accountName: to.name,
        accountId: to.id,
      ),
      DashboardEntry(
        id: 'transfer-$stamp-out',
        title: '${LedgerStrings.transferTo} ${to.name}',
        amount: amount,
        direction: 'out',
        category: LedgerStrings.transferCategory,
        date: _date,
        accountName: from.name,
        accountId: from.id,
      ),
    ]);
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
                LedgerSubpageHead(title: LedgerStrings.transferTitle, onBack: () => Navigator.pop(context)),
                Text(LedgerStrings.transferFrom, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                _accountMenu(_fromId, (id) => setState(() => _fromId = id)),
                const SizedBox(height: 16),
                Text(LedgerStrings.transferTo, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                _accountMenu(_toId, (id) => setState(() => _toId = id)),
                const SizedBox(height: 16),
                Text(LedgerStrings.amount, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _amount,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  onChanged: (_) => setState(() {}),
                  decoration: ledgerFieldDecoration('0.00'),
                ),
                const SizedBox(height: 16),
                Text(LedgerStrings.date, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                OutlinedButton(onPressed: _pickDate, child: Text(_date, style: LedgerTextStyles.note)),
                const SizedBox(height: 20),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _canSave ? _save : null),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _accountMenu(String selected, ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: selected,
      decoration: ledgerFieldDecoration(),
      items: [for (final account in widget.accounts) DropdownMenuItem(value: account.id, child: Text(account.name))],
      onChanged: (id) {
        if (id != null) onChanged(id);
      },
    );
  }
}
