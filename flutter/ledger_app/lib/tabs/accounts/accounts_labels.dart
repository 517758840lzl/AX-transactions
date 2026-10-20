import '../../l10n/ledger_strings.dart';
import 'accounts_models.dart';

abstract final class AccountsLabels {
  static String accountKind(AccountKind kind) => switch (kind) {
        AccountKind.bank => LedgerStrings.accountKindBank,
        AccountKind.cash => LedgerStrings.accountKindCash,
        AccountKind.card => LedgerStrings.accountKindCard,
        AccountKind.other => LedgerStrings.accountKindOther,
      };

  static String holdingKind(HoldingKind kind) => switch (kind) {
        HoldingKind.stock => LedgerStrings.holdingKindStock,
        HoldingKind.etf => LedgerStrings.holdingKindEtf,
        HoldingKind.fund => LedgerStrings.holdingKindFund,
      };
}
