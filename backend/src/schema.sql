-- Barbero PostgreSQL Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Barber / Beauty Master / Client)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  ism VARCHAR(60) DEFAULT 'Master',
  familiya VARCHAR(60) DEFAULT 'Barbero',
  full_name VARCHAR(120) DEFAULT 'Barbero Master',
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'MASTER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. OTP Sessions table (Persistent Telegram Gateway sessions)
CREATE TABLE IF NOT EXISTS otp_requests (
  phone VARCHAR(20) PRIMARY KEY,
  request_id VARCHAR(100) NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Salons table (One barbershop = One point on map)
CREATE TABLE IF NOT EXISTS salons (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Salon Members table (Masters working in this salon)
CREATE TABLE IF NOT EXISTS salon_members (
  id VARCHAR(64) PRIMARY KEY,
  salon_id VARCHAR(64) REFERENCES salons(id) ON DELETE CASCADE,
  master_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner' | 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, master_id)
);

-- 5. Services table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- minutes
  badge_color VARCHAR(30) DEFAULT '#A67C2E',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Clients table (Lightweight, name + phone)
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  notes TEXT,
  total_spent INTEGER DEFAULT 0,
  visits_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Appointments table with unique active slot index to prevent double booking
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(120) NOT NULL,
  service_price INTEGER NOT NULL,
  badge_color VARCHAR(30) DEFAULT '#A67C2E',
  appointment_date VARCHAR(20) NOT NULL, -- YYYY-MM-DD
  start_time VARCHAR(10) NOT NULL,       -- "14:00"
  end_time VARCHAR(10) NOT NULL,         -- "14:30"
  duration INTEGER NOT NULL DEFAULT 30,
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot 
ON appointments (user_id, appointment_date, start_time) 
WHERE status != 'cancelled';

-- 8. Booking Requests table
CREATE TABLE IF NOT EXISTS booking_requests (
  id VARCHAR(64) PRIMARY KEY,
  master_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(120),
  service_price INTEGER,
  badge_color VARCHAR(30),
  appointment_date VARCHAR(20) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  duration INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Working Hours table
CREATE TABLE IF NOT EXISTS working_hours (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  day_index INTEGER NOT NULL,
  is_working BOOLEAN DEFAULT TRUE,
  start_time VARCHAR(10) DEFAULT '09:00',
  end_time VARCHAR(10) DEFAULT '21:00',
  lunch_start VARCHAR(10) DEFAULT '13:00',
  lunch_end VARCHAR(10) DEFAULT '14:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Portfolio Photos table
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  likes_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  booking_link_active BOOLEAN DEFAULT TRUE,
  allow_custom_time_request BOOLEAN DEFAULT FALSE,
  allow_lunch_time_booking BOOLEAN DEFAULT FALSE,
  daily_reminder_active BOOLEAN DEFAULT TRUE,
  daily_reminder_time VARCHAR(10) DEFAULT '09:00',
  client_sms_reminder_active BOOLEAN DEFAULT TRUE,
  theme VARCHAR(20) DEFAULT 'system',
  app_language VARCHAR(10) DEFAULT 'uz',
  security_pin VARCHAR(4),
  biometrics_enabled BOOLEAN DEFAULT FALSE
);

-- 12. Push Subscriptions table (Web Push / VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
