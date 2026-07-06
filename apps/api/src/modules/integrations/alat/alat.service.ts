import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { alatDecrypt, alatEncrypt, parseAlatPipeResponse } from './alat-crypto.util';
import { AlatApiEnvelope, AlatAuthResponse, AlatBank, AlatNameEnquiryResult } from './alat.types';

const BANKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Fallback when ALAT is off or unreachable — keeps dev/mobile usable. */
const FALLBACK_BANKS: AlatBank[] = [
  { code: '000014', name: 'Access Bank', nibssCode: '000014' },
  { code: '000013', name: 'GTBank', nibssCode: '000013' },
  { code: '000016', name: 'First Bank of Nigeria', nibssCode: '000016' },
  { code: '000004', name: 'UBA', nibssCode: '000004' },
  { code: '000015', name: 'Zenith Bank', nibssCode: '000015' },
  { code: '000007', name: 'Fidelity Bank', nibssCode: '000007' },
  { code: '000018', name: 'Union Bank', nibssCode: '000018' },
  { code: '000017', name: 'Wema Bank', nibssCode: '000017' },
];

@Injectable()
export class AlatService {
  private readonly logger = new Logger(AlatService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt = 0;
  private banksCache: { banks: AlatBank[]; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<string>('ALAT_ENABLED', 'false') === 'true';
  }

  isLiveConfigured(): boolean {
    return (
      this.isEnabled() &&
      !!this.baseUrl() &&
      !!this.subscriptionKey() &&
      !!this.config.get<string>('ALAT_USERNAME') &&
      !!this.config.get<string>('ALAT_PASSWORD') &&
      !!this.config.get<string>('ALAT_VENDOR_ID') &&
      !!this.encryptionKey() &&
      !!this.encryptionIv()
    );
  }

  /** `disabled` | `awaiting_credentials` (keys only) | `live` */
  getStatus(): 'disabled' | 'awaiting_credentials' | 'live' {
    if (!this.isEnabled()) return 'disabled';
    if (this.isLiveConfigured()) return 'live';
    return 'awaiting_credentials';
  }

  hasSubscriptionKey(): boolean {
    return !!this.subscriptionKey();
  }

  async getBanks(): Promise<{ banks: AlatBank[]; source: 'alat' | 'fallback' }> {
    if (!this.isLiveConfigured()) {
      return { banks: FALLBACK_BANKS, source: 'fallback' };
    }

    if (this.banksCache && this.banksCache.expiresAt > Date.now()) {
      return { banks: this.banksCache.banks, source: 'alat' };
    }

    try {
      const raw = await this.request<unknown>('GET', '/api/WMServices/GetNIPBanks');
      const banks = this.normalizeBanks(raw);
      this.banksCache = { banks, expiresAt: Date.now() + BANKS_CACHE_TTL_MS };
      return { banks, source: 'alat' };
    } catch (err) {
      this.logger.warn(`GetNIPBanks failed, using fallback: ${(err as Error).message}`);
      return { banks: FALLBACK_BANKS, source: 'fallback' };
    }
  }

  async nameEnquiry(bankCode: string, accountNumber: string): Promise<AlatNameEnquiryResult> {
    const sessionId = uuidv4();
    const normalizedBank = bankCode.trim();
    const normalizedAccount = accountNumber.trim();

    if (!this.isLiveConfigured()) {
      throw new ServiceUnavailableException(
        'Name enquiry is not available. Set ALAT_ENABLED=true and configure ALAT credentials in .env',
      );
    }

    const payload = JSON.stringify({
      myDestinationBankCode: normalizedBank,
      myDestinationAccountNumber: normalizedAccount,
    });

    const encrypted = alatEncrypt(payload, this.encryptionKey(), this.encryptionIv());
    const envelope = await this.request<AlatApiEnvelope>('POST', '/api/WMServices/NIPNameEnquiry', {
      NameEnquiryRequest: encrypted,
    });

    const encryptedResponse =
      (typeof envelope === 'string' ? envelope : null) ??
      envelope.NameEnquiryResponse ??
      (envelope.result as string | undefined);

    if (!encryptedResponse || typeof encryptedResponse !== 'string') {
      if (envelope.hasError) {
        throw new BadGatewayException(
          envelope.errorMessages?.join('; ') || 'ALAT name enquiry failed',
        );
      }
      throw new BadGatewayException('Unexpected ALAT name enquiry response');
    }

    const decrypted = alatDecrypt(encryptedResponse, this.encryptionKey(), this.encryptionIv());
    const { code, value } = parseAlatPipeResponse(decrypted);

    return {
      accountNumber: normalizedAccount,
      accountName: code === '00' ? value : '',
      bankCode: normalizedBank,
      sessionId,
      responseCode: code,
      responseMessage: code === '00' ? 'Approved' : value || `Name enquiry failed (${code})`,
    };
  }

  private normalizeBanks(raw: unknown): AlatBank[] {
    const list = this.extractBankArray(raw);
    const banks = list
      .map((item) => {
        const record = item as Record<string, unknown>;
        const code = String(
          record.bankCode ?? record.BankCode ?? record.code ?? record.nipBankCode ?? '',
        ).trim();
        const name = String(
          record.bankName ?? record.BankName ?? record.name ?? record.bank ?? '',
        ).trim();
        if (!code || !name) return null;
        return { code, name, nibssCode: code };
      })
      .filter((b): b is AlatBank => b !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!banks.length) {
      throw new BadGatewayException('ALAT returned an empty bank list');
    }
    return banks;
  }

  private extractBankArray(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      for (const key of ['result', 'banks', 'data', 'BankList', 'nipBanks']) {
        if (Array.isArray(obj[key])) return obj[key] as unknown[];
      }
    }
    return [];
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl()}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [this.subscriptionHeader()]: this.subscriptionKey(),
    };

    const vendorId = this.config.get<string>('ALAT_VENDOR_ID');
    if (vendorId) headers.VendorID = vendorId;

    if (!path.includes('/Authentication/')) {
      headers.Authorization = `Bearer ${await this.getAccessToken()}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const msg =
        typeof parsed === 'object' && parsed && 'message' in (parsed as object)
          ? String((parsed as { message: string }).message)
          : text || response.statusText;
      throw new BadGatewayException(`ALAT ${method} ${path} failed (${response.status}): ${msg}`);
    }

    if (typeof parsed === 'object' && parsed && (parsed as AlatApiEnvelope).hasError) {
      const envelope = parsed as AlatApiEnvelope;
      throw new BadGatewayException(envelope.errorMessages?.join('; ') || 'ALAT request failed');
    }

    return parsed as T;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      try {
        await this.refreshAccessToken();
        if (this.accessToken) return this.accessToken;
      } catch {
        this.logger.warn('ALAT refresh token failed, re-authenticating');
      }
    }

    const username = this.config.get<string>('ALAT_USERNAME', '');
    const password = this.config.get<string>('ALAT_PASSWORD', '');
    const auth = await this.request<AlatAuthResponse>('POST', '/api/Authentication/authenticate', {
      username,
      password,
    });

    if (!auth.token) {
      throw new BadGatewayException('ALAT authentication did not return a token');
    }

    this.accessToken = auth.token;
    this.refreshToken = auth.refreshToken ?? null;
    this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) return;

    const auth = await this.request<AlatAuthResponse>('POST', '/api/Authentication/RefreshToken', {
      refreshToken: this.refreshToken,
    });

    if (!auth.token) {
      throw new BadGatewayException('ALAT token refresh failed');
    }

    this.accessToken = auth.token;
    this.refreshToken = auth.refreshToken ?? this.refreshToken;
    this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
  }

  private baseUrl(): string {
    return (this.config.get<string>('ALAT_BASE_URL') ?? '').replace(/\/$/, '');
  }

  private subscriptionKey(): string {
    return this.config.get<string>('ALAT_SUBSCRIPTION_KEY', '');
  }

  private subscriptionHeader(): string {
    return this.config.get<string>('ALAT_SUBSCRIPTION_HEADER', 'Ocp-Apim-Subscription-Key');
  }

  private encryptionKey(): string {
    return this.config.get<string>('ALAT_ENCRYPTION_KEY', '');
  }

  private encryptionIv(): string {
    return this.config.get<string>('ALAT_ENCRYPTION_IV', '');
  }
}
