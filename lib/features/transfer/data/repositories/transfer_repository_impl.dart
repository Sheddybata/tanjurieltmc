import 'package:tanjuriel_microfinance/core/constants/nibss_codes.dart';
import 'package:tanjuriel_microfinance/core/errors/app_exception.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/transfer/domain/repositories/transfer_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';

class TransferRepositoryImpl implements TransferRepository {
  TransferRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<BankModel>> getBanks() async {
    final response = await _api.get<Map<String, dynamic>>('/customer/transfers/banks');
    final body = response.data;
    if (body?['success'] != true) {
      throw NetworkException('Unable to load banks');
    }

    final data = body!['data'] as Map<String, dynamic>?;
    final banksRaw = data?['banks'] as List<dynamic>? ?? [];
    return banksRaw
        .map((e) => BankModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  @override
  Future<bool> isNameEnquiryAvailable() async {
    try {
      final response = await _api.get<Map<String, dynamic>>('/customer/app-config');
      final data = response.data?['data'] as Map<String, dynamic>?;
      return data?['nameEnquiryAvailable'] == true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<NameEnquiryResult> nameEnquiry({
    required String bankCode,
    required String accountNumber,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/customer/transfers/name-enquiry',
      data: {
        'bankCode': bankCode,
        'accountNumber': accountNumber,
      },
    );

    final body = response.data;
    if (body?['success'] != true) {
      final message = JsonUtils.parseString(body?['message'], fallback: 'Name enquiry failed');
      return NameEnquiryResult(
        accountNumber: accountNumber,
        accountName: '',
        bankCode: bankCode,
        sessionId: '',
        responseCode: NibssResponseCodes.invalidAccount,
        responseMessage: message,
      );
    }

    final data = Map<String, dynamic>.from(body!['data'] as Map);
    return NameEnquiryResult(
      accountNumber: JsonUtils.parseString(data['account_number'], fallback: accountNumber),
      accountName: JsonUtils.parseString(data['account_name']),
      bankCode: JsonUtils.parseString(data['bank_code'], fallback: bankCode),
      sessionId: JsonUtils.parseString(data['session_id']),
      responseCode: JsonUtils.parseString(data['response_code'], fallback: NibssResponseCodes.approved),
      responseMessage: 'Approved',
    );
  }

  @override
  Future<double> getTransferFee() async {
    try {
      final response = await _api.get<Map<String, dynamic>>('/customer/app-config');
      final data = response.data?['data'] as Map<String, dynamic>?;
      return (data?['transferFee'] as num?)?.toDouble() ?? 25;
    } catch (_) {
      return 25;
    }
  }

  @override
  Future<TransferResult> initiateTransfer(TransferRequest request) async {
    final accountId = request.accountId ?? AuthRepositoryImpl.currentUser?.accountId;

    if (accountId == null) {
      return TransferResult(
        reference: '',
        sessionId: request.sessionId,
        responseCode: NibssResponseCodes.systemMalfunction,
        responseMessage: 'Account not found. Please sign in again.',
        amount: request.amount,
        fee: 0,
        status: 'failed',
      );
    }

    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/customer/transfer-requests',
        data: {
          'accountId': accountId,
          'amount': request.amount,
          'beneficiaryBank': request.beneficiaryBankName ?? request.destinationBankCode,
          'beneficiaryAccount': request.destinationAccountNumber,
          'beneficiaryName': request.beneficiaryName ?? 'Beneficiary',
          'pin': request.pin,
          'narration': request.narration,
        },
      );

      final body = response.data;
      if (body?['success'] != true) {
        return TransferResult(
          reference: '',
          sessionId: request.sessionId,
          responseCode: '96',
          responseMessage: JsonUtils.parseString(body?['message'], fallback: 'Transfer request failed'),
          amount: request.amount,
          fee: 0,
          status: 'failed',
        );
      }

      final data = body!['data'] as Map<String, dynamic>;
      final fee = (data['fee'] as num?)?.toDouble() ?? await getTransferFee();
      return TransferResult(
        reference: JsonUtils.parseString(data['reference']),
        sessionId: request.sessionId,
        responseCode: '00',
        responseMessage: 'Transfer submitted for manager approval',
        amount: request.amount,
        fee: fee,
        status: 'pending',
      );
    } catch (e) {
      return TransferResult(
        reference: '',
        sessionId: request.sessionId,
        responseCode: '96',
        responseMessage: e.toString(),
        amount: request.amount,
        fee: 0,
        status: 'failed',
      );
    }
  }
}
