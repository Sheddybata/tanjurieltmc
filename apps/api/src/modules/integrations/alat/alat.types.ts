export interface AlatBank {
  code: string;
  name: string;
  nibssCode: string;
}

export interface AlatNameEnquiryResult {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  sessionId: string;
  responseCode: string;
  responseMessage: string;
}

export interface AlatAuthResponse {
  token?: string;
  refreshToken?: string;
  hasError?: boolean;
  errorMessages?: string[];
}

export interface AlatApiEnvelope {
  hasError?: boolean;
  errorMessages?: string[];
  result?: unknown;
  NameEnquiryResponse?: string;
  FundTransferResponse?: string;
  [key: string]: unknown;
}
