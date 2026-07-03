import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/receipt_share_util.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/transfer_receipt_card.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';

class TransferSuccessScreen extends StatefulWidget {
  const TransferSuccessScreen({super.key, required this.result});

  final TransferResult result;

  @override
  State<TransferSuccessScreen> createState() => _TransferSuccessScreenState();
}

class _TransferSuccessScreenState extends State<TransferSuccessScreen> {
  final _receiptKey = GlobalKey();

  ReceiptData get _receiptData => ReceiptData.fromTransferResult(widget.result);

  Future<void> _shareReceipt() async {
    await ReceiptShareUtil.showShareOptions(
      context,
      boundaryKey: _receiptKey,
      data: _receiptData,
      fileBaseName: 'transfer_${widget.result.reference}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 24),
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_circle, color: AppColors.success, size: 56),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        result.isPending ? 'Transfer Submitted' : 'Transfer Successful',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      if (result.isPending)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            'Your transfer is pending manager approval. You will be notified when it is completed.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                      Text(
                        CurrencyFormatter.format(result.amount),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 24),
                      RepaintBoundary(
                        key: _receiptKey,
                        child: TransferReceiptCard(data: _receiptData),
                      ),
                    ],
                  ),
                ),
              ),
              AppButton(
                label: 'Share receipt',
                variant: AppButtonVariant.outline,
                onPressed: _shareReceipt,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Back to Home',
                onPressed: () => context.go(RouteNames.home),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
