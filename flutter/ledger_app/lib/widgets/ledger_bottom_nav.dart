import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

class LedgerBottomNav extends StatelessWidget {
  const LedgerBottomNav({super.key, required this.index, required this.onChanged, required this.labels});

  final int index;
  final ValueChanged<int> onChanged;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: LedgerColors.white,
        border: const Border(top: BorderSide(color: LedgerColors.line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          child: Row(
            children: [
              for (var i = 0; i < labels.length; i++)
                Expanded(
                  child: _TabItem(
                    label: labels[i],
                    icon: _icons[i],
                    selected: i == index,
                    onTap: () => onChanged(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  static const _icons = [
    Icons.dashboard_customize_outlined,
    Icons.reorder,
    Icons.account_balance_wallet_outlined,
    Icons.person_outline,
  ];
}

class _TabItem extends StatelessWidget {
  const _TabItem({required this.label, required this.icon, required this.selected, required this.onTap});

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: selected ? const EdgeInsets.all(4) : EdgeInsets.zero,
              decoration: selected
                  ? BoxDecoration(color: LedgerColors.pink, borderRadius: BorderRadius.circular(8))
                  : null,
              child: Icon(icon, size: 22, color: selected ? LedgerColors.ink : LedgerColors.muted),
            ),
            const SizedBox(height: 4),
            Text(label, style: LedgerTextStyles.tabLabel.copyWith(color: selected ? LedgerColors.ink : LedgerColors.muted)),
          ],
        ),
      ),
    );
  }
}
