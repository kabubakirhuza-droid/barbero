import { Router, Request, Response } from 'express';
import { db, Salon, SalonMember } from '../db';
import { config } from '../config';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Haversine formula to calculate distance between two coordinates in meters
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

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

// POST /salons/join - Join existing barbershop within 50m
router.post('/join', authenticateToken, (req: AuthRequest, res: Response): void => {
  const masterId = req.user!.userId;
  const { salonId } = req.body;

  if (!salonId) {
    res.status(400).json({ error: 'Sartaroshxona tanlanishi shart' });
    return;
  }

  const salon = db.salons.find((s) => s.id === salonId);
  if (!salon) {
    res.status(404).json({ error: 'Sartaroshxona topilmadi' });
    return;
  }

  // Check if already a member
  const existingMember = db.salonMembers.find(
    (m) => m.salonId === salonId && m.masterId === masterId
  );

  if (!existingMember) {
    const newMember: SalonMember = {
      id: `sm-${Date.now()}`,
      salonId,
      masterId,
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
router.post('/create', authenticateToken, (req: AuthRequest, res: Response): void => {
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
    createdAt: new Date().toISOString(),
  };

  db.salons.push(newSalon);

  // Add master as owner
  const ownerMember: SalonMember = {
    id: `sm-${Date.now()}`,
    salonId: newSalon.id,
    masterId,
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
router.get('/my', authenticateToken, (req: AuthRequest, res: Response): void => {
  const masterId = req.user!.userId;
  const membership = db.salonMembers.find((m) => m.masterId === masterId);

  if (!membership) {
    res.json({ salon: null, members: [] });
    return;
  }

  const salon = db.salons.find((s) => s.id === membership.salonId);
  if (!salon) {
    res.json({ salon: null, members: [] });
    return;
  }

  const members = db.salonMembers
    .filter((m) => m.salonId === salon.id)
    .map((m) => {
      const user = db.getUserById(m.masterId);
      return {
        masterId: m.masterId,
        role: m.role,
        fullName: user?.fullName || 'Barbero Master',
        phone: user?.phone || '',
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

// GET /salons - All salons for the client map (Public)
router.get('/', (req: Request, res: Response): void => {
  const list = db.salons.map((salon) => {
    const members = db.salonMembers
      .filter((m) => m.salonId === salon.id)
      .map((m) => {
        const user = db.getUserById(m.masterId);
        return {
          masterId: m.masterId,
          role: m.role,
          fullName: user?.fullName || 'Barbero Master',
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
