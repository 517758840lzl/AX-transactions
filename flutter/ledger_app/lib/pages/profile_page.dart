import 'package:flutter/material.dart';
import '../l10n/ledger_strings.dart';
import '../tabs/me/me_models.dart';
import '../theme/ledger_colors.dart';
import '../theme/ledger_text_styles.dart';
import '../widgets/ledger_choice_row.dart';
import '../widgets/ledger_pill_button.dart';
import '../widgets/ledger_subpage_head.dart';

class ProfileSaveResult {
  const ProfileSaveResult({required this.nickname, required this.gender});

  final String nickname;
  final MeGender gender;
}

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.nickname, required this.gender});

  final String nickname;
  final MeGender gender;

  static Future<ProfileSaveResult?> open(BuildContext context, {required String nickname, required MeGender gender}) {
    return Navigator.of(context).push<ProfileSaveResult>(
      MaterialPageRoute(builder: (_) => ProfilePage(nickname: nickname, gender: gender)),
    );
  }

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final TextEditingController _nickname;
  late MeGender _gender;

  @override
  void initState() {
    super.initState();
    _nickname = TextEditingController(text: widget.nickname);
    _gender = widget.gender;
    _nickname.addListener(_refresh);
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _nickname.removeListener(_refresh);
    _nickname.dispose();
    super.dispose();
  }

  void _save() {
    final nickname = _nickname.text.trim();
    if (nickname.isEmpty) return;
    Navigator.pop(context, ProfileSaveResult(nickname: nickname.length > 12 ? nickname.substring(0, 12) : nickname, gender: _gender));
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
                LedgerSubpageHead(title: LedgerStrings.profileTitle, onBack: () => Navigator.pop(context)),
                const SizedBox(height: 8),
                Text(LedgerStrings.nicknameTitle, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: _nickname,
                  maxLength: 12,
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: LedgerStrings.profileHint,
                    filled: true,
                    fillColor: LedgerColors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(14)), borderSide: BorderSide(color: LedgerColors.line)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(14)), borderSide: BorderSide(color: LedgerColors.line)),
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  ),
                ),
                const SizedBox(height: 8),
                Text(LedgerStrings.gender, style: LedgerTextStyles.noteSemibold.copyWith(color: LedgerColors.ink, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                LedgerChoiceRow(
                  labels: const [LedgerStrings.genderFemale, LedgerStrings.genderMale, LedgerStrings.genderSecret],
                  index: _gender.index,
                  onChanged: (i) => setState(() => _gender = MeGender.values[i]),
                ),
                const SizedBox(height: 20),
                LedgerPillButton(label: LedgerStrings.save, onPressed: _nickname.text.trim().isEmpty ? null : _save),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
