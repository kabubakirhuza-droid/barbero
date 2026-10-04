# BarberPlan — Rasmiy Mobil Ilova va Backend

BarberPlan — go'zallik ustalari (barber, sartarosh, vizajist) uchun mijozlar navbati, bron qilish va daromad hisob-kitoblarini yurituvchi zamonaviy mobil ilova va backend tizimi.

---

## 🛠 Texnologiyalar Steki

- **Mobil Ilova:** React Native (Expo SDK 52) + TypeScript
- **Dizayn tizimi:** Royal Cobalt (`#2563EB`), Ice Slate (`#F8FAFC`), Kartochkalar (`#FFFFFF`, radius 16-20), Lucide Icons, Haptics
- **Backend:** Node.js (Express) + TypeScript + Web Push (`web-push` / VAPID)
- **Ma'lumotlar bazasi:** PostgreSQL (DDL schema: `backend/src/schema.sql`) + tezkor lokal xotira
- **Autentifikatsiya:** Telefon raqam + Telefon OTP / Telegram Gateway API + JWT Access/Refresh tokenlar
- **Tillari:** O'zbekcha (lotin yozuvi, asosiy) va Ruscha (sozlamalardan o'zgartiriladi)

---

## 📁 Loyiha Tuzilishi

```
CRM_claude_Ai/
├── backend/
│   ├── src/
│   │   ├── config.ts              # Konfiguratsiya va xavfsiz o'zgaruvchilar
│   │   ├── telegramGateway.ts     # Telegram Gateway API integratsiyasi
│   │   ├── pushService.ts         # VAPID Web Push bildirishnomalar servisi
│   │   ├── schema.sql             # PostgreSQL to'liq jadvallar strukturasi
│   │   ├── db.ts                  # PostgreSQL ulanishi va boshlang'ich ma'lumotlar
│   │   ├── routes/
│   │   │   ├── auth.ts            # /auth/send-code, /auth/verify, /auth/me
│   │   │   ├── services.ts        # Xizmatlar CRUD
│   │   │   ├── appointments.ts    # Jadval va bandliklar CRUD
│   │   │   ├── clients.ts         # Mijozlar bazasi
│   │   │   ├── analytics.ts       # Daromad dinamikasi va metrikalar (Asia/Tashkent)
│   │   │   ├── push.ts            # Web Push obunalari va diagnostika
│   │   │   ├── shop.ts            # Do'kon mahsulotlari va savat
│   │   │   ├── portfolio.ts       # Portfolio rasmlari
│   │   │   ├── profile.ts         # Ish vaqti va sozlamalar
│   │   │   └── publicBooking.ts   # Onlayn bron sahifasi
│   │   └── index.ts               # Server entrypoint (Port 5000)
│   ├── .env                       # TELEGRAM_GATEWAY_TOKEN, VAPID kalitlari
│   └── package.json
│
└── mobile/
    ├── src/
    │   ├── theme/colors.ts        # Barbero dizayn tizimi ranglari
    │   ├── i18n/                  # O'zbekcha va Ruscha tarjimalar
    │   ├── api/apiClient.ts       # Backend bilan API aloqasi (15s timeout, avto-retry)
    │   ├── utils/pushManager.ts   # Web Push & Service Worker integratsiyasi
    │   ├── components/            # Header, FloatingTabBar, BottomSheet, Button, Skeleton
    │   └── screens/
    │       ├── OnboardingScreen.tsx  # 4 ta slayd, animatsion maketlar
    │       ├── AuthScreen.tsx        # Telefon maskasi + 6 xonali Telegram kod
    │       ├── JadvalScreen.tsx      # Kunlik jadval, 30 min slotlar, tahrirlash
    │       ├── AddServiceModal.tsx   # Yangi xizmat qo'shish formasi
    │       ├── AnalitikaScreen.tsx   # Daromad kartasi, diagrammalar, filtr
    │       ├── PortfolioScreen.tsx   # Ishlar galereyasi
    │       ├── DohonScreen.tsx       # 2 ustunli tovarlar seti, savat
    │       ├── ProfilScreen.tsx      # Foydalanuvchi profili, sozlamalar
    │       ├── BookingLinkScreen.tsx # Booking havola boshqaruvi
    │       ├── WorkingHoursScreen.tsx# Hafta kunlari ish vaqtlari
    │       ├── NotificationsScreen.tsx# Bildirishnomalar va Web Push diagnostika
    │       ├── SecurityScreen.tsx    # PIN-kod va qurilmalar
    │       ├── LanguageSelectScreen.tsx # O'zbekcha / Ruscha tanlash
    │       └── PublicBookingPreviewModal.tsx # Mijozlar uchun onlayn bron sahifasi
    ├── App.tsx
    └── package.json
```

---

## 🚀 Ishga tushirish

### 1. Backend Serverni ishga tushirish:

```bash
cd backend
npm install
npm run dev
```

Server `http://127.0.0.1:5000` manzilida ishga tushadi.

### 2. Mobil Ilovani ishga tushirish:

```bash
cd mobile
npm install

# Veb-brauzerda ko'rish:
npm run web

# Yoki Expo orqali mobil telefonda:
npm run start
```

---

## 🔒 Telegram Gateway API Xavfsizligi

Telegram Gateway tokeni **faqat backendda** `backend/.env` faylida saqlanadi va `.gitignore` orqali himoyalangan:
- Har bir raqam uchun 60 soniyada faqat 1 ta kod so'rovi cheklovi mavjud (Rate Limit).
- Maksimal 5 ta xato kod kiritish urinishidan so'ng sessiya bloklanadi.
- Kod rasmiy `@VerificationCodes` Telegram boti orqali foydalanuvchiga yuboriladi.
