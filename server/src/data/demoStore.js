export const demoMenuItems = [
  {
    _id: "menu_pizza_margherita",
    name: "Margherita Pizza",
    price: 299,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=900&q=75",
    description: "Fresh mozzarella, basil, and slow-cooked tomato sauce.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "menu_pizza_farmhouse",
    name: "Farmhouse Pizza",
    price: 379,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=75",
    description: "Capsicum, onion, corn, olives, and a rich cheese pull.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "menu_burger_classic",
    name: "Classic Burger",
    price: 199,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=75",
    description: "Juicy patty, lettuce, tomato, cheddar, and house sauce.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "menu_burger_veg",
    name: "Crispy Veg Burger",
    price: 169,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=75",
    description: "Crunchy veg patty with pickles and creamy herb mayo.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "menu_drink_tea",
    name: "Iced Lemon Tea",
    price: 99,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=75",
    description: "Chilled black tea with lemon, mint, and a citrus finish.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "menu_drink_coffee",
    name: "Cold Coffee",
    price: 149,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=75",
    description: "Creamy cold coffee with chocolate notes.",
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createDemoStore() {
  const menu = clone(demoMenuItems);
  const orders = [
    {
      _id: "order_demo_1",
      customerName: "Aarav",
      tableNo: "4",
      status: "preparing",
      items: [
        { menuItem: menu[0]._id, name: menu[0].name, price: menu[0].price, quantity: 1, image: menu[0].image },
        { menuItem: menu[4]._id, name: menu[4].name, price: menu[4].price, quantity: 2, image: menu[4].image }
      ],
      total: menu[0].price + menu[4].price * 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      _id: "order_demo_2",
      customerName: "Maya",
      tableNo: "8",
      status: "pending",
      items: [{ menuItem: menu[2]._id, name: menu[2].name, price: menu[2].price, quantity: 2, image: menu[2].image }],
      total: menu[2].price * 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString()
    }
  ];

  return { menu, orders };
}
