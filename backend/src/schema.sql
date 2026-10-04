-- Barbero PostgreSQL with PostGIS Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users table (Barber / Beauty Master / Client)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  ism VARCHAR(60) DEFAULT 'Abubakir',
  familiya VARCHAR(60) DEFAULT 'Aliyev',
  full_name VARCHAR(120) DEFAULT 'Abubakir Aliyev',
  username VARCHAR(50) DEFAULT 'abubakir' UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'MASTER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Salons table (One barbershop = One point on map)
CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for PostGIS spatial searches within 50 meters
CREATE INDEX IF NOT EXISTS idx_salons_location ON salons USING GIST(location);

-- 3. Salon Members table (Masters working in this salon)
CREATE TABLE IF NOT EXISTS salon_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  master_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner' | 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, master_id)
);

-- 4. Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- minutes
  badge_color VARCHAR(30) DEFAULT '#A67C2E',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Clients table (Lightweight, name + phone)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  notes TEXT,
  total_spent INTEGER DEFAULT 0,
  visits_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(120) NOT NULL,
  service_price INTEGER NOT NULL,
  badge_color VARCHAR(30) DEFAULT '#A67C2E',
  appointment_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- "14:00"
  end_time VARCHAR(10) NOT NULL,   -- "14:30"
  duration INTEGER NOT NULL DEFAULT 30,
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Working Hours table
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  day_index INTEGER NOT NULL,
  is_working BOOLEAN DEFAULT TRUE,
  start_time VARCHAR(10) DEFAULT '09:00',
  end_time VARCHAR(10) DEFAULT '21:00',
  lunch_start VARCHAR(10) DEFAULT '13:00',
  lunch_end VARCHAR(10) DEFAULT '14:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Portfolio Photos table
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  likes_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Notification & Booking Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  booking_link_active BOOLEAN DEFAULT TRUE,
  allow_custom_time_request BOOLEAN DEFAULT FALSE,
  allow_lunch_time_booking BOOLEAN DEFAULT FALSE,
  daily_reminder_active BOOLEAN DEFAULT TRUE,
  daily_reminder_time VARCHAR(10) DEFAULT '09:00',
  ai_mode_active BOOLEAN DEFAULT TRUE,
  client_sms_reminder_active BOOLEAN DEFAULT TRUE,
  app_language VARCHAR(10) DEFAULT 'uz',
  security_pin VARCHAR(4),
  biometrics_enabled BOOLEAN DEFAULT FALSE
);

-- 10. Push Subscriptions table (Web Push / VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
