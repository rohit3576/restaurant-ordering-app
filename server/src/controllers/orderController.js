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
    const duplicate = findRecentDuplicate(demoStore.orders, order);
    if (duplicate) return res.status(200).json(duplicate);
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
  const recentOrders = await Order.find({
    tableNo: String(tableNo).trim(),
    customerName: String(customerName).trim(),
    total,
    createdAt: { $gte: new Date(Date.now() - 8000) }
  }).sort({ createdAt: -1 });
  const duplicate = recentOrders.find((recent) => sameItems(recent.items, normalizedItems));
  if (duplicate) return res.status(200).json(duplicate);

  const order = await Order.create({ items: normalizedItems, total, tableNo, customerName });

  req.app.get("io").to("admin").emit("order:new", order);
  res.status(201).json(order);
};

const sameItems = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  const serialize = (items) =>
    items
      .map((item) => `${item.menuItem}:${item.quantity}:${item.price}`)
      .sort()
      .join("|");
  return serialize(left) === serialize(right);
};

const findRecentDuplicate = (orders, order) =>
  orders.find(
    (recent) =>
      String(recent.tableNo) === String(order.tableNo) &&
      recent.customerName === order.customerName &&
      recent.total === order.total &&
      Date.now() - new Date(recent.createdAt).getTime() < 8000 &&
      sameItems(recent.items, order.items)
  );

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
  const allowedStatuses = ["pending", "preparing", "served"];
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
      { totalOrders: 0, revenue: 0, pending: 0, preparing: 0, served: 0 }
    );
    return res.json(summary);
  }

  const [summary] = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        revenue: { $sum: "$total" },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        preparing: { $sum: { $cond: [{ $eq: ["$status", "preparing"] }, 1, 0] } },
        served: { $sum: { $cond: [{ $eq: ["$status", "served"] }, 1, 0] } }
      }
    }
  ]);

  res.json(summary || { totalOrders: 0, revenue: 0, pending: 0, preparing: 0, served: 0 });
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
    status: "pending",
    items: normalizedItems,
    total: normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString()
  };
};
