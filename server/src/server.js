import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { corsOptions } from "./config/cors.js";
import { createDemoStore } from "./data/demoStore.js";
import { seedDemoData } from "./seed.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { ...corsOptions, methods: ["GET", "POST", "PATCH", "DELETE"] }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join:order", (orderId) => socket.join(`order:${orderId}`));
  socket.on("join:admin", () => socket.join("admin"));
});

try {
  await connectDB();
  await seedDemoData();
} catch (error) {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_STORE === "false") {
    throw error;
  }

  app.locals.demoStore = createDemoStore();
  console.warn("MongoDB unavailable; running with in-memory demo data for local preview.");
}

server.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
