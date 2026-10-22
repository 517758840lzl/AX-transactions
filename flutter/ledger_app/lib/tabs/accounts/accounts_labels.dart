import '../../l10n/ledger_strings.dart';
import 'accounts_models.dart';

abstract final class AccountsLabels {
  static String accountKind(String kind) {
    if (kind == AccountKind.bank) return LedgerStrings.accountKindBank;
    if (kind == AccountKind.card) return LedgerStrings.accountKindCard;
    if (kind == AccountKind.other) return LedgerStrings.accountKindOther;
    return LedgerStrings.accountKindCash;
  }

  static String holdingKind(String kind) {
    if (kind == HoldingKind.etf) return LedgerStrings.holdingKindEtf;
    if (kind == HoldingKind.fund) return LedgerStrings.holdingKindFund;
    return LedgerStrings.holdingKindStock;
  }
}
