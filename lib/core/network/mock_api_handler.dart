import 'package:dio/dio.dart';
import 'package:tanjuriel_microfinance/core/config/app_config.dart';

/// In-memory demo API — mirrors seed data for offline mobile testing.
class MockApiHandler {
  MockApiHandler._();

  static const _customerId = 'mock-customer-001';
  static const _accountId = 'mock-account-001';

  static final List<Map<String, dynamic>> _loans = _seedLoans();
  static int _loanCounter = 2;

  static List<Map<String, dynamic>> _seedLoans() {
    final now = DateTime.now();
    return [
      {
        'id': 'mock-loan-active',
        'loanNumber': 'LN-MOCK-001',
        'status': 'ACTIVE',
        'principalAmount': 100000,
        'interestRate': 0.025,
        'tenureMonths': 6,
        'monthlyPayment': 18500,
        'totalRepayable': 111000,
        'outstandingBalance': 74000,
        'purpose': 'Working capital',
        'collateral': 'Shop equipment and inventory',
        'collateralType': 'EQUIPMENT',
        'collateralEstimatedValue': 150000,
        'collateralVerifiedAt': now.subtract(const Duration(days: 40)).toIso8601String(),
        'guarantorName': 'Ibrahim Musa',
        'guarantorPhone': '08076543210',
        'submittedAt': now.subtract(const Duration(days: 45)).toIso8601String(),
        'disbursedAt': now.subtract(const Duration(days: 30)).toIso8601String(),
        'product': {'name': 'SME Working Capital', 'code': 'SME-001'},
        'schedules': List.generate(6, (i) {
          final due = now.add(Duration(days: 30 * (i + 1) - 30));
          final paid = i < 2;
          return {
            'id': 'mock-sched-active-$i',
            'installmentNumber': i + 1,
            'dueDate': due.toIso8601String(),
            'principalDue': 15000,
            'interestDue': 3500,
            'totalDue': 18500,
            'paidAmount': paid ? 18500 : 0,
            'isPaid': paid,
          };
        }),
      },
    ];
  }

  static List<Map<String, dynamic>> _loanProducts() {
    return [
      {
        'id': 'mock-product-sme',
        'code': 'SME-001',
        'name': 'SME Working Capital',
        'description': 'Short-term working capital for small businesses',
        'minAmount': 50000,
        'maxAmount': 5000000,
        'minTenureMonths': 3,
        'maxTenureMonths': 24,
        'interestRate': 0.025,
        'processingFee': 2500,
        'requiresCollateral': true,
      },
      {
        'id': 'mock-product-personal',
        'code': 'PERS-001',
        'name': 'Personal Micro Loan',
        'description': 'Personal loans for salaried and self-employed clients',
        'minAmount': 10000,
        'maxAmount': 500000,
        'minTenureMonths': 1,
        'maxTenureMonths': 12,
        'interestRate': 0.03,
        'processingFee': 500,
        'requiresCollateral': true,
      },
    ];
  }

  static Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final normalized = _normalizePath(path);

