import 'package:flutter/material.dart';

class TermsPrivacyScreen extends StatelessWidget {
  const TermsPrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Terms & Privacy')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Terms of use', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text(
            'By using the Tanjuriel mobile app you agree to operate your account in line with cooperative rules. '
            'Transfers, deposits, and loan disbursements may require staff approval. You are responsible for keeping your PIN confidential.',
          ),
          const SizedBox(height: 24),
          Text('Privacy', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text(
            'We collect BVN, NIN, phone number, and transaction data to comply with regulation and operate your account. '
            'Identity data is verified by branch staff. We do not sell customer data. Collateral photos submitted with loan applications are reviewed by authorised staff only.',
          ),
          const SizedBox(height: 24),
          Text('Data retention', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          const Text(
            'Account and transaction records are retained as required by applicable microfinance and cooperative regulations in Nigeria.',
          ),
        ],
      ),
    );
  }
}
