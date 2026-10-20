import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../widgets/ledger_panel.dart';
import '../../widgets/ledger_panel_link.dart';
import 'dashboard_category_chip.dart';
import 'dashboard_models.dart';

class DashboardCategoriesPanel extends StatelessWidget {
  const DashboardCategoriesPanel({
    super.key,
    required this.mark,
    required this.parts,
    required this.onOpenReport,
    required this.onPickCategory,
  });

  final String mark;
  final List<DashboardCategoryPart> parts;
  final VoidCallback onOpenReport;
  final ValueChanged<String> onPickCategory;

  @override
  Widget build(BuildContext context) {
    if (parts.isEmpty) return const SizedBox.shrink();
    return LedgerPanel(
      title: LedgerStrings.monthCategories,
      trailing: LedgerPanelLink(label: LedgerStrings.report, onPressed: onOpenReport),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (var i = 0; i < parts.length; i++) ...[
              if (i > 0) const SizedBox(width: 10),
              DashboardCategoryChip(part: parts[i], mark: mark, onTap: () => onPickCategory(parts[i].name)),
            ],
          ],
        ),
      ),
    );
  }
}
