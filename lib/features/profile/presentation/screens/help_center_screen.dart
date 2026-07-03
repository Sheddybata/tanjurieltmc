import 'package:flutter/material.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help Center')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('How can we help?', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          _HelpTile(
            title: 'Visit our branch',
            body: 'Head Office – Jos, Plateau State. Tellers can verify KYC, accept repayments, and assist with account issues.',
            icon: Icons.storefront_outlined,
          ),
          _HelpTile(
            title: 'Fund your account',
            body: 'Transfer to Tanjuriel settlement accounts and submit a deposit request with your payment reference.',
            icon: Icons.account_balance_outlined,
          ),
          _HelpTile(
            title: 'Transfers & loans',
            body: 'Outbound transfers and loan applications are reviewed by a manager before processing.',
            icon: Icons.pending_actions_outlined,
          ),
          _HelpTile(
            title: 'Contact',
            body: 'Phone: 0800-TANJURIEL (demo)\nEmail: support@tanjuriel.com',
            icon: Icons.support_agent_outlined,
          ),
          const SizedBox(height: 12),
          Text('${AppConstants.appName} — Thrift and Microcredit Cooperative LTD', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _HelpTile extends StatelessWidget {
  const _HelpTile({required this.title, required this.body, required this.icon});
  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(body),
        isThreeLine: true,
      ),
    );
  }
}
