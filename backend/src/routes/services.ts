import { Router, Response } from 'express';
import { db, Service } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth to all service endpoints
router.use(authenticateToken);

// GET /services (Lists master's services)
router.get('/', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const services = db.getServices(userId);
  res.json({ services });
});

// POST /services (Creates a service for current master)
router.post('/', (req: AuthRequest, res: Response): void => {
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
    badgeColor: badgeColor || '#A67C2E',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  };

  db.services.push(newService);
  res.status(201).json({ success: true, service: newService });
});

// PUT /services/:id (Updates master's own service)
router.put('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const index = db.services.findIndex((s) => s.id === id && s.userId === userId);

  if (index === -1) {
    res.status(404).json({ error: 'Xizmat topilmadi yoki ruxsat berilmagan' });
    return;
  }

  const current = db.services[index];
  db.services[index] = {
    ...current,
    ...req.body,
    userId, // immutable owner
    name: req.body.name !== undefined ? String(req.body.name).trim() : current.name,
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    duration: req.body.duration !== undefined ? Number(req.body.duration) : current.duration,
  };

  res.json({ success: true, service: db.services[index] });
});

// DELETE /services/:id (Deletes master's own service)
router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const initialLength = db.services.length;
  db.services = db.services.filter((s) => !(s.id === id && s.userId === userId));

  if (db.services.length === initialLength) {
    res.status(404).json({ error: 'Xizmat topilmadi yoki ruxsat berilmagan' });
    return;
  }

  res.json({ success: true, message: "Xizmat o'chirildi" });
});

export default router;
