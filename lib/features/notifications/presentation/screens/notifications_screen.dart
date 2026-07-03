import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.get<Map<String, dynamic>>('/customer/notifications?limit=50');
      final data = (res.data?['data'] as List<dynamic>?) ?? [];
      if (mounted) {
        setState(() {
          _items = data.cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openNotification(Map<String, dynamic> item) async {
    final id = item['id'] as String?;
    if (id != null && item['isRead'] != true) {
      try {
        await ref.read(apiClientProvider).patch('/customer/notifications/$id/read');
        setState(() {
          final index = _items.indexWhere((n) => n['id'] == id);
          if (index >= 0) _items[index] = {..._items[index], 'isRead': true};
        });
      } catch (_) {}
    }

    if (!mounted) return;
    final entityType = item['entityType'] as String?;
    final entityId = item['entityId'] as String?;
    if (entityType == 'LOAN' && entityId != null) {
      context.push('/loans/$entityId');
      return;
    }
    if (entityType == 'TRANSACTION' && entityId != null) {
      context.push('/transactions/$entityId');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No notifications yet'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      final isRead = item['isRead'] as bool? ?? false;
                      return ListTile(
                        onTap: () => _openNotification(item),
                        tileColor: isRead
                            ? null
                            : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        title: Text(item['title'] as String? ?? ''),
                        subtitle: Text(item['body'] as String? ?? ''),
                        trailing: isRead ? null : const Icon(Icons.circle, size: 10),
                        isThreeLine: true,
                      );
                    },
                  ),
                ),
    );
  }
}
