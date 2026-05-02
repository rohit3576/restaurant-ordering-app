const MENU_KEY = "qrave_menu";
const ORDERS_KEY = "orders";
const ORDER_LOCK_KEY = "qrave_order_lock";
const EVENT_NAME = "qrave:orders";

export const demoMenu = [
  {
    _id: "menu_pizza_margherita",
    name: "Margherita Pizza",
    price: 299,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=900&q=75",
    description: "Fresh mozzarella, basil, and slow-cooked tomato sauce.",
    isAvailable: true
  },
  {
    _id: "menu_pizza_farmhouse",
    name: "Farmhouse Pizza",
    price: 379,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=75",
    description: "Capsicum, onion, corn, olives, and a rich cheese pull.",
    isAvailable: true
  },
  {
    _id: "menu_burger_classic",
    name: "Classic Burger",
    price: 199,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=75",
    description: "Juicy patty, lettuce, tomato, cheddar, and house sauce.",
    isAvailable: true
  },
  {
    _id: "menu_burger_veg",
    name: "Crispy Veg Burger",
    price: 169,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=75",
    description: "Crunchy veg patty with pickles and creamy herb mayo.",
    isAvailable: true
  },
  {
    _id: "menu_drink_tea",
    name: "Iced Lemon Tea",
    price: 99,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=75",
    description: "Chilled black tea with lemon, mint, and a citrus finish.",
    isAvailable: true
  },
  {
    _id: "menu_drink_coffee",
    name: "Cold Coffee",
    price: 149,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=75",
    description: "Creamy cold coffee with chocolate notes.",
    isAvailable: true
  }
];

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const getLocalMenu = (includeUnavailable = false) => {
  const menu = readJson(MENU_KEY, demoMenu);
  if (!localStorage.getItem(MENU_KEY)) writeJson(MENU_KEY, demoMenu);
  return menu
    .filter((item) => includeUnavailable || item.isAvailable)
    .sort((a, b) => `${a.category}${a.name}`.localeCompare(`${b.category}${b.name}`));
};

export const saveLocalMenuItem = (input, editingId) => {
  const menu = getLocalMenu(true);
  const item = {
    ...input,
    _id: editingId || `menu_${Date.now()}`,
    price: Number(input.price),
    isAvailable: Boolean(input.isAvailable)
  };
  const next = editingId ? menu.map((entry) => (entry._id === editingId ? item : entry)) : [item, ...menu];
  writeJson(MENU_KEY, next);
  return item;
};

export const deleteLocalMenuItem = (id) => {
  writeJson(MENU_KEY, getLocalMenu(true).filter((item) => item._id !== id));
};

export const getLocalOrders = () =>
  readJson(ORDERS_KEY, []).sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

export const getLocalOrderById = (id) => getLocalOrders().find((order) => order.id === id || order._id === id);

export const createLocalOrder = ({ tableNo, customerName, items }) => {
  const menuMap = new Map(getLocalMenu().map((item) => [item._id, item]));
  const normalizedItems = items.map((item) => {
    const menuItem = menuMap.get(String(item.menuItem));
    if (!menuItem) throw new Error("One or more menu items are unavailable");
    const quantity = Math.max(Number(item.quantity) || 1, 1);
    return { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity, image: menuItem.image };
  });
  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fingerprint = `${tableNo}:${normalizedItems.map((item) => `${item.menuItem}x${item.quantity}`).join("|")}:${total}`;
  const recent = readJson(ORDER_LOCK_KEY, null);
  const now = Date.now();

  if (recent?.fingerprint === fingerprint && now - recent.timestamp < 8000) {
    const existing = getLocalOrderById(recent.id);
    if (existing) return existing;
  }

  const order = {
    id: `order_${now}`,
    _id: `order_${now}`,
    customerName,
    table: Number(tableNo),
    tableNo: String(tableNo),
    items: normalizedItems,
    total,
    status: "pending",
    timestamp: now,
    createdAt: new Date(now).toISOString()
  };
  writeJson(ORDERS_KEY, [order, ...getLocalOrders()]);
  writeJson(ORDER_LOCK_KEY, { fingerprint, timestamp: now, id: order.id });
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: order }));
  return order;
};

export const updateLocalOrderStatus = (id, status) => {
  const orders = getLocalOrders();
  const next = orders.map((order) => (order.id === id || order._id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order));
  writeJson(ORDERS_KEY, next);
  const updated = next.find((order) => order.id === id || order._id === id);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
  return updated;
};

export const getLocalAnalytics = () => {
  const orders = getLocalOrders();
  return orders.reduce(
    (summary, order) => {
      summary.totalOrders += 1;
      summary.revenue += Number(order.total) || 0;
      summary[order.status] = (summary[order.status] || 0) + 1;
      return summary;
    },
    { totalOrders: 0, revenue: 0, pending: 0, preparing: 0, served: 0 }
  );
};

export const subscribeToLocalOrders = (handler) => {
  const onCustom = (event) => handler(event.detail);
  const onStorage = (event) => {
    if (event.key === ORDERS_KEY) handler();
  };
  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
  };
};
