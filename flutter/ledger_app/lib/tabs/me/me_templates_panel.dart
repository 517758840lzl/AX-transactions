import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_card.dart';
import '../../widgets/money_amount.dart';
import 'me_models.dart';

class MeTemplatesPanel extends StatelessWidget {
  const MeTemplatesPanel({
    super.key,
    required this.templates,
    required this.mark,
    required this.onApply,
    required this.onRemove,
  });

  final List<MeTemplate> templates;
  final String mark;
  final ValueChanged<MeTemplate> onApply;
  final ValueChanged<String> onRemove;

  @override
  Widget build(BuildContext context) {
    return LedgerCard(
      title: LedgerStrings.templates,
      child: templates.isEmpty
          ? const Text(LedgerStrings.templateEmpty, style: LedgerTextStyles.note)
          : Column(
              children: [
                for (final template in templates)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Material(
                            color: LedgerColors.wash,
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              onTap: () => onApply(template),
                              borderRadius: BorderRadius.circular(14),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(template.title, style: LedgerTextStyles.cardTitle),
                                    MoneyAmount(
                                      value: template.isOut ? -template.amount : template.amount,
                                      mark: mark,
                                      size: MoneySize.sm,
                                      signed: true,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => onRemove(template.id),
                          icon: const Icon(Icons.close, size: 20),
                          tooltip: LedgerStrings.deleteEntry,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}
