import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tanjuriel_microfinance/app.dart';

void main() {
  testWidgets('App builds without error', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TanjurielApp()));
    await tester.pump();

    expect(find.byType(TanjurielApp), findsOneWidget);
  });
}
