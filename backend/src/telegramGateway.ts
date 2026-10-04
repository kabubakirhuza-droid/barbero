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
  if (lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('invalid_token')) {
    return 'Xizmat vaqtincha ishlamayapti';
  }
  if (lower.includes('flood') || lower.includes('too many') || lower.includes('rate limit') || lower.includes('429')) {
    return "Juda ko'p urinish. Iltimos, keyinroq qayta urinib ko'ring";
  }
  if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('not found') || lower.includes('not_registered') || lower.includes('user_not_found'))) {
    return "Telegram'da bu raqam topilmadi";
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('timeout') || lower.includes('enotfound') || lower.includes('503')) {
    return "Tarmoqda xatolik yuz berdi. Iltimos, internet aloqasini tekshiring";
  }
  return "Telegram orqali kod yuborishda xatolik yuz berdi";
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
   * Strictly communicates with upstream API - no fallback mock codes.
   */
  async sendVerificationMessage(phoneNumber: string): Promise<TelegramGatewaySendResult> {
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
        return {
          success: true,
          requestId: data.result.request_id,
          details: data.result,
        };
      }

      const rawError = data?.error || 'Telegram Gateway javob bermadi';
      console.warn(`[TelegramGateway] sendVerificationMessage upstream error for ${phoneNumber}: ${rawError}`);
      return {
        success: false,
        error: mapTelegramErrorMessage(rawError),
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.description ||
        err.message ||
        "Telegram Gateway bilan bog'lanishda xatolik";

      console.warn(`[TelegramGateway] sendVerificationMessage connection error for ${phoneNumber}: ${errorMsg}`);
      return {
        success: false,
        error: mapTelegramErrorMessage(errorMsg),
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

        return {
          success: true,
          codeValid,
          statusType,
        };
      }

      const rawError = data?.error || 'Kodni tekshirishda xatolik';
      return {
        success: false,
        codeValid: false,
        error: mapTelegramErrorMessage(rawError),
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.description ||
        err.message ||
        'Kodni tekshirishda xatolik';

      console.warn(`[TelegramGateway] checkVerificationStatus error for req ${requestId}: ${errorMsg}`);

      return {
        success: false,
        codeValid: false,
        error: mapTelegramErrorMessage(errorMsg),
      };
    }
  }
}

export const telegramGateway = new TelegramGatewayService();