    switch (normalized) {
      case '/customer/me':
        return _response(_customerPayload());
      case '/customer/app-config':
        return _response({'success': true, 'data': {'transferFee': 25, 'pinLength': 4, 'currency': 'NGN'}});
      case '/customer/transactions':
        return _response({'success': true, 'data': _transactions()});
      case '/customer/settlement-accounts':
        return _response({'success': true, 'data': _settlementAccounts()});
      case '/customer/loan-products':
        return _response({'success': true, 'data': _loanProducts()});
      case '/customer/loans':
        return _response({'success': true, 'data': _loans});
      default:
        if (normalized.startsWith('/customer/notifications')) {
          return _response({'success': true, 'data': _notifications()});
        }
        if (normalized.startsWith('/customer/loans/')) {
          final id = normalized.split('/').last;
          final loan = _loans.cast<Map<String, dynamic>?>().firstWhere(
                (l) => l?['id'] == id,
                orElse: () => null,
              );
          if (loan == null) {
            throw DioException(
              requestOptions: RequestOptions(path: path),
              message: 'Loan not found',
            );
          }
          return _response({'success': true, 'data': loan});
        }
        throw DioException(
          requestOptions: RequestOptions(path: path),
          message: 'Mock API: unhandled GET $path',
        );
    }
  }

  static Future<Response<T>> post<T>(
    String path, {
    dynamic data,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final normalized = _normalizePath(path);
    final body = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};

    switch (normalized) {
      case '/customer/auth/login':
        return _response(_login(body));
      case '/customer/auth/register':
        return _response(_register(body));
      case '/customer/auth/logout':
        return _response({'success': true});
      case '/customer/deposit-requests':
        return _response({
          'success': true,
          'data': {
            'id': 'mock-deposit-${DateTime.now().millisecondsSinceEpoch}',
            'reference': 'DEP-MOCK-${DateTime.now().millisecondsSinceEpoch}',
            'status': 'PENDING',
          },
        });
      case '/customer/transfer-requests':
        return _response({
          'success': true,
          'data': {
            'id': 'mock-transfer-${DateTime.now().millisecondsSinceEpoch}',
            'reference': 'TRF-MOCK-${DateTime.now().millisecondsSinceEpoch}',
            'status': 'PENDING',
            'fee': 25,
          },
        });
      case '/customer/loans/apply':
        return _response(_applyLoan(body));
      default:
        throw DioException(
          requestOptions: RequestOptions(path: path),
          message: 'Mock API: unhandled POST $path',
        );
    }
  }

  static Future<Response<T>> patch<T>(String path, {dynamic data}) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final normalized = _normalizePath(path);
    if (normalized.contains('/customer/notifications/') && normalized.endsWith('/read')) {
      return _response({'success': true});
    }
    throw DioException(
      requestOptions: RequestOptions(path: path),
      message: 'Mock API: unhandled PATCH $path',
    );
  }

  static String _normalizePath(String path) {
    final uri = Uri.parse(path);
    return uri.path;
  }

  static bool _isBlank(dynamic value) {
    final text = (value as String?)?.trim();
    return text == null || text.isEmpty;
  }

  static Map<String, dynamic> _applyLoan(Map<String, dynamic> body) {
    final pin = (body['pin'] as String?)?.trim() ?? '';
    if (pin != AppConfig.demoPin) {
      return {'success': false, 'message': 'Invalid PIN'};
    }

    final productId = body['productId'] as String? ?? 'mock-product-personal';
    final product = _loanProducts().firstWhere(
      (p) => p['id'] == productId,
      orElse: () => _loanProducts().first,
    );
    final amount = (body['principalAmount'] as num?)?.toDouble() ?? 50000;
    final tenure = (body['tenureMonths'] as num?)?.toInt() ?? 6;
    if (_isBlank(body['collateral'])) {
      return {'success': false, 'message': 'Collateral description is required'};
    }
    if (_isBlank(body['guarantorName']) || _isBlank(body['guarantorPhone'])) {
      return {'success': false, 'message': 'Guarantor name and phone are required'};
    }
    final rate = (product['interestRate'] as num).toDouble();
    final monthly = (amount * (1 + rate * tenure)) / tenure;
    final total = monthly * tenure;

    _loanCounter++;
    final id = 'mock-loan-$_loanCounter';
    final loan = {
      'id': id,
      'loanNumber': 'LN-MOCK-$_loanCounter',
      'status': 'SUBMITTED',
      'principalAmount': amount,
      'interestRate': rate,
      'tenureMonths': tenure,
      'monthlyPayment': monthly.roundToDouble(),
      'totalRepayable': total.roundToDouble(),
      'outstandingBalance': total.roundToDouble(),
      'purpose': body['purpose'],
      'collateral': body['collateral'],
      'collateralType': body['collateralType'] ?? 'EQUIPMENT',
      'collateralEstimatedValue': body['collateralEstimatedValue'],
      'collateralPhotoUrl': 'mock://collateral/$id.jpg',
      'guarantorName': body['guarantorName'],
      'guarantorPhone': body['guarantorPhone'],
      'submittedAt': DateTime.now().toIso8601String(),
      'disbursedAt': null,
      'product': {'name': product['name'], 'code': product['code']},
      'schedules': List.generate(tenure, (i) {
        final due = DateTime.now().add(Duration(days: 30 * (i + 1)));
        return {
          'id': 'mock-sched-$id-$i',
          'installmentNumber': i + 1,
          'dueDate': due.toIso8601String(),
          'principalDue': amount / tenure,
          'interestDue': monthly - (amount / tenure),
          'totalDue': monthly,
          'paidAmount': 0,
          'isPaid': false,
        };
      }),
    };
    _loans.insert(0, loan);
    return {'success': true, 'data': loan};
  }

  static Map<String, dynamic> _register(Map<String, dynamic> body) {
    final phone = (body['phone'] as String?)?.trim() ?? '';
    if (phone.isEmpty || (body['bvn'] as String?)?.length != 11 || (body['nin'] as String?)?.length != 11) {
      return {'success': false, 'message': 'Complete all required fields including BVN and NIN'};
    }

    return {
      'success': true,
      'data': {
        'accessToken': 'mock-access-token-new',
        'refreshToken': 'mock-refresh-token-new',
        'customer': {
          'id': 'mock-customer-new-${DateTime.now().millisecondsSinceEpoch}',
          'firstName': body['firstName'],
          'lastName': body['lastName'],
          'email': body['email'] ?? '',
          'phone': phone,
          'paymentRef': 'TJC-MOCKNEW',
          'kycStatus': 'PENDING',
          'bvn': body['bvn'],
          'nin': body['nin'],
          'registrationSource': 'MOBILE',
          'accounts': [
            {
              'id': 'mock-account-new',
              'accountNumber': 'TMFNEW001',
              'type': 'SAVINGS',
              'status': 'ACTIVE',
              'balance': 0,
              'availableBalance': 0,
            },
          ],
        },
      },
    };
  }

  static Map<String, dynamic> _login(Map<String, dynamic> body) {
    final phone = (body['phone'] as String?)?.trim() ?? '';
    final pin = (body['pin'] as String?)?.trim() ?? '';

    if (phone != AppConfig.demoPhone || pin != AppConfig.demoPin) {
      return {
        'success': false,
        'message': 'Invalid phone number or PIN',
      };
    }

    return {
      'success': true,
      'data': {
        'accessToken': 'mock-access-token',
        'refreshToken': 'mock-refresh-token',
        'customer': _customerPayload()['data'],
      },
    };
  }

  static Map<String, dynamic> _customerPayload() {
    return {
      'success': true,
      'data': {
        'id': _customerId,
        'firstName': 'Demo',
        'lastName': 'Customer',
        'email': 'demo.customer@tanjuriel.com',
        'phone': AppConfig.demoPhone,
        'paymentRef': 'TJC-CUSSEED001',
        'kycStatus': 'VERIFIED',
        'bvn': '22222222222',
        'nin': null,
        'accounts': [
          {
            'id': _accountId,
            'accountNumber': 'TMFSEED001',
            'type': 'SAVINGS',
            'status': 'ACTIVE',
            'balance': 25000,
            'availableBalance': 25000,
          },
        ],
      },
    };
  }

  static List<Map<String, dynamic>> _settlementAccounts() {
    return [
      {
        'provider': 'ZENITH',
        'bankName': 'Zenith Bank',
        'accountName': 'Tanjuriel Thrift and Microcredit Cooperative LTD',
        'accountNumber': '1234567890',
        'instructions': 'Use your payment reference in the transfer narration.',
      },
      {
        'provider': 'OPAY',
        'bankName': 'Opay',
        'accountName': 'Tanjuriel Thrift and Microcredit Cooperative LTD',
        'accountNumber': '8012345678',
        'instructions': 'Use your payment reference in the transfer narration.',
      },
      {
        'provider': 'MONIEPOINT',
        'bankName': 'Moniepoint',
        'accountName': 'Tanjuriel Thrift and Microcredit Cooperative LTD',
        'accountNumber': '9876543210',
        'instructions': 'Use your payment reference in the transfer narration.',
      },
    ];
  }

  static List<Map<String, dynamic>> _transactions() {
    final now = DateTime.now();
    return [
      {
        'id': 'mock-txn-1',
        'reference': 'TXN-MOCK-001',
        'type': 'DEPOSIT',
        'amount': 15000,
        'narration': 'Branch deposit',
        'status': 'COMPLETED',
        'createdAt': now.subtract(const Duration(days: 2)).toIso8601String(),
      },
      {
        'id': 'mock-txn-2',
        'reference': 'TXN-MOCK-002',
        'type': 'TRANSFER',
        'amount': 5000,
        'narration': 'Transfer to GTBank',
        'status': 'PENDING',
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
      },
    ];
  }

  static List<Map<String, dynamic>> _notifications() {
    return [
      {
        'id': 'mock-notif-1',
        'title': 'Welcome to Tanjuriel',
        'body': 'Your savings account is active. Visit our Jos branch for assistance.',
        'isRead': false,
        'type': 'GENERAL',
      },
      {
        'id': 'mock-notif-loan',
        'title': 'Loan application received',
        'body': 'Your SME Working Capital application is under manager review.',
        'isRead': false,
        'type': 'LOAN',
        'entityType': 'LOAN',
        'entityId': 'mock-loan-active',
      },
      {
        'id': 'mock-notif-2',
        'title': 'Demo mode',
        'body': 'You are viewing sample data. Connect Supabase to sync with the real API.',
        'isRead': true,
      },
    ];
  }

  static Response<T> _response<T>(Map<String, dynamic> data) {
    return Response<T>(
      requestOptions: RequestOptions(path: ''),
      data: data as T,
      statusCode: 200,
    );
  }
}
