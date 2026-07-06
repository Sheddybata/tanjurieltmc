import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';

abstract class TransferRepository {
  Future<List<BankModel>> getBanks();
  Future<bool> isNameEnquiryAvailable();
  Future<NameEnquiryResult> nameEnquiry({
    required String bankCode,
    required String accountNumber,
  });
  Future<double> getTransferFee();
  Future<TransferResult> initiateTransfer(TransferRequest request);
}
