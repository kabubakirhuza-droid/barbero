import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /clients
router.get('/', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const clients = db.getClients(userId);
  res.json({ clients });
});

// GET /clients/:id
router.get('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const client = db.clients.find((c) => c.id === id && c.userId === userId);
  if (!client) {
    res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
    return;
  }
  const appointments = db.appointments.filter((a) => a.clientId === id && a.userId === userId);
  res.json({ client, appointments });
});

// PUT /clients/:id
router.put('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const client = db.clients.find((c) => c.id === id && c.userId === userId);
  if (!client) {
    res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
    return;
  }

  if (req.body.name) client.name = String(req.body.name).trim();
  if (req.body.phone) client.phone = String(req.body.phone).trim();
  if (req.body.notes !== undefined) client.notes = String(req.body.notes);

  // Also update latest appointments client info
  db.appointments.forEach((a) => {
    if (a.clientId === id && a.userId === userId) {
      if (req.body.name) a.clientName = client.name;
      if (req.body.phone) a.clientPhone = client.phone;
    }
  });

  res.json({ success: true, client });
});

// DELETE /clients/:id
router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const initialLen = db.clients.length;
  db.clients = db.clients.filter((c) => !(c.id === id && c.userId === userId));

  if (db.clients.length === initialLen) {
    res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
    return;
  }

  res.json({ success: true, message: "Mijoz o'chirildi" });
});

export default router;
