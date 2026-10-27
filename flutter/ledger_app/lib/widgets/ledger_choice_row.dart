import 'package:flutter/material.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';

class LedgerChoiceRow extends StatelessWidget {
  const LedgerChoiceRow({
    super.key,
    required this.labels,
    required this.index,
    required this.onChanged,
    this.columns,
  });

  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  /// Wraps as a grid when a column count is set (currency and other long lists); otherwise one even row.
  final int? columns;

  @override
  Widget build(BuildContext context) {
    if (columns != null) {
      return GridView.builder(
        shrinkWrap: true,
        primary: false,
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: labels.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns!,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          mainAxisExtent: 44,
        ),
        itemBuilder: (context, i) => _ChoiceChip(
          label: labels[i],
          selected: i == index,
          onTap: () => onChanged(i),
        ),
      );
    }
    return Row(
      children: [
        for (var i = 0; i < labels.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: _ChoiceChip(label: labels[i], selected: i == index, onTap: () => onChanged(i)),
          ),
        ],
      ],
    );
  }
}

class _ChoiceChip extends StatelessWidget {
  const _ChoiceChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? LedgerColors.ink : LedgerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: selected ? LedgerColors.ink : LedgerColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: LedgerTextStyles.noteSemibold.copyWith(color: selected ? LedgerColors.white : LedgerColors.muted),
          ),
        ),
      ),
    );
  }
}
