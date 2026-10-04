import { pool, Database } from './db';
import { isProduction } from './config';

async function seedDevelopmentData() {
  if (isProduction) {
    console.error('⛔ [Seed] Seeding demo data is strictly disabled in production environments!');
    process.exit(1);
  }

  console.log('🌱 [Seed] Populating development seed data into PostgreSQL...');
  const db = new Database();
  await db.initDb();

  // Create demo master
  const demoMasterId = 'u-dev-master';
  await db.createUser({
    id: demoMasterId,
    phone: '+998901234567',
    ism: 'Sardor',
    familiya: 'Aliyev',
    fullName: 'Sardor Aliyev',
    username: 'sardor_barber',
    role: 'MASTER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
    bio: 'Professional erkaklar sartaroshi. 8 yillik tajriba.',
    createdAt: new Date().toISOString(),
  });

  // Create demo services
  await db.createService({
    id: 'srv-dev-1',
    userId: demoMasterId,
    name: 'Soch olish',
    price: 60000,
    duration: 30,
    badgeColor: '#A67C2E',
    isActive: true,
  });

  await db.createService({
    id: 'srv-dev-2',
    userId: demoMasterId,
    name: 'Soqol tekislash',
    price: 40000,
    duration: 20,
    badgeColor: '#3B82F6',
    isActive: true,
  });

  await db.createService({
    id: 'srv-dev-3',
    userId: demoMasterId,
    name: 'Kompleks xizmat (Soch + Soqol)',
    price: 90000,
    duration: 50,
    badgeColor: '#10B981',
    isActive: true,
  });

  // Create demo salon
  const salonId = 'salon-dev-1';
  await db.createSalon({
    id: salonId,
    name: 'Barbero Central Salon',
    address: 'Toshkent sh., Amir Temur shox ko‘chasi, 42-uy',
    latitude: 41.3111,
    longitude: 69.2797,
    createdBy: demoMasterId,
  });

  await db.joinSalon(salonId, demoMasterId, 'owner');

  // Create demo portfolio photos
  await db.addPortfolioPhoto({
    id: 'pt-dev-1',
    userId: demoMasterId,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&fit=crop',
    caption: 'Fade & Crop uslubi 💈',
    likesCount: 24,
    isPublic: true,
  });

  await db.addPortfolioPhoto({
    id: 'pt-dev-2',
    userId: demoMasterId,
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&fit=crop',
    caption: 'Klassik erkaklar soch turmagi',
    likesCount: 18,
    isPublic: true,
  });

  console.log('✅ [Seed] Development database successfully populated with demo master & salon.');
  await pool.end();
}

if (require.main === module) {
  seedDevelopmentData().catch((err) => {
    console.error('❌ [Seed] Error populating database:', err);
    process.exit(1);
  });
}

export { seedDevelopmentData };
