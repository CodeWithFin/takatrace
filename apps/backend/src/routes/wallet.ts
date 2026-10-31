import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { db } from '../db/client';
import { initiateMpesaB2C } from '../services/mpesa';

const withdrawSchema = z.object({
  amount: z.number().min(10).max(150000),
});

export async function walletRoutes(app: FastifyInstance) {
  app.get('/balance', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };
    const [row] = await db`SELECT balance FROM users WHERE id = ${user.sub}`;
    return reply.send({ balance: parseFloat(row.balance) });
  });

  app.post('/withdraw', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string; phone: string };
    const body = withdrawSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ message: 'Invalid amount' });

    const { amount } = body.data;

    const [row] = await db`SELECT balance, phone_number FROM users WHERE id = ${user.sub}`;
    const balance = parseFloat(row.balance);

    if (balance < amount) {
      return reply.code(400).send({ message: 'Insufficient balance' });
    }

    const [tx] = await db`
      INSERT INTO transactions (user_id, amount, status)
      VALUES (${user.sub}, ${amount}, 'pending')
      RETURNING *
    `;

    await db`
      UPDATE users SET balance = balance - ${amount} WHERE id = ${user.sub}
    `;

    try {
      const receipt = await initiateMpesaB2C(row.phone_number, amount, tx.id);

      await db`
        UPDATE transactions
        SET status = 'completed', mpesa_receipt_number = ${receipt}
        WHERE id = ${tx.id}
      `;

      return reply.send({
        success: true,
        receipt,
        new_balance: balance - amount,
      });
    } catch (err: any) {
      await db`
        UPDATE transactions SET status = 'failed' WHERE id = ${tx.id}
      `;
      await db`
        UPDATE users SET balance = balance + ${amount} WHERE id = ${user.sub}
      `;

      return reply.code(500).send({ message: err.message || 'M-Pesa transfer failed' });
    }
  });

  app.get('/transactions', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };
    const txs = await db`
      SELECT * FROM transactions WHERE user_id = ${user.sub}
      ORDER BY timestamp DESC LIMIT 20
    `;
    return reply.send({
      transactions: txs.map((t) => ({
        ...t,
        amount: parseFloat(t.amount),
      })),
    });
  });
}
