import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/shared/models/member_account.dart';

class ChildSavingsStatementUtil {
  ChildSavingsStatementUtil._();

  static Future<void> downloadAndShare(
    BuildContext context,
    ApiClient api,
    MemberAccount account,
  ) async {
    if (!account.isChildSavings) return;

    try {
      final bytes = await api.getBytes('/customer/accounts/${account.id}/child-savings/statement.pdf');
      if (bytes.isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Statement is empty or unavailable')),
          );
        }
        return;
      }

      final dir = await getTemporaryDirectory();
      final label = account.label?.replaceAll(RegExp(r'[^\w\s-]'), '').trim().replaceAll(' ', '-') ?? 'child';
      final file = File('${dir.path}/child-savings-$label.pdf');
      await file.writeAsBytes(bytes, flush: true);

      if (!context.mounted) return;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path, mimeType: 'application/pdf')],
          subject: 'Child Savings statement — ${account.label ?? account.accountNumber}',
        ),
      );
    } on DioException catch (e) {
      if (!context.mounted) return;
      final message = e.response?.statusMessage ?? e.message ?? 'Could not download statement';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }
}
