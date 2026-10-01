import { Router, Request, Response } from 'express';
import { db, Service } from '../db';

const router = Router();

// GET /services
router.get('/', (req: Request, res: Response) => {
  res.json({ services: db.services });
});

// POST /services
router.post('/', (req: Request, res: Response): void => {
  const { name, price, duration, badgeColor, isActive } = req.body;

  if (!name || price === undefined) {
    res.status(400).json({ error: 'Nomi va narxi kiritilishi shart' });
    return;
  }

  const newService: Service = {
    id: `srv-${Date.now()}`,
    userId: 'u-1',
    name,
    price: Number(price),
    duration: Number(duration) || 30,
    badgeColor: badgeColor || '#A67C2E',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  };

  db.services.push(newService);
  res.status(201).json({ success: true, service: newService });
});

// PUT /services/:id
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = db.services.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Xizmat topilmadi' });
    return;
  }

  const current = db.services[index];
  db.services[index] = {
    ...current,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    duration: req.body.duration !== undefined ? Number(req.body.duration) : current.duration,
  };

  res.json({ success: true, service: db.services[index] });
});

// DELETE /services/:id
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLength = db.services.length;
  db.services = db.services.filter((s) => s.id !== id);

  if (db.services.length === initialLength) {
    res.status(404).json({ error: 'Xizmat topilmadi' });
    return;
  }

  res.json({ success: true, message: "Xizmat o'chirildi" });
});

export default router;
