import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_card.dart';
import '../../widgets/ledger_choice_row.dart';
import '../../widgets/money_amount.dart';
import 'me_settings_divider.dart';
import 'me_settings_row.dart';
import 'me_tab_state.dart';

class MeSettingsPanel extends StatelessWidget {
  const MeSettingsPanel({
    super.key,
    required this.state,
    required this.mark,
    required this.onBudgetTap,
    required this.onExport,
    required this.onImport,
    required this.onPrivacy,
    required this.onLocaleChanged,
    required this.onCurrencyChanged,
  });

  final MeTabState state;
  final String mark;
  final VoidCallback onBudgetTap;
  final VoidCallback onExport;
  final VoidCallback onImport;
  final VoidCallback onPrivacy;
  final ValueChanged<int> onLocaleChanged;
  final ValueChanged<int> onCurrencyChanged;

  @override
  Widget build(BuildContext context) {
    final budget = state.budget;
    return LedgerCard(
      child: Column(
        children: [
          MeSettingsRow(
            title: LedgerStrings.monthlyBudget,
            onTap: onBudgetTap,
            trailing: budget != null && budget > 0
                ? MoneyAmount(value: budget, mark: mark, size: MoneySize.sm)
                : const Text(LedgerStrings.budgetUnset, style: LedgerTextStyles.settingsValue),
          ),
          const MeSettingsDivider(),
          MeSettingsRow(title: LedgerStrings.exportData, onTap: onExport, trailing: const Text('›', style: LedgerTextStyles.chevron)),
          const MeSettingsDivider(),
          MeSettingsRow(title: LedgerStrings.importData, onTap: onImport, trailing: const Text('›', style: LedgerTextStyles.chevron)),
          const MeSettingsDivider(),
          MeSettingsRow(title: LedgerStrings.privacy, onTap: onPrivacy, trailing: const Text('›', style: LedgerTextStyles.chevron)),
          const MeSettingsDivider(),
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(LedgerStrings.language, style: LedgerTextStyles.noteSemibold),
            ),
          ),
          LedgerChoiceRow(labels: const ['中文', 'English'], index: state.localeIndex, onChanged: onLocaleChanged),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(LedgerStrings.currency, style: LedgerTextStyles.noteSemibold),
          ),
          const SizedBox(height: 8),
          LedgerChoiceRow(labels: MeTabState.currencies, index: state.currencyIndex, onChanged: onCurrencyChanged),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}
