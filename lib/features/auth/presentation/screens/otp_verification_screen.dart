import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_input_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

class OtpVerificationScreen extends ConsumerStatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  ConsumerState<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends ConsumerState<OtpVerificationScreen> {
  bool _isLoading = false;

  Future<void> _verify(String otp) async {
    setState(() => _isLoading = true);
    final success = await ref.read(authProvider.notifier).verifyOtp(otp);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success) {
      context.go(RouteNames.kycIntro);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid OTP. Use 123456 for demo.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final phone = ref.watch(authProvider).pendingPhone ?? 'your phone';

    return Scaffold(
      appBar: AppBar(title: const Text('Verify Phone')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enter verification code', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('We sent a 6-digit code to $phone', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 40),
            PinInputField(length: 6, onCompleted: _verify),
            const SizedBox(height: 24),
            if (_isLoading) const Center(child: CircularProgressIndicator()),
            const Spacer(),
            AppButton(
              label: 'Resend Code',
              variant: AppButtonVariant.outline,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('OTP resent (demo: 123456)')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
