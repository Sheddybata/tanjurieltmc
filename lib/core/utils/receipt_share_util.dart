import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';

class ReceiptData {
  const ReceiptData({
    required this.amount,
    required this.fee,
    required this.reference,
    required this.statusLabel,
    required this.dateTime,
    this.sessionId,
    this.beneficiaryName,
    this.beneficiaryAccount,
    this.beneficiaryBank,
    this.narration,
    this.title = 'Transfer Receipt',
    this.isPending = false,
  });

  final double amount;
  final double fee;
  final String reference;
  final String statusLabel;
  final DateTime dateTime;
  final String? sessionId;
  final String? beneficiaryName;
  final String? beneficiaryAccount;
  final String? beneficiaryBank;
  final String? narration;
  final String title;
  final bool isPending;

  factory ReceiptData.fromTransferResult(TransferResult result) {
    return ReceiptData(
      amount: result.amount,
      fee: result.fee,
      reference: result.reference,
      sessionId: result.sessionId,
      statusLabel: result.responseMessage,
      dateTime: result.createdAt ?? DateTime.now(),
      beneficiaryName: result.beneficiaryName,
      beneficiaryAccount: result.beneficiaryAccount,
      beneficiaryBank: result.beneficiaryBank,
      narration: result.narration,
      isPending: result.isPending,
    );
  }

  factory ReceiptData.fromTransaction(TransactionModel txn) {
    return ReceiptData(
      amount: txn.amount,
      fee: txn.fee,
      reference: txn.reference,
      sessionId: txn.sessionId,
      statusLabel: txn.status.label,
      dateTime: txn.createdAt,
      beneficiaryName: txn.recipientName,
      beneficiaryAccount: txn.recipientAccount,
      beneficiaryBank: txn.recipientBank,
      narration: txn.narration,
      title: 'Transaction Receipt',
      isPending: txn.status == TransactionStatus.pending,
    );
  }

  List<(String, String)> get rows {
    final items = <(String, String)>[
      ('Reference', reference),
      ('Date', DateFormat('dd MMM yyyy, HH:mm').format(dateTime)),
      ('Status', statusLabel),
    ];
    if (beneficiaryName != null && beneficiaryName!.isNotEmpty) {
      items.add(('Beneficiary', beneficiaryName!));
    }
    if (beneficiaryBank != null && beneficiaryBank!.isNotEmpty) {
      items.add(('Bank', beneficiaryBank!));
    }
    if (beneficiaryAccount != null && beneficiaryAccount!.isNotEmpty) {
      items.add(('Account', beneficiaryAccount!));
    }
    if (narration != null && narration!.isNotEmpty) {
      items.add(('Narration', narration!));
    }
    if (sessionId != null && sessionId!.isNotEmpty) {
      items.add(('Session ID', sessionId!));
    }
    if (fee > 0) {
      items.add(('Fee', CurrencyFormatter.format(fee)));
    }
    items.add(('Amount', CurrencyFormatter.format(amount)));
    return items;
  }
}

class ReceiptShareUtil {
  ReceiptShareUtil._();

  static Future<void> shareAsImage({
    required GlobalKey boundaryKey,
    required String fileName,
  }) async {
    final boundary = boundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return;

    final image = await boundary.toImage(pixelRatio: 3);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return;

    final file = await _writeTempFile('$fileName.png', byteData.buffer.asUint8List());
    await SharePlus.instance.share(
      ShareParams(files: [XFile(file.path)], subject: 'Receipt'),
    );
  }

  static Future<void> shareAsPdf({
    required ReceiptData data,
    required String fileName,
  }) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('dd MMM yyyy, HH:mm').format(data.dateTime);

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                AppConstants.appName,
                style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 4),
              pw.Text(data.title, style: const pw.TextStyle(fontSize: 12)),
              pw.SizedBox(height: 24),
              pw.Divider(),
              pw.SizedBox(height: 12),
              ...data.rows.map(
                (row) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.SizedBox(
                        width: 110,
                        child: pw.Text(row.$1, style: const pw.TextStyle(fontSize: 11)),
                      ),
                      pw.Expanded(
                        child: pw.Text(
                          row.$2,
                          style: pw.TextStyle(
                            fontSize: row.$1 == 'Amount' ? 14 : 11,
                            fontWeight: row.$1 == 'Amount' ? pw.FontWeight.bold : pw.FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              pw.Spacer(),
              pw.Text('Generated $dateStr', style: const pw.TextStyle(fontSize: 9)),
            ],
          );
        },
      ),
    );

    final bytes = await pdf.save();
    final file = await _writeTempFile('$fileName.pdf', bytes);
    await SharePlus.instance.share(
      ShareParams(files: [XFile(file.path)], subject: 'Receipt'),
    );
  }

  static Future<File> _writeTempFile(String name, Uint8List bytes) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$name');
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  static Future<void> showShareOptions(
    BuildContext context, {
    required GlobalKey boundaryKey,
    required ReceiptData data,
    required String fileBaseName,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('Share as image'),
              onTap: () async {
                Navigator.pop(ctx);
                await shareAsImage(boundaryKey: boundaryKey, fileName: fileBaseName);
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf_outlined),
              title: const Text('Share as PDF'),
              onTap: () async {
                Navigator.pop(ctx);
                await shareAsPdf(data: data, fileName: fileBaseName);
              },
            ),
          ],
        ),
      ),
    );
  }
}
