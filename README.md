# Jiran 🇧🇩

**Jiran** – বাংলাদেশের প্রথম সোশ্যাল মিডিয়া প্ল্যাটফর্ম। ছবি, ভিডিও, রিলস শেয়ার করুন, বন্ধুদের ফলো করুন এবং নতুন কনটেন্ট এক্সপ্লোর করুন।

🌐 **Live:** [jiran.lovable.app](https://jiran.lovable.app)

---

## ✨ ফিচারসমূহ

- 🔐 **Authentication** – Facebook-style ৩-ধাপের সাইনআপ
- 📰 **Feed & Reels** – মাল্টি-ফরম্যাট পোস্ট, snap-scrolling reels, পোল, ইমোজি রিঅ্যাকশন
- 📸 **Stories** – Facebook-style rectangular cards, unique view tracking
- 💬 **Messaging** – রিয়েল-টাইম চ্যাট, 20MB মিডিয়া, voice, vanish mode
- 👤 **Profiles** – Facebook-style cover, glowing avatar, dynamic stats
- 🛒 **Marketplace** – পণ্য তালিকা, grid view, direct seller messaging
- 🎮 **Gamification** – Daily login streak, XP levels, referral rewards
- 📺 **Live Streaming** – Real-time viewer count, LIVE badge
- 🎉 **Events & Fundraisers** – RSVP events, ফান্ড গোল ট্র্যাকিং
- ⭐ **Close Friends** – প্রাইভেট কনটেন্ট শেয়ারিং
- 🚀 **Post Boosting** – Nagad, bKash, Upay দিয়ে ম্যানুয়াল পেমেন্ট
- 📢 **Ad Network** – CPC/CPM ads, "Sponsored" পোস্ট
- 💰 **Creator Monetization** – Ad revenue sharing, লোকাল পেমেন্ট গেটওয়ে
- 🛡️ **Admin Dashboard** – User moderation, dynamic site settings

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) – Auth, Database (PostgreSQL + RLS), Storage, Edge Functions, Realtime
- **Design:** TikTok Dark theme, glassmorphism, neon red/cyan accents

---

## 🚀 Local Development

```sh
# Clone repository
git clone <YOUR_GIT_URL>
cd jiran

# Install dependencies
npm install

# Start dev server
npm run dev
```

পরিবেশ ভেরিয়েবল (`.env`) Lovable Cloud স্বয়ংক্রিয়ভাবে কনফিগার করে দেয়।

---

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (Auth, etc.)
├── hooks/           # Custom hooks
├── integrations/    # Supabase client (auto-generated)
├── lib/             # Utilities
├── pages/           # Route pages
└── index.css        # Design tokens

supabase/
├── functions/       # Edge functions
└── config.toml      # Supabase config
```

---

## 🌍 Language Support

- 🇧🇩 বাংলা (Bengali)
- 🇬🇧 English

---

## 📝 License

© 2026 Jiran. All rights reserved.

---

Made with ❤️ in Bangladesh · Built on [Lovable](https://lovable.dev)
