import { Router, Request, Response } from 'express';
import { db, Client } from '../db';

const router = Router();

// GET /clients
router.get('/', (req: Request, res: Response) => {
  res.json({ clients: db.clients });
});

// GET /clients/:id
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const client = db.clients.find((c) => c.id === id);
  if (!client) {
    res.status(404).json({ error: 'Mijoz topilmadi' });
    return;
  }
  const appointments = db.appointments.filter((a) => a.clientId === id);
  res.json({ client, appointments });
});

// PUT /clients/:id
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const client = db.clients.find((c) => c.id === id);
  if (!client) {
    res.status(404).json({ error: 'Mijoz topilmadi' });
    return;
  }

  if (req.body.name) client.name = req.body.name;
  if (req.body.phone) client.phone = req.body.phone;
  if (req.body.notes !== undefined) client.notes = req.body.notes;

  // Also update latest appointments client info
  db.appointments.forEach((a) => {
    if (a.clientId === id) {
      if (req.body.name) a.clientName = req.body.name;
      if (req.body.phone) a.clientPhone = req.body.phone;
    }
  });

  res.json({ success: true, client });
});

// DELETE /clients/:id
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLen = db.clients.length;
  db.clients = db.clients.filter((c) => c.id !== id);

  if (db.clients.length === initialLen) {
    res.status(404).json({ error: 'Mijoz topilmadi' });
    return;
  }

  res.json({ success: true, message: "Mijoz o'chirildi" });
});

export default router;
