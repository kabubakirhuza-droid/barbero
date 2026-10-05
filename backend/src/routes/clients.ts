import { Router, Response } from 'express';
import { db, normalizeUzbekPhone } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /clients/search?phone=+998901234567
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const phone = String(req.query.phone || '').trim();

    if (!phone) {
      res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
      return;
    }

    const result = await db.searchClientByPhone(userId, phone);
    res.json({
      success: true,
      found: result.found,
      client: result.client,
      normalizedPhone: result.normalizedPhone,
    });
  } catch (error) {
    console.error('[Clients GET search error]:', error);
    res.status(500).json({ error: 'Mijozni qidirishda xatolik yuz berdi' });
  }
});

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

// GET /clients/inactive - Smart customer retention list (>21 days since last visit)
router.get('/inactive', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const inactiveClients = await db.getInactiveClients(userId, 21);
    res.json({ inactiveClients, count: inactiveClients.length });
  } catch (error) {
    console.error('[Clients GET inactive error]:', error);
    res.status(500).json({ error: 'Nofaol mijozlarni yuklashda xatolik yuz berdi' });
  }
});

// GET /clients/:id/history
router.get('/:id/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { client, history } = await db.getClientHistory(userId, id);
    if (!client) {
      res.status(404).json({ error: 'Mijoz topilmadi' });
      return;
    }
    res.json({ success: true, client, history });
  } catch (error) {
    console.error('[Clients GET :id/history error]:', error);
    res.status(500).json({ error: 'Mijoz tarixini yuklashda xatolik yuz berdi' });
  }
});

// POST /clients/quick - Quick 1-tap client registration from phone/name
router.post('/quick', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { phone, name, notes } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Telefon raqami kiritilishi shart' });
      return;
    }

    const normalizedPhone = normalizeUzbekPhone(phone);
    const cleanName = name ? String(name).trim().slice(0, 100) : "Yangi mijoz";
    const cleanNotes = notes ? String(notes).trim() : undefined;

    const client = await db.createOrUpdateClient(userId, cleanName, normalizedPhone, 0, cleanNotes);

    // Also register in call log for fast reference
    await db.addCallLog(userId, normalizedPhone, cleanName, 'incoming_manual');

    res.status(201).json({
      success: true,
      message: 'Mijoz muvaffaqiyatli saqlandi',
      client,
    });
  } catch (error) {
    console.error('[Clients POST quick error]:', error);
    res.status(500).json({ error: 'Mijozni saqlashda xatolik yuz berdi' });
  }
});

// POST /clients - Standard create
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { phone, name, notes } = req.body;

    if (!phone || !name) {
      res.status(400).json({ error: 'Ism va telefon raqami kiritilishi shart' });
      return;
    }

    const normalizedPhone = normalizeUzbekPhone(phone);
    const cleanName = String(name).trim().slice(0, 100);
    const cleanNotes = notes ? String(notes).trim() : undefined;

    const client = await db.createOrUpdateClient(userId, cleanName, normalizedPhone, 0, cleanNotes);
    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error('[Clients POST error]:', error);
    res.status(500).json({ error: 'Mijozni yaratishda xatolik yuz berdi' });
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
      phone: req.body.phone !== undefined ? normalizeUzbekPhone(String(req.body.phone).trim()) : undefined,
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
