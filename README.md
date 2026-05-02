# Restaurant Ordering Web App

QR-based MERN restaurant ordering app with a mobile customer experience, admin dashboard, realtime Socket.io order updates, seeded demo data, PWA support, and deployment-ready client/server configs.

## Quick Start

```bash
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

Demo customer URL: `http://localhost:5173/menu?table=5`
Admin URL: `http://localhost:5173/admin`

Default admin:

```text
email: admin@restaurant.local
password: admin123
```

## Deployment

Deploy `client` to Vercel or Netlify and set `VITE_API_URL` to your backend `/api` URL and `VITE_SOCKET_URL` to the backend origin when using the API server. SPA rewrites are included in `client/vercel.json` and `client/public/_redirects`.
Deploy `server` to Render and set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.

Razorpay is optional. Add test keys in `server/.env` to enable order creation.
