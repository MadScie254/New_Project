import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

export class MpesaService {
  /**
   * Get OAuth access token from Daraja API
   */
  async getAccessToken(): Promise<string> {
    try {
      const consumerKey = process.env.MPESA_CONSUMER_KEY;
      const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

      if (!consumerKey || !consumerSecret) {
        throw new Error('M-Pesa credentials not configured.');
      }

      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

      const response = await axios.get(
        `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: { Authorization: `Basic ${auth}` },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      console.error('[M-Pesa] Failed to get access token:', error.message);
      throw new Error('Failed to authenticate with M-Pesa. Please try again.');
    }
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async initiateSTKPush(phone: string, amount: number, accountRef: string, description?: string) {
    try {
      const accessToken = await this.getAccessToken();
      const shortcode = process.env.MPESA_SHORTCODE || '174379';
      const passkey = process.env.MPESA_PASSKEY || '';
      const callbackUrl = process.env.MPESA_CALLBACK_URL || '';

      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .substring(0, 14);

      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

      // Normalize phone: remove + prefix if present
      const normalizedPhone = phone.startsWith('+') ? phone.substring(1) : phone;

      const payload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountRef,
        TransactionDesc: description || `Chama OS - ${accountRef}`,
      };

      const response = await axios.post(
        `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Store pending transaction
      const transaction = await prisma.mpesaTransaction.create({
        data: {
          checkout_request_id: response.data.CheckoutRequestID,
          merchant_request_id: response.data.MerchantRequestID,
          phone: normalizedPhone,
          amount,
          account_ref: accountRef,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseDescription: response.data.ResponseDescription,
        transactionId: transaction.id,
      };
    } catch (error: any) {
      console.error('[M-Pesa] STK Push failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment. Please try again.'
      );
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleCallback(body: any) {
    try {
      const { Body } = body;
      const { stkCallback } = Body;
      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
      } = stkCallback;

      const updateData: any = {
        merchant_request_id: MerchantRequestID,
        result_code: ResultCode,
        result_desc: ResultDesc,
        status: ResultCode === 0 ? 'SUCCESS' : 'FAILED',
      };

      // Extract metadata on success
      if (ResultCode === 0 && stkCallback.CallbackMetadata) {
        const items = stkCallback.CallbackMetadata.Item;
        for (const item of items) {
          switch (item.Name) {
            case 'MpesaReceiptNumber':
              updateData.mpesa_receipt = item.Value;
              break;
            case 'TransactionDate':
              updateData.transaction_date = new Date(
                item.Value.toString().replace(
                  /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                  '$1-$2-$3T$4:$5:$6'
                )
              );
              break;
          }
        }
      }

      // Update transaction record
      const transaction = await prisma.mpesaTransaction.update({
        where: { checkout_request_id: CheckoutRequestID },
        data: updateData,
      });

      return {
        success: ResultCode === 0,
        transaction,
      };
    } catch (error: any) {
      console.error('[M-Pesa] Callback processing failed:', error.message);
      throw new Error('Failed to process M-Pesa callback.');
    }
  }

  /**
   * Query STK Push transaction status
   */
  async queryTransactionStatus(checkoutRequestId: string) {
    try {
      const transaction = await prisma.mpesaTransaction.findUnique({
        where: { checkout_request_id: checkoutRequestId },
      });

      if (!transaction) {
        throw new Error('Transaction not found.');
      }

      return {
        status: transaction.status,
        mpesaReceipt: transaction.mpesa_receipt,
        amount: transaction.amount,
        resultDesc: transaction.result_desc,
      };
    } catch (error: any) {
      console.error('[M-Pesa] Query failed:', error.message);
      throw error;
    }
  }
}

export const mpesaService = new MpesaService();
