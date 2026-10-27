import 'package:flutter/material.dart';
import '../../l10n/ledger_strings.dart';
import '../../theme/ledger_colors.dart';
import '../../theme/ledger_text_styles.dart';
import '../../widgets/ledger_card.dart';
import '../../widgets/ledger_panel_link.dart';
import '../../widgets/ledger_pill_button.dart';

/// Web `.ledger-card` category block: seven starters, edit to remove a chip, a new-category field, and add.
class MeCategoriesPanel extends StatefulWidget {
  const MeCategoriesPanel({
    super.key,
    required this.categories,
    required this.onAdd,
    required this.onRemove,
  });

  final List<String> categories;
  final ValueChanged<String> onAdd;
  final ValueChanged<String> onRemove;

  @override
  State<MeCategoriesPanel> createState() => _MeCategoriesPanelState();
}

class _MeCategoriesPanelState extends State<MeCategoriesPanel> {
  var editing = false;
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LedgerCard(
      title: LedgerStrings.categories,
      trailing: LedgerPanelLink(
        large: true,
        label: editing ? LedgerStrings.done : LedgerStrings.edit,
        onPressed: () => setState(() => editing = !editing),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final name in widget.categories)
                _CategoryChip(
                  label: name,
                  editing: editing,
                  canRemove: widget.categories.length > 1,
                  onRemove: () => widget.onRemove(name),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    hintText: LedgerStrings.newCategory,
                    filled: true,
                    fillColor: LedgerColors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: LedgerColors.line)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    isDense: true,
                  ),
                  textInputAction: TextInputAction.done,
                  onSubmitted: _submit,
                ),
              ),
              const SizedBox(width: 8),
              ListenableBuilder(
                listenable: _controller,
                builder: (context, _) => LedgerPillButton(
                  compact: true,
                  label: LedgerStrings.add,
                  onPressed: _controller.text.trim().isEmpty ? null : _submit,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _submit([String? _]) {
    final name = _controller.text.trim();
    if (name.isEmpty) return;
    widget.onAdd(name);
    _controller.clear();
    setState(() {});
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.editing, required this.canRemove, required this.onRemove});

  final String label;
  final bool editing;
  final bool canRemove;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(14, 8, editing && canRemove ? 8 : 14, 8),
      decoration: BoxDecoration(
        color: LedgerColors.white,
        border: Border.all(color: editing ? LedgerColors.ink.withValues(alpha: 0.14) : LedgerColors.line),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: LedgerTextStyles.chipLabel.copyWith(fontWeight: FontWeight.w600)),
          if (editing && canRemove)
            InkWell(
              onTap: onRemove,
              child: const Padding(
                padding: EdgeInsets.only(left: 4),
                child: Text('×', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: LedgerColors.muted, height: 1)),
              ),
            ),
        ],
      ),
    );
  }
}
