import { Router, Request, Response } from 'express';
import { db, Salon, SalonMember } from '../db';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /salons/nearby?lat=...&lng=...&radius=50
router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || config.salonMergeRadiusM;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Koordinatalar (lat, lng) kiritilishi shart' });
      return;
    }

    const nearbyList = await db.getNearbySalons(lat, lng, radius);

    res.json({
      radiusMeters: radius,
      foundCount: nearbyList.length,
      salons: nearbyList,
    });
  } catch (error) {
    console.error('[Salons nearby GET error]:', error);
    res.status(500).json({ error: 'Yaqin atrofdagi salonlarni yuklashda xatolik yuz berdi' });
  }
});

// POST /salons/join - Join existing barbershop within 50m
router.post('/join', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
    const { salonId } = req.body;

    if (!salonId) {
      res.status(400).json({ error: 'Sartaroshxona tanlanishi shart' });
      return;
    }

    const salon = await db.getSalonById(salonId);
    if (!salon) {
      res.status(404).json({ error: 'Sartaroshxona topilmadi' });
      return;
    }

    await db.joinSalon(salonId, masterId, 'member');
    const members = await db.getSalonMembers(salonId);

    res.json({
      success: true,
      message: "Sartaroshxonaga muvaffaqiyatli qo'shildingiz",
      salon: {
        ...salon,
        mastersCount: members.length,
      },
    });
  } catch (error) {
    console.error('[Salons join POST error]:', error);
    res.status(500).json({ error: "Sartaroshxonaga qo'shilishda xatolik yuz berdi" });
  }
});

// POST /salons/create - Create new barbershop
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
    const { name, address } = req.body;
    const latitude = req.body.latitude !== undefined ? req.body.latitude : req.body.lat;
    const longitude = req.body.longitude !== undefined ? req.body.longitude : req.body.lng;

    if (!name || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Nomi va koordinatalari kiritilishi shart' });
      return;
    }

    const newSalon: Salon = {
      id: `salon-${Date.now()}`,
      name: name.trim(),
      address: address?.trim() || "Toshkent sh., Yangi sartaroshxona ko'chasi",
      latitude: Number(latitude),
      longitude: Number(longitude),
      createdBy: masterId,
    };

    const createdSalon = await db.createSalon(newSalon);
    await db.joinSalon(createdSalon.id, masterId, 'owner');

    res.status(201).json({
      success: true,
      message: 'Yangi sartaroshxona yaratildi',
      salon: {
        ...createdSalon,
        mastersCount: 1,
      },
    });
  } catch (error) {
    console.error('[Salons create POST error]:', error);
    res.status(500).json({ error: 'Sartaroshxona yaratishda xatolik yuz berdi' });
  }
});

// GET /salons/my - Current master's salon
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
    const result = await db.getMasterSalon(masterId);

    if (!result) {
      res.json({ salon: null, members: [] });
      return;
    }

    res.json({
      salon: {
        ...result.salon,
        mastersCount: result.members.length,
      },
      members: result.members,
    });
  } catch (error) {
    console.error('[Salons my GET error]:', error);
    res.status(500).json({ error: 'Saloningizni yuklashda xatolik yuz berdi' });
  }
});

// GET /salons - All salons for the client map (Public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const salons = await db.getAllSalons();
    const result = await Promise.all(
      salons.map(async (salon) => {
        const members = await db.getSalonMembers(salon.id);
        return {
          ...salon,
          mastersCount: members.length,
          masters: members,
        };
      })
    );

    res.json({ salons: result });
  } catch (error) {
    console.error('[Salons GET error]:', error);
    res.status(500).json({ error: 'Salonlar roʻyxatini yuklashda xatolik yuz berdi' });
  }
});

export default router;
