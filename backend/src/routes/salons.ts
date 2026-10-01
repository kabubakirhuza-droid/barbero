import { Router, Request, Response } from 'express';
import { db, Salon, SalonMember, getDistanceInMeters } from '../db';
import { config } from '../config';

const router = Router();

// GET /salons/nearby?lat=...&lng=...&radius=50
router.get('/nearby', (req: Request, res: Response): void => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || config.salonMergeRadiusM;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'Koordinatalar (lat, lng) kiritilishi shart' });
    return;
  }

  // Calculate distance for all salons
  const nearbyList = db.salons
    .map((salon) => {
      const distanceMeters = getDistanceInMeters(lat, lng, salon.latitude, salon.longitude);
      const members = db.salonMembers.filter((m) => m.salonId === salon.id);
      return {
        ...salon,
        distanceMeters,
        mastersCount: members.length,
      };
    })
    .filter((salon) => salon.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({
    radiusMeters: radius,
    foundCount: nearbyList.length,
    salons: nearbyList,
  });
});

// POST /salons/join - Join existing barbershop within 50m (no new point created!)
router.post('/join', (req: Request, res: Response): void => {
  const { salonId, masterId } = req.body;

  if (!salonId) {
    res.status(400).json({ error: 'Sartaroshxona tanlanishi shart' });
    return;
  }

  const salon = db.salons.find((s) => s.id === salonId);
  if (!salon) {
    res.status(404).json({ error: 'Sartaroshxona topilmadi' });
    return;
  }

  const targetMasterId = masterId || 'u-1';

  // Check if already a member
  const existingMember = db.salonMembers.find(
    (m) => m.salonId === salonId && m.masterId === targetMasterId
  );

  if (!existingMember) {
    const newMember: SalonMember = {
      id: `sm-${Date.now()}`,
      salonId,
      masterId: targetMasterId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };
    db.salonMembers.push(newMember);
  }

  const allMembers = db.salonMembers.filter((m) => m.salonId === salonId);

  res.json({
    success: true,
    message: "Sartaroshxonaga muvaffaqiyatli qo'shildingiz",
    salon: {
      ...salon,
      mastersCount: allMembers.length,
    },
  });
});

// POST /salons/create - Create new barbershop
router.post('/create', (req: Request, res: Response): void => {
  const { name, address, masterId } = req.body;
  const latitude = req.body.latitude !== undefined ? req.body.latitude : req.body.lat;
  const longitude = req.body.longitude !== undefined ? req.body.longitude : req.body.lng;

  if (!name || latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Nomi va koordinatalari kiritilishi shart' });
    return;
  }

  const targetMasterId = masterId || 'u-1';

  const newSalon: Salon = {
    id: `salon-${Date.now()}`,
    name: name.trim(),
    address: address?.trim() || "Toshkent sh., Yangi sartaroshxona ko'chasi",
    latitude: Number(latitude),
    longitude: Number(longitude),
    createdBy: targetMasterId,
    createdAt: new Date().toISOString(),
  };

  db.salons.push(newSalon);

  // Add master as owner
  const ownerMember: SalonMember = {
    id: `sm-${Date.now()}`,
    salonId: newSalon.id,
    masterId: targetMasterId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  };
  db.salonMembers.push(ownerMember);

  res.status(201).json({
    success: true,
    message: 'Yangi sartaroshxona yaratildi',
    salon: {
      ...newSalon,
      mastersCount: 1,
    },
  });
});

// GET /salons/my - Current master's salon
router.get('/my', (req: Request, res: Response): void => {
  const masterId = (req.query.masterId as string) || 'u-1';
  const membership = db.salonMembers.find((m) => m.masterId === masterId) || db.salonMembers[0];

  if (!membership) {
    res.json({ salon: null, members: [] });
    return;
  }

  const salon = db.salons.find((s) => s.id === membership.salonId) || db.salons[0];
  const members = db.salonMembers
    .filter((m) => m.salonId === salon.id)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.masterId);
      return {
        masterId: m.masterId,
        role: m.role,
        fullName: user?.fullName || 'Usta',
        phone: user?.phone || '+998 90 000 00 00',
        avatarUrl: user?.avatarUrl,
        username: user?.username || 'master',
      };
    });

  res.json({
    salon: {
      ...salon,
      mastersCount: members.length,
    },
    members,
  });
});

// GET /salons - All salons for the map
router.get('/', (req: Request, res: Response): void => {
  const list = db.salons.map((salon) => {
    const members = db.salonMembers
      .filter((m) => m.salonId === salon.id)
      .map((m) => {
        const user = db.users.find((u) => u.id === m.masterId);
        return {
          masterId: m.masterId,
          role: m.role,
          fullName: user?.fullName || 'Usta',
          username: user?.username || 'master',
        };
      });

    return {
      ...salon,
      mastersCount: members.length,
      masters: members,
    };
  });

  res.json({ salons: list });
});

export default router;
