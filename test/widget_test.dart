import 'package:flutter_test/flutter_test.dart';
import 'package:hua/main.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MoodLensApp());
    expect(find.text('Mood'), findsOneWidget);
  });
}
