import { Router, Response } from 'express';
import { db, Service } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth to all service endpoints
router.use(authenticateToken);

// GET /services (Lists master's services, auto-seeds starter catalog if empty)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    let services = await db.getServices(userId);

    // If master has no services yet (first time registration), seed starter services
    if (!services || services.length === 0) {
      const defaultStarterServices = [
        { name: 'Soch olish', price: 50000, duration: 30, badgeColor: '#2563EB', isActive: true },
        { name: 'Soch + soqol', price: 70000, duration: 45, badgeColor: '#2563EB', isActive: true },
        { name: 'Bolalar sochi', price: 30000, duration: 25, badgeColor: '#10B981', isActive: true },
        { name: 'Soqol olish', price: 30000, duration: 20, badgeColor: '#F59E0B', isActive: true },
        { name: 'Kreativ soqol tekislash', price: 45000, duration: 30, badgeColor: '#8B5CF6', isActive: true },
      ];

      for (let i = 0; i < defaultStarterServices.length; i++) {
        const item = defaultStarterServices[i];
        await db.createService({
          id: `srv-${Date.now()}-${i + 1}`,
          userId,
          name: item.name,
          price: item.price,
          duration: item.duration,
          badgeColor: item.badgeColor,
          isActive: item.isActive,
        });
      }

      services = await db.getServices(userId);
    }

    res.json({ services });
  } catch (error) {
    console.error('[Services GET error]:', error);
    res.status(500).json({ error: 'Xizmatlarni yuklashda xatolik yuz berdi' });
  }
});

// POST /services (Creates a service for current master)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, price, duration, badgeColor, isActive } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ error: 'Nomi va narxi kiritilishi shart' });
      return;
    }

    const newService: Service = {
      id: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      name: String(name).trim(),
      price: Number(price),
      duration: Number(duration) || 30,
      badgeColor: badgeColor || '#2563EB',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };

    await db.createService(newService);
    res.status(201).json({ success: true, service: newService });
  } catch (error) {
    console.error('[Services POST error]:', error);
    res.status(500).json({ error: 'Xizmatni saqlashda xatolik yuz berdi' });
  }
});

// PUT /services/:id (Updates master's own service)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await db.updateService(id, userId, {
      ...req.body,
      name: req.body.name !== undefined ? String(req.body.name).trim() : undefined,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      duration: req.body.duration !== undefined ? Number(req.body.duration) : undefined,
      badgeColor: req.body.badgeColor !== undefined ? String(req.body.badgeColor) : undefined,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
    });

    if (!updated) {
      res.status(404).json({ error: 'Xizmat topilmadi yoki ruxsat berilmagan' });
      return;
    }

    res.json({ success: true, service: updated });
  } catch (error) {
    console.error('[Services PUT error]:', error);
    res.status(500).json({ error: 'Xizmatni yangilashda xatolik yuz berdi' });
  }
});

// DELETE /services/:id (Deletes master's own service)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const deleted = await db.deleteService(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Xizmat topilmadi yoki ruxsat berilmagan' });
      return;
    }

    res.json({ success: true, message: "Xizmat o'chirildi" });
  } catch (error) {
    console.error('[Services DELETE error]:', error);
    res.status(500).json({ error: "Xizmatni o'chirishda xatolik yuz berdi" });
  }
});

export default router;
