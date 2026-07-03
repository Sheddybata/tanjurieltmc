import 'package:tanjuriel_microfinance/core/constants/nibss_codes.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/transfer/domain/repositories/transfer_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:uuid/uuid.dart';

class TransferRepositoryImpl implements TransferRepository {
  TransferRepositoryImpl(this._api);

  final ApiClient _api;

  static final _banks = [
    const BankModel(code: '044', name: 'Access Bank', nibssCode: '000014'),
    const BankModel(code: '058', name: 'GTBank', nibssCode: '000013'),
    const BankModel(code: '011', name: 'First Bank', nibssCode: '000016'),
    const BankModel(code: '033', name: 'UBA', nibssCode: '000004'),
    const BankModel(code: '057', name: 'Zenith Bank', nibssCode: '000015'),
    const BankModel(code: '070', name: 'Fidelity Bank', nibssCode: '000007'),
    const BankModel(code: '032', name: 'Union Bank', nibssCode: '000018'),
    const BankModel(code: '035', name: 'Wema Bank', nibssCode: '000017'),
  ];

  final _sessionCache = <String, NameEnquiryResult>{};

  @override
  Future<List<BankModel>> getBanks() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return _banks;
  }

  @override
  Future<NameEnquiryResult> nameEnquiry({
    required String bankCode,
    required String accountNumber,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));

    if (accountNumber == '0000000000') {
      return NameEnquiryResult(
        accountNumber: accountNumber,
        accountName: '',
        bankCode: bankCode,
        sessionId: '',
        responseCode: NibssResponseCodes.invalidAccount,
      );
    }

    final sessionId = const Uuid().v4();
    final result = NameEnquiryResult(
      accountNumber: accountNumber,
      accountName: 'ACCOUNT HOLDER',
      bankCode: bankCode,
      sessionId: sessionId,
      responseCode: NibssResponseCodes.approved,
    );

    _sessionCache[sessionId] = result;
    return result;
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
    final user = AuthRepositoryImpl.currentUser;
    final accountId = user?.accountId;

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

    final bank = _banks.firstWhere(
      (b) => b.code == request.destinationBankCode,
      orElse: () => _banks.first,
    );

    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/customer/transfer-requests',
        data: {
          'accountId': accountId,
          'amount': request.amount,
          'beneficiaryBank': bank.name,
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
          responseMessage: body?['message'] as String? ?? 'Transfer request failed',
          amount: request.amount,
          fee: 0,
          status: 'failed',
        );
      }

      final data = body!['data'] as Map<String, dynamic>;
      final fee = (data['fee'] as num?)?.toDouble() ?? await getTransferFee();
      return TransferResult(
        reference: data['reference'] as String? ?? '',
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
