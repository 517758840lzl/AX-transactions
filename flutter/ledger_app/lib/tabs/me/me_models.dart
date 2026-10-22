abstract final class MeGender {
  static const female = 'female';
  static const male = 'male';
  static const secret = 'secret';
  static const values = <String>[female, male, secret];

  static String read(Object? raw) {
    final name = '$raw';
    for (final gender in values) {
      if (gender == name) return gender;
    }
    return secret;
  }
}

class MeTemplate {
  const MeTemplate({
    required this.id,
    required this.title,
    required this.amount,
    required this.direction,
    this.category = '',
    this.accountId = '',
    this.shared = false,
  });

  final String id;
  final String title;
  final double amount;
  final String direction;
  final String category;
  final String accountId;
  final bool shared;

  bool get isOut => direction == 'out';

  bool matches(MeTemplate other) {
    return title.trim() == other.title.trim() &&
        (amount * 100).round() == (other.amount * 100).round() &&
        direction == other.direction &&
        category == other.category &&
        accountId == other.accountId &&
        shared == other.shared;
  }
}

abstract final class MeStarter {
  static const categories = ['餐饮', '交通', '日用', '居住', '收入', '订阅', '娱乐'];
}
