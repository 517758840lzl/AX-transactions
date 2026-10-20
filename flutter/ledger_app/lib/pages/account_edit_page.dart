import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/accounts/accounts_labels.dart';
import '../tabs/accounts/accounts_models.dart';
import '../tabs/accounts/accounts_sample_data.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_choice_row.dart';
import '../widgets/ledger_field.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class AccountEditResult {
  const AccountEditResult.saved(this.account) : deleted = false;
  const AccountEditResult.deleted() : account = null, deleted = true;

  final LedgerAccount? account;
  final bool deleted;
}

class AccountEditPage extends StatefulWidget {
  const AccountEditPage({super.key, this.account});

  final LedgerAccount? account;

  static Future<AccountEditResult?> open(BuildContext context, {LedgerAccount? account}) {
    return Navigator.of(context).push<AccountEditResult>(
      MaterialPageRoute(builder: (_) => AccountEditPage(account: account)),
    );
  }

  @override
  State<AccountEditPage> createState() => _AccountEditPageState();
}

class _AccountEditPageState extends State<AccountEditPage> {
  late final TextEditingController _name;
  late final TextEditingController _opening;
  late int _kindIndex;

  static const _kinds = AccountsSampleData.accountKindOrder;

  @override
  void initState() {
    super.initState();
    final account = widget.account;
    _name = TextEditingController(text: account?.name ?? '');
    _opening = TextEditingController(text: account == null ? '' : _trimAmount(account.opening));
    _kindIndex = account == null ? 1 : _kinds.indexOf(account.kind).clamp(0, _kinds.length - 1);
  }

  @override
  void dispose() {
    _name.dispose();
    _opening.dispose();
    super.dispose();
  }

  bool get _canSave {
    if (_name.text.trim().isEmpty) return false;
    return double.tryParse(_opening.text.trim()) != null;
  }

  void _save() {
    if (!_canSave) return;
    final opening = double.parse(_opening.text.trim());
    final existing = widget.account;
    Navigator.pop(
      context,
      AccountEditResult.saved(
        LedgerAccount(
          id: existing?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
          name: _name.text.trim(),
          opening: (opening * 100).roundToDouble() / 100,
          kind: _kinds[_kindIndex],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.account != null;
    return Scaffold(
      backgroundColor: LedgerColors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                LedgerSubpageHead(
                  title: editing ? LedgerStrings.editAccount : LedgerStrings.newAccount,
                  onBack: () => Navigator.pop(context),
                ),
                Text(LedgerStrings.accountName, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _name,
                  onChanged: (_) => setState(() {}),
                  decoration: ledgerFieldDecoration(LedgerStrings.accountNamePh),
                ),
                const SizedBox(height: 16),
                Text(LedgerStrings.accountKindLabel, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                LedgerChoiceRow(
                  labels: [for (final kind in _kinds) AccountsLabels.accountKind(kind)],
                  index: _kindIndex,
                  onChanged: (index) => setState(() => _kindIndex = index),
                ),
                const SizedBox(height: 16),
                Text(LedgerStrings.accountBalance, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _opening,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                  onChanged: (_) => setState(() {}),
                  decoration: ledgerFieldDecoration('0.00'),
                ),
                const SizedBox(height: 20),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _canSave ? _save : null),
                if (editing) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.pop(context, const AccountEditResult.deleted()),
                    child: Text(LedgerStrings.deleteAccount, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.budgetOver, fontWeight: FontWeight.w700)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _trimAmount(double value) {
    final text = value.toStringAsFixed(2);
    return text.endsWith('.00') ? text.substring(0, text.length - 3) : text;
  }
}
