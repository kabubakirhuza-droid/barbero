import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /clients
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const clients = await db.getClients(userId);
    res.json({ clients });
  } catch (error) {
    console.error('[Clients GET error]:', error);
    res.status(500).json({ error: 'Mijozlarni yuklashda xatolik yuz berdi' });
  }
});

// GET /clients/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const client = await db.getClientById(id, userId);
    if (!client) {
      res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
      return;
    }
    const appointments = await db.getAppointmentsByClientId(id, userId);
    res.json({ client, appointments });
  } catch (error) {
    console.error('[Clients GET :id error]:', error);
    res.status(500).json({ error: 'Mijoz maʼlumotlarini yuklashda xatolik yuz berdi' });
  }
});

// PUT /clients/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await db.updateClient(id, userId, {
      name: req.body.name !== undefined ? String(req.body.name).trim() : undefined,
      phone: req.body.phone !== undefined ? String(req.body.phone).trim() : undefined,
      notes: req.body.notes !== undefined ? String(req.body.notes) : undefined,
    });

    if (!updated) {
      res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
      return;
    }

    res.json({ success: true, client: updated });
  } catch (error) {
    console.error('[Clients PUT error]:', error);
    res.status(500).json({ error: 'Mijozni yangilashda xatolik yuz berdi' });
  }
});

// DELETE /clients/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const deleted = await db.deleteClient(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Mijoz topilmadi yoki ruxsat berilmagan' });
      return;
    }

    res.json({ success: true, message: "Mijoz o'chirildi" });
  } catch (error) {
    console.error('[Clients DELETE error]:', error);
    res.status(500).json({ error: "Mijozni o'chirishda xatolik yuz berdi" });
  }
});

export default router;
