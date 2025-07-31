# 🌍 DevRadar (Hackathon Project)

A real-time map that shows developers around the world.
Built with **React + Supabase + Google Maps API**.

---

## 🚀 Features

* Developers can **check in** (name, skills, location).
* Map updates in **real-time** as new devs join.
* Uses **Supabase** (Postgres + Realtime) for syncing.
* Uses **Google Maps API** for visualization.

---

## ⚡ Setup

### 1. Clone Repo

```bash
git clone https://github.com/your-username/devradar.git
cd devradar
npm install
```

---

### 2. Supabase Setup

1. Go to [Supabase](https://supabase.com) → Create Project
2. Go to SQL Editor → Run this to create `developers` table:

```sql
create table developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skills text[],
  latitude float8 not null,
  longitude float8 not null,
  created_at timestamptz default now()
);
```

3. Get your **Project URL** + **anon key** from Supabase → Project Settings → API

Update `src/supabaseClient.js`:

```js
const supabaseUrl = "https://YOUR_PROJECT_ID.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY";
```

---

### 3. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API**
3. Create an API key

Update `src/MapView.jsx`:

```jsx
const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY"
});
```

---

### 4. Run the App

```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

Now when devs check in → they instantly show up on the map 🎉

---

## 🛠️ Project Structure

```
src/
├── App.jsx              # Main app component
├── MapView.jsx          # Google Maps component
├── CheckInForm.jsx      # Developer check-in form
├── supabaseClient.js    # Supabase configuration
├── supabaseHelpers.js   # Database helper functions
├── main.jsx             # React entry point
└── index.css            # Global styles
```

---

## 🔧 How It Works

1. **Check-in**: Developers enter their name and skills, then click "Check In"
2. **Geolocation**: Browser gets their current location
3. **Database**: Data is saved to Supabase Postgres
4. **Real-time**: All connected clients receive updates via Supabase Realtime
5. **Map**: Google Maps displays all developers as markers

---

## 🚀 Next Steps

- Add **Supabase Auth** for user profiles
- Add **marker clustering** for crowded areas
- Add **developer profiles** with more details
- Add **skill-based filtering**
- Add **chat functionality** between nearby devs

---

## 📝 Environment Variables

For production, create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 🎯 Perfect for Hackathons!

- **No backend needed** - Supabase handles everything
- **Real-time updates** - Instant map updates
- **Easy setup** - Just configure API keys
- **Scalable** - Handles thousands of concurrent users
- **Modern stack** - React + Supabase + Google Maps

---

**Happy coding! 🚀**
