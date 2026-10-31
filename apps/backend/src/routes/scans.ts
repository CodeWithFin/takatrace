import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate';
import { db } from '../db/client';
import { classifyWaste } from '../services/aiClassifier';
import { uploadImage } from '../services/storage';

export async function scanRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };

    const data = await req.file();
    if (!data) return reply.code(400).send({ message: 'Image required' });

    const latitude = parseFloat((req.query as any).lat);
    const longitude = parseFloat((req.query as any).lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return reply.code(400).send({ message: 'GPS coordinates required' });
    }

    const imageBuffer = await data.toBuffer();
    const base64 = imageBuffer.toString('base64');
    const mimeType = data.mimetype;

    const classification = await classifyWaste(base64, mimeType);

    if (classification.confidence < 0.7) {
      return reply.code(422).send({
        message: 'Low confidence scan — please retake with better lighting',
        confidence: classification.confidence,
      });
    }

    const RATES: Record<string, number> = {
      'PET Plastic': 25,
      'HDPE Plastic': 20,
      'Aluminum': 50,
      'Glass': 15,
      'Cardboard': 10,
      'Mixed Plastic': 15,
    };

    const ratePerKg = RATES[classification.material_type] ?? 12;
    const creditValue = parseFloat((classification.estimated_weight * ratePerKg).toFixed(2));

    const imageUrl = await uploadImage(imageBuffer, mimeType, user.sub);

    const [scan] = await db`
      INSERT INTO scan_events (
        user_id, image_url, material_type, estimated_weight,
        latitude, longitude, credit_value, ai_confidence_score
      ) VALUES (
        ${user.sub}, ${imageUrl}, ${classification.material_type},
        ${classification.estimated_weight}, ${latitude}, ${longitude},
        ${creditValue}, ${classification.confidence}
      ) RETURNING *
    `;

    await db`
      UPDATE users SET balance = balance + ${creditValue} WHERE id = ${user.sub}
    `;

    const [updatedUser] = await db`SELECT balance FROM users WHERE id = ${user.sub}`;

    return reply.code(201).send({
      scan: {
        ...scan,
        credit_value: parseFloat(scan.credit_value),
        estimated_weight: parseFloat(scan.estimated_weight),
        ai_confidence_score: parseFloat(scan.ai_confidence_score),
      },
      new_balance: parseFloat(updatedUser.balance),
    });
  });

  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as { sub: string };

    const scans = await db`
      SELECT * FROM scan_events
      WHERE user_id = ${user.sub}
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    return reply.send({
      scans: scans.map((s) => ({
        ...s,
        credit_value: parseFloat(s.credit_value),
        estimated_weight: parseFloat(s.estimated_weight),
        ai_confidence_score: parseFloat(s.ai_confidence_score),
      })),
    });
  });
}
