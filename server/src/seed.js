import bcrypt from "bcryptjs";
import { pathToFileURL } from "url";
import Admin from "./models/Admin.js";
import Menu from "./models/Menu.js";
import Order from "./models/Order.js";

const menuItems = [
  {
    name: "Margherita Pizza",
    price: 299,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=900&q=75",
    description: "Fresh mozzarella, basil, and slow-cooked tomato sauce."
  },
  {
    name: "Farmhouse Pizza",
    price: 379,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=75",
    description: "Loaded with capsicum, onion, sweet corn, olives, and cheese."
  },
  {
    name: "Classic Burger",
    price: 199,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=75",
    description: "Juicy patty, lettuce, tomato, cheddar, and house sauce."
  },
  {
    name: "Crispy Veg Burger",
    price: 169,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=75",
    description: "Crunchy veg patty with pickles and creamy herb mayo."
  },
  {
    name: "Iced Lemon Tea",
    price: 99,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=75",
    description: "Chilled black tea with lemon, mint, and a clean citrus finish."
  },
  {
    name: "Cold Coffee",
    price: 149,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=75",
    description: "Creamy cold coffee with chocolate notes."
  }
];

export const seedDemoData = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@restaurant.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const adminExists = await Admin.exists({ email: adminEmail });
  if (!adminExists) {
    await Admin.create({
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10)
    });
  }

  const menuCount = await Menu.countDocuments();
  if (menuCount === 0) {
    await Menu.insertMany(menuItems);
  }

  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    const seededMenu = await Menu.find().limit(3);
    if (seededMenu.length >= 2) {
      await Order.create([
        {
          customerName: "Aarav",
          tableNo: "4",
          status: "preparing",
          items: seededMenu.slice(0, 2).map((item) => ({
            menuItem: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image
          })),
          total: seededMenu.slice(0, 2).reduce((sum, item) => sum + item.price, 0)
        },
        {
          customerName: "Maya",
          tableNo: "8",
          status: "Pending",
          items: [
            {
              menuItem: seededMenu[2]._id,
              name: seededMenu[2].name,
              price: seededMenu[2].price,
              quantity: 2,
              image: seededMenu[2].image
            }
          ],
          total: seededMenu[2].price * 2
        }
      ]);
    }
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dotenv = await import("dotenv");
  const connectDB = (await import("./config/db.js")).default;
  dotenv.config();
  await connectDB();
  await seedDemoData();
  process.exit(0);
}
