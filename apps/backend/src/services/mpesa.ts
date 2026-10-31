import axios from 'axios';

interface DarajaToken {
  access_token: string;
  expires_in: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getDarajaToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get<DarajaToken>(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  const { access_token, expires_in } = response.data;
  cachedToken = {
    token: access_token,
    expiresAt: Date.now() + (parseInt(expires_in) - 60) * 1000,
  };

  return access_token;
}

export async function initiateMpesaB2C(
  phoneNumber: string,
  amount: number,
  transactionId: string
): Promise<string> {
  if (!process.env.MPESA_CONSUMER_KEY) {
    console.log(`[DEV] M-Pesa B2C: ${phoneNumber} KES ${amount} tx:${transactionId}`);
    return `MOCK_RECEIPT_${Date.now()}`;
  }

  const token = await getDarajaToken();

  const initiatorPassword = process.env.MPESA_INITIATOR_PASSWORD!;
  const securityCredential = Buffer.from(initiatorPassword).toString('base64');

  const callbackUrl = process.env.MPESA_B2C_CALLBACK_URL || 'https://takatrace.app/api/mpesa/callback';

  const msisdn = phoneNumber.startsWith('0')
    ? `254${phoneNumber.slice(1)}`
    : phoneNumber.replace('+', '');

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
    {
      InitiatorName: process.env.MPESA_INITIATOR_NAME,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.floor(amount),
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: msisdn,
      Remarks: 'TakaTrace waste collection reward',
      QueueTimeOutURL: callbackUrl,
      ResultURL: callbackUrl,
      Occasion: transactionId,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const result = response.data;
  if (result.ResponseCode !== '0') {
    throw new Error(result.ResponseDescription || 'M-Pesa B2C failed');
  }

  return result.ConversationID || `DARAJA_${Date.now()}`;
}
