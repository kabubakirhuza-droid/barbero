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

class TelegramGatewayService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.telegramGatewayToken}`,
    };
  }

  /**
   * Send 6-digit verification code via Telegram Gateway API (@VerificationCodes)
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

      return {
        success: false,
        error: data?.error || "Telegram orqali kod yuborishda xatolik yuz berdi",
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.description ||
        err.message ||
        "Telegram Gateway bilan bog'lanishda xatolik";
      
      console.warn(`[TelegramGateway] sendVerificationMessage error:`, errorMsg);

      // User-friendly messages for known error cases
      let friendlyError = errorMsg;
      if (errorMsg.includes('PHONE_NUMBER_INVALID')) {
        friendlyError = "Telefon raqami noto'g'ri kiritilgan";
      } else if (errorMsg.includes('BALANCE_EXHAUSTED') || errorMsg.includes('INSUFFICIENT_FUNDS')) {
        friendlyError = "Telegram Gateway balansida mablag' yetarli emas";
      } else if (errorMsg.includes('FLOOD_WAIT') || errorMsg.includes('TOO_MANY_REQUESTS')) {
        friendlyError = "Juda ko'p so'rov yuborildi. Iltimos, 1 daqiqa kuting";
      }

      return {
        success: false,
        error: friendlyError,
      };
    }
  }

  /**
   * Check verification code status via Telegram Gateway API
   */
  async checkVerificationStatus(requestId: string, code: string): Promise<TelegramGatewayCheckResult> {
    try {
      const response = await axios.post(
        `${TELEGRAM_GATEWAY_BASE_URL}/checkVerificationStatus`,
        {
          request_id: requestId,
          code: code.trim(),
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

      return {
        success: false,
        codeValid: false,
        error: data?.error || 'Kodni tekshirishda xatolik',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.description ||
        err.message ||
        'Kodni tekshirishda xatolik';

      console.warn(`[TelegramGateway] checkVerificationStatus error:`, errorMsg);

      return {
        success: false,
        codeValid: false,
        error: errorMsg,
      };
    }
  }
}

export const telegramGateway = new TelegramGatewayService();
