abstract final class DashboardSliceColors {
  static const values = [
    '#E85D75',
    '#F4A261',
    '#E9C46A',
    '#C47B84',
    '#8D6E63',
    '#E8A0BF',
    '#B5838D',
    '#6B705C',
  ];

  static String at(int index) => values[index % values.length];
}
