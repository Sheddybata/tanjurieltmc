import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class FaceCaptureScreen extends ConsumerStatefulWidget {
  const FaceCaptureScreen({super.key});

  @override
  ConsumerState<FaceCaptureScreen> createState() => _FaceCaptureScreenState();
}

class _FaceCaptureScreenState extends ConsumerState<FaceCaptureScreen> {
  bool _isLoading = false;
  bool _captured = false;

  Future<void> _capture() async {
    setState(() => _isLoading = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    setState(() {
      _captured = true;
      _isLoading = false;
    });
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(kycRepositoryProvider).submitFaceCapture(imageBase64: 'demo_base64_image');
      if (mounted) context.go(RouteNames.kycStatus);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Face Capture')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text('Liveness Check', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Position your face within the frame. Ensure good lighting.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                child: _captured
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: AppColors.success, size: 64),
                          SizedBox(height: 16),
                          Text('Face captured successfully'),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.face_retouching_natural, size: 80, color: AppColors.primary.withValues(alpha: 0.5)),
                          const SizedBox(height: 16),
                          Text('Camera preview placeholder', style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),
            if (!_captured)
              AppButton(label: 'Capture Photo', isLoading: _isLoading, onPressed: _capture)
            else
              AppButton(label: 'Submit for Review', isLoading: _isLoading, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
