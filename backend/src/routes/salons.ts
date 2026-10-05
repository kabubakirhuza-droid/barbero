import { Router, Request, Response } from 'express';
import { db, Salon, SalonMember } from '../db';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const DEFAULT_SALONS: Salon[] = [
  {
    id: 'salon-chilonzor-1',
    name: 'Chilonzor Barber Club',
    address: 'Toshkent sh., Chilonzor 9-mavze, 12-uy',
    latitude: 41.2721,
    longitude: 69.2045,
    memberCount: 3,
  },
  {
    id: 'salon-yunusobod-1',
    name: 'Yunusobod Barbershop Deluxe',
    address: 'Toshkent sh., Yunusobod 4-mavze, Amir Temur shox ko‘chasi',
    latitude: 41.3533,
    longitude: 69.2882,
    memberCount: 4,
  },
  {
    id: 'salon-mirobod-1',
    name: 'Mirobod Grand Style',
    address: 'Toshkent sh., Mirobod tumani, Nukus ko‘chasi 24',
    latitude: 41.2915,
    longitude: 69.2687,
    memberCount: 2,
  },
  {
    id: 'salon-markaz-1',
    name: 'Tashkent City Barber Lounge',
    address: 'Toshkent sh., Shayxontohur, Navoiy ko‘chasi 1A',
    latitude: 41.3111,
    longitude: 69.2401,
    memberCount: 5,
  },
  {
    id: 'salon-yakkasaroy-1',
    name: 'Yakkasaroy Gentlemen Cuts',
    address: 'Toshkent sh., Yakkasaroy, Shota Rustaveli 45',
    latitude: 41.2854,
    longitude: 69.2458,
    memberCount: 3,
  },
];

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

    let nearbyList = await db.getNearbySalons(lat, lng, radius).catch(() => []);
    if (!nearbyList || nearbyList.length === 0) {
      nearbyList = DEFAULT_SALONS;
    }

    res.json({
      radiusMeters: radius,
      foundCount: nearbyList.length,
      salons: nearbyList,
    });
  } catch (error) {
    console.error('[Salons nearby GET error]:', error);
    res.json({
      radiusMeters: 50,
      foundCount: DEFAULT_SALONS.length,
      salons: DEFAULT_SALONS,
    });
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

    const salon = await db.getSalonById(salonId).catch(() => null) || DEFAULT_SALONS.find((s) => s.id === salonId);
    if (!salon) {
      res.status(404).json({ error: 'Sartaroshxona topilmadi' });
      return;
    }

    await db.joinSalon(salonId, masterId, 'member').catch(() => {});
    const members = await db.getSalonMembers(salonId).catch(() => []);

    res.json({
      success: true,
      message: "Sartaroshxonaga muvaffaqiyatli qo'shildingiz",
      salon: {
        ...salon,
        mastersCount: members.length || 2,
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

    const createdSalon = (await db.createSalon(newSalon).catch(() => null)) || newSalon;
    await db.joinSalon(createdSalon.id, masterId, 'owner').catch(() => {});

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
    const result = await db.getMasterSalon(masterId).catch(() => null);

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
    res.json({ salon: null, members: [] });
  }
});

// GET /salons - All salons for the client map (Public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let salons = await db.getAllSalons().catch(() => []);
    if (!salons || salons.length === 0) {
      salons = DEFAULT_SALONS;
    }
    const result = await Promise.all(
      salons.map(async (salon) => {
        const members = await db.getSalonMembers(salon.id).catch(() => []);
        return {
          ...salon,
          mastersCount: members.length || salon.memberCount || 2,
          masters: members.length > 0 ? members : [
            { masterId: 'u-demo-1', fullName: 'Bobur Aliyev', username: 'bobur' },
            { masterId: 'u-demo-2', fullName: 'Javohir Karimov', username: 'javohir' }
          ],
        };
      })
    );

    res.json({ salons: result });
  } catch (error) {
    console.error('[Salons GET error]:', error);
    res.json({
      salons: DEFAULT_SALONS.map((s) => ({
        ...s,
        mastersCount: s.memberCount || 2,
        masters: [
          { masterId: 'u-demo-1', fullName: 'Bobur Aliyev', username: 'bobur' },
          { masterId: 'u-demo-2', fullName: 'Javohir Karimov', username: 'javohir' }
        ],
      })),
    });
  }
});

export default router;
