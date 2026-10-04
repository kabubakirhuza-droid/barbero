import axios from 'axios';
import { config } from './config';

const TELEGRAM_GATEWAY_BASE_URL = 'https://gatewayapi.telegram.org';

export interface TelegramGatewaySendResult {
  success: boolean;
  requestId?: string;
  error?: string;
  details?: any;
}

export interface TelegramGatewayCheckResult {
  success: boolean;
  codeValid: boolean;
  statusType?: string;
  error?: string;
}

export function mapTelegramErrorMessage(rawError: string): string {
  const lower = String(rawError || '').toLowerCase();
  if (lower.includes('insufficient_funds') || lower.includes('balance') || lower.includes('payment_required')) {
    return "Xizmat hisobida mablag' yetarli emas. Iltimos, ma'muriyatga murojaat qiling";
  }
  if (lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('invalid_token') || lower.includes('401')) {
    return 'Xizmat vaqtincha ishlamayapti';
  }
  if (lower.includes('flood') || lower.includes('too many') || lower.includes('rate limit') || lower.includes('429')) {
    return "Juda ko'p urinish. Iltimos, birozdan so'ng qayta urinib ko'ring";
  }
  if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('not found') || lower.includes('not_registered') || lower.includes('user_not_found'))) {
    return "Telegram'da bu raqam topilmadi. Raqamda Telegram hisobi borligini tekshiring";
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('timeout') || lower.includes('enotfound') || lower.includes('503')) {
    return "Tarmoqda xatolik yuz berdi. Iltimos, internet aloqasini tekshiring";
  }
  return "Telegram orqali kod yuborishda xatolik yuz berdi";
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return '***';
  return `${phone.slice(0, 6)}***${phone.slice(-3)}`;
}

class TelegramGatewayService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.telegramGatewayToken}`,
    };
  }

  /**
   * Send 6-digit verification code via Telegram Gateway API (@VerificationCodes)
   * Strictly communicates with upstream API - logs full error details to server console without leaking tokens.
   */
  async sendVerificationMessage(phoneNumber: string): Promise<TelegramGatewaySendResult> {
    const masked = maskPhone(phoneNumber);
    try {
      const response = await axios.post(
        `${TELEGRAM_GATEWAY_BASE_URL}/sendVerificationMessage`,
        {
          phone_number: phoneNumber,
          code_length: 6,
          ttl: 60,
        },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data && data.ok && data.result) {
        console.log(`[TelegramGateway] sendVerificationMessage SUCCESS for ${masked} (reqId: ${data.result.request_id})`);
        return {
          success: true,
          requestId: data.result.request_id,
          details: data.result,
        };
      }

      const rawError = data?.error || data?.description || 'Telegram Gateway javob bermadi';
      console.error(`[TelegramGateway] sendVerificationMessage UPSTREAM REJECT for ${masked}:`, {
        error: rawError,
        ok: data?.ok,
        details: data?.result,
      });
      return {
        success: false,
        error: mapTelegramErrorMessage(rawError),
      };
    } catch (err: any) {
      const status = err.response?.status;
      const respData = err.response?.data;
      const rawError =
        respData?.error ||
        respData?.description ||
        err.message ||
        "Telegram Gateway bilan bog'lanishda xatolik";

      console.error(`[TelegramGateway] sendVerificationMessage ERROR for ${masked}:`, {
        httpStatus: status,
        upstreamError: respData?.error,
        upstreamDescription: respData?.description,
        systemMessage: err.message,
      });

      return {
        success: false,
        error: mapTelegramErrorMessage(rawError),
      };
    }
  }

  /**
   * Check verification code status strictly via Telegram Gateway API
   */
  async checkVerificationStatus(requestId: string, code: string): Promise<TelegramGatewayCheckResult> {
    const trimmedCode = code.trim();

    try {
      const response = await axios.post(
        `${TELEGRAM_GATEWAY_BASE_URL}/checkVerificationStatus`,
        {
          request_id: requestId,
          code: trimmedCode,
        },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data && data.ok && data.result) {
        const statusType =
          data.result.verification_status?.status ||
          data.result.status?.type ||
          data.result.status;
        const codeValid = statusType === 'code_valid';

        console.log(`[TelegramGateway] checkVerificationStatus for reqId ${requestId}: status=${statusType}, codeValid=${codeValid}`);

        return {
          success: true,
          codeValid,
          statusType,
        };
      }

      const rawError = data?.error || data?.description || 'Kodni tekshirishda xatolik';
      console.warn(`[TelegramGateway] checkVerificationStatus rejected reqId ${requestId}:`, {
        error: rawError,
      });
      return {
        success: false,
        codeValid: false,
        error: mapTelegramErrorMessage(rawError),
      };
    } catch (err: any) {
      const status = err.response?.status;
      const respData = err.response?.data;
      const rawError =
        respData?.error ||
        respData?.description ||
        err.message ||
        'Kodni tekshirishda xatolik';

      console.error(`[TelegramGateway] checkVerificationStatus ERROR for reqId ${requestId}:`, {
        httpStatus: status,
        upstreamError: respData?.error,
        upstreamDescription: respData?.description,
        systemMessage: err.message,
      });

      return {
        success: false,
        codeValid: false,
        error: mapTelegramErrorMessage(rawError),
      };
    }
  }
}

export const telegramGateway = new TelegramGatewayService();
