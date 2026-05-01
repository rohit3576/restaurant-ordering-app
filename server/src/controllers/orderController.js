import Menu from "../models/Menu.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  const { items = [], tableNo, customerName } = req.body;
  const demoStore = req.app.locals.demoStore;

  if (!items.length || !tableNo || !customerName) {
    return res.status(400).json({ message: "Items, table number, and name are required" });
  }

  if (demoStore) {
    const order = createDemoOrder(demoStore, { items, tableNo, customerName });
    if (!order) return res.status(400).json({ message: "One or more menu items are unavailable" });
    demoStore.orders.unshift(order);
    req.app.get("io").to("admin").emit("order:new", order);
    return res.status(201).json(order);
  }

  const ids = items.map((item) => item.menuItem);
  const menuItems = await Menu.find({ _id: { $in: ids }, isAvailable: true });
  const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));

  const normalizedItems = items.map((item) => {
    const menuItem = menuMap.get(String(item.menuItem));
    if (!menuItem) throw new Error("One or more menu items are unavailable");
    const quantity = Math.max(Number(item.quantity) || 1, 1);
    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      image: menuItem.image
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = await Order.create({ items: normalizedItems, total, tableNo, customerName });

  req.app.get("io").to("admin").emit("order:new", order);
  res.status(201).json(order);
};

export const getOrders = async (_req, res) => {
  const demoStore = _req.app.locals.demoStore;
  if (demoStore) {
    return res.json([...demoStore.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100));
  }

  const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const demoStore = req.app.locals.demoStore;
  if (demoStore) {
    const order = demoStore.orders.find((item) => item._id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Preparing", "Ready"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  const demoStore = req.app.locals.demoStore;
  if (demoStore) {
    const order = demoStore.orders.find((item) => item._id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status;
    order.updatedAt = new Date().toISOString();

    const io = req.app.get("io");
    io.to("admin").emit("order:update", order);
    io.to(`order:${order._id}`).emit("order:update", order);
    return res.json(order);
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) return res.status(404).json({ message: "Order not found" });

  const io = req.app.get("io");
  io.to("admin").emit("order:update", order);
  io.to(`order:${order._id}`).emit("order:update", order);
  res.json(order);
};

export const getAnalytics = async (_req, res) => {
  const demoStore = _req.app.locals.demoStore;
  if (demoStore) {
    const summary = demoStore.orders.reduce(
      (result, order) => {
        result.totalOrders += 1;
        result.revenue += order.total;
        result[order.status.toLowerCase()] += 1;
        return result;
      },
      { totalOrders: 0, revenue: 0, pending: 0, preparing: 0, ready: 0 }
    );
    return res.json(summary);
  }

  const [summary] = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        revenue: { $sum: "$total" },
        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        preparing: { $sum: { $cond: [{ $eq: ["$status", "Preparing"] }, 1, 0] } },
        ready: { $sum: { $cond: [{ $eq: ["$status", "Ready"] }, 1, 0] } }
      }
    }
  ]);

  res.json(summary || { totalOrders: 0, revenue: 0, pending: 0, preparing: 0, ready: 0 });
};

const createDemoOrder = (demoStore, { items, tableNo, customerName }) => {
  const menuMap = new Map(demoStore.menu.filter((item) => item.isAvailable).map((item) => [item._id, item]));
  const normalizedItems = [];

  for (const item of items) {
    const menuItem = menuMap.get(String(item.menuItem));
    if (!menuItem) return null;
    const quantity = Math.min(Math.max(Number(item.quantity) || 1, 1), 20);
    normalizedItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      image: menuItem.image
    });
  }

  return {
    _id: `order_${Date.now()}`,
    customerName: String(customerName).trim(),
    tableNo: String(tableNo).trim(),
    status: "Pending",
    items: normalizedItems,
    total: normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString()
  };
};
