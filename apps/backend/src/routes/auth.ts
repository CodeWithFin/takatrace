import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';

const sendOtpSchema = z.object({ phone_number: z.string().min(10).max(15) });
const verifyOtpSchema = z.object({
  phone_number: z.string().min(10).max(15),
  otp: z.string().length(6),
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/otp/send', async (req, reply) => {
    const body = sendOtpSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ message: 'Invalid phone number' });

    const { phone_number } = body.data;
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db`
      INSERT INTO otp_codes (phone_number, code, expires_at)
      VALUES (${phone_number}, ${otp}, ${expiresAt})
    `;

    // In production: send SMS via Africa's Talking / Twilio
    // For dev we return the OTP directly
    const isDev = process.env.NODE_ENV !== 'production';
    app.log.info(`OTP for ${phone_number}: ${otp}`);

    return reply.code(200).send({
      message: 'OTP sent',
      ...(isDev && { debug_otp: otp }),
    });
  });

  app.post('/otp/verify', async (req, reply) => {
    const body = verifyOtpSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ message: 'Invalid request' });

    const { phone_number, otp } = body.data;

    const [record] = await db`
      SELECT * FROM otp_codes
      WHERE phone_number = ${phone_number}
        AND code = ${otp}
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!record) {
      return reply.code(401).send({ message: 'Invalid or expired OTP' });
    }

    await db`UPDATE otp_codes SET used = true WHERE id = ${record.id}`;

    let [user] = await db`
      SELECT * FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      [user] = await db`
        INSERT INTO users (phone_number) VALUES (${phone_number}) RETURNING *
      `;
    }

    const token = app.jwt.sign({
      sub: user.id,
      phone: user.phone_number,
    });

    return reply.code(200).send({
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        balance: parseFloat(user.balance),
      },
    });
  });
}
