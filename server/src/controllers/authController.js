import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const demoStore = req.app.locals.demoStore;

  if (demoStore) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@restaurant.local";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (normalizedEmail !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: "demo-admin", email: adminEmail }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    return res.json({ token, admin: { email: adminEmail } });
  }

  const admin = await Admin.findOne({ email: normalizedEmail });

  if (!admin || !(await bcrypt.compare(password || "", admin.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token, admin: { email: admin.email } });
};
