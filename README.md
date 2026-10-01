# Planr — Rasmiy Mobil Ilova va Backend (1-ga-1 Nusxa)

Planr — go'zallik ustalari (barber, sartarosh, vizajist) uchun mijozlar navbati, bron qilish va daromad hisob-kitoblarini yurituvchi zamonaviy mobil ilova va backend tizimi.

---

## 🛠 Texnologiyalar Steki

- **Mobil Ilova:** React Native (Expo SDK 52) + TypeScript
- **Dizayn tizimi:** Warm Cream (`#FBF8F4`), Oltin-jigarrang (`#A67C2E`), Kartochkalar (`#FFFFFF`, radius 16-20), Lucide Icons, Haptics
- **Backend:** Node.js (Express) + TypeScript
- **Ma'lumotlar bazasi:** PostgreSQL (DDL schema: `backend/src/schema.sql`) + tezkor lokal xotira
- **Autentifikatsiya:** Telefon raqam + Telegram Gateway API (`sendVerificationMessage`, `checkVerificationStatus`) + JWT Access/Refresh tokenlar
- **Tillari:** O'zbekcha (lotin yozuvi, asosiy) va Ruscha (sozlamalardan o'zgartiriladi)

---

## 📁 Loyiha Tuzilishi

```
CRM_claude_Ai/
├── backend/
│   ├── src/
│   │   ├── config.ts              # Konfiguratsiya va xavfsiz o'zgaruvchilar
│   │   ├── telegramGateway.ts     # Telegram Gateway API integratsiyasi
│   │   ├── schema.sql             # PostgreSQL to'liq jadvallar strukturasi
│   │   ├── db.ts                  # PostgreSQL ulanishi va boshlang'ich ma'lumotlar
│   │   ├── routes/
│   │   │   ├── auth.ts            # /auth/send-code, /auth/verify, /auth/me
│   │   │   ├── services.ts        # Xizmatlar CRUD
│   │   │   ├── appointments.ts    # Jadval va bandliklar CRUD
│   │   │   ├── clients.ts         # Mijozlar bazasi
│   │   │   ├── analytics.ts       # Daromad dinamikasi va metrikalar
│   │   │   ├── shop.ts            # Do'kon mahsulotlari va savat
│   │   │   ├── portfolio.ts       # Usta portfolio rasmlari
│   │   │   ├── profile.ts         # Ish vaqti va sozlamalar
│   │   │   └── publicBooking.ts   # planr.uz/b/{username} onlayn bron sahifasi
│   │   └── index.ts               # Server entrypoint (Port 5000)
│   ├── .env                       # TELEGRAM_GATEWAY_TOKEN va sirlar
│   └── package.json
│
└── mobile/
    ├── src/
    │   ├── theme/colors.ts        # Planr dizayn tizimi ranglari
    │   ├── i18n/                  # O'zbekcha va Ruscha tarjimalar
    │   ├── api/apiClient.ts       # Backend bilan API aloqasi
    │   ├── components/            # Header, FloatingTabBar, BottomSheet, Button, Skeleton
    │   └── screens/
    │       ├── OnboardingScreen.tsx  # 4 ta slayd, animatsion maketlar
    │       ├── AuthScreen.tsx        # Telefon maskasi + 6 xonali Telegram kod
    │       ├── JadvalScreen.tsx      # Kunlik jadval, 30 min slotlar, tahrirlash
    │       ├── AddServiceModal.tsx   # Yangi xizmat qo'shish formasi
    │       ├── AnalitikaScreen.tsx   # Daromad kartasi, diagrammalar, filtr
    │       ├── PortfolioScreen.tsx   # Ishlar galereyasi
    │       ├── DohonScreen.tsx       # 2 ustunli tovarlar seti, savat
    │       ├── ProfilScreen.tsx      # Foydalanuvchi profili, premium banner, sozlamalar
    │       ├── BookingLinkScreen.tsx # Booking havola boshqaruvi
    │       ├── WorkingHoursScreen.tsx# Hafta kunlari ish vaqtlari
    │       ├── NotificationsScreen.tsx# Bildirishnomalar va AI rejimi
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
