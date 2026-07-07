import { mockRequest } from './mock-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export interface ApiError {
  message: string;
  statusCode: number;
}

function formatApiMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join('. ');
  if (typeof message === 'string' && message.trim()) return message;
  return 'Request failed';
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = `${baseUrl}/api/v1`;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (USE_MOCK) {
      return mockRequest<T>(endpoint, options);
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const token = this.getToken();
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request(endpoint, options);
      }
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/staff/login';
      }
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/pdf')) {
      if (!response.ok) {
        throw {
          message: 'Request failed',
          statusCode: response.status,
        } as ApiError;
      }
      return response.blob() as Promise<T>;
    }

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: formatApiMessage(data.message ?? data.error),
        statusCode: response.status,
      } as ApiError;
    }

    return data;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const { data } = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  async downloadPdf(endpoint: string, filename: string): Promise<void> {
    const blob = await this.request<Blob>(endpoint, { method: 'GET' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient(API_URL);

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfile;
  };
}

export interface UserProfile {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'TELLER';
  branch?: { id: string; name: string; code: string };
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeAccounts: number;
  totalDepositsToday: number;
  totalWithdrawalsToday: number;
  activeLoans: number;
  overdueLoans: number;
  portfolioAtRisk: number;
  totalPortfolio: number;
  pendingApprovals: number;
  pendingDeposits: number;
  pendingTransfers: number;
  pendingWithdrawals: number;
  totalCustomerBalances: number;
}
