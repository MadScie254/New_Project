import axios from 'axios';

const AT_BASE_URL = 'https://api.africastalking.com/version1/messaging';
const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging';

export class SMSService {
  private apiKey: string;
  private username: string;
  private isSandbox: boolean;

  constructor() {
    this.apiKey = process.env.AT_API_KEY || '';
    this.username = process.env.AT_USERNAME || 'sandbox';
    this.isSandbox = this.username === 'sandbox';
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // Format phone with + prefix
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      if (!this.apiKey) {
        console.log(`[SMS-MOCK] To: ${formattedPhone} | Message: ${message}`);
        return true;
      }

      const url = this.isSandbox ? AT_SANDBOX_URL : AT_BASE_URL;

      const response = await axios.post(
        url,
        new URLSearchParams({
          username: this.username,
          to: formattedPhone,
          message,
          from: 'CHAMAOS',
        }).toString(),
        {
          headers: {
            apiKey: this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );

      const recipients = response.data?.SMSMessageData?.Recipients;
      if (recipients && recipients.length > 0) {
        console.log(`[SMS] Sent to ${formattedPhone}: ${recipients[0].status}`);
        return recipients[0].status === 'Success';
      }

      return false;
    } catch (error: any) {
      console.error(`[SMS] Failed to send to ${phone}:`, error.message);
      return false;
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
      const success = await this.sendSMS(phone, message);
      if (success) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  /**
   * Send contribution reminder
   */
  async sendContributionReminder(phone: string, chamaName: string, amount: string, dueDate: string) {
    const message = `Chama OS: Reminder - Your contribution of ${amount} to ${chamaName} is due on ${dueDate}. Pay via the app to avoid penalties.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Send loan approval notification
   */
  async sendLoanApproval(phone: string, amount: string, chamaName: string) {
    const message = `Chama OS: Your loan of ${amount} from ${chamaName} has been approved! Funds will be disbursed shortly.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Send contribution confirmation
   */
  async sendContributionConfirmation(phone: string, amount: string, chamaName: string, mpesaRef: string) {
    const message = `Chama OS: Confirmed! ${amount} received for ${chamaName}. Ref: ${mpesaRef}. Thank you!`;
    return this.sendSMS(phone, message);
  }

  /**
   * Send OTP
   */
  async sendOTP(phone: string, otp: string) {
    const message = `Chama OS: Your verification code is ${otp}. Valid for 10 minutes. Do not share.`;
    return this.sendSMS(phone, message);
  }
}

export const smsService = new SMSService();
