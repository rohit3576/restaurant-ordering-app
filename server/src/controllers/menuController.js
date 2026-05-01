import Menu from "../models/Menu.js";

export const getMenu = async (_req, res) => {
  const demoStore = _req.app.locals.demoStore;
  if (demoStore) {
    return res.json(demoStore.menu.filter((item) => item.isAvailable).sort(sortMenu));
  }

  const items = await Menu.find({ isAvailable: true }).sort({ category: 1, name: 1 });
  res.json(items);
};

export const getAllMenu = async (_req, res) => {
  const demoStore = _req.app.locals.demoStore;
  if (demoStore) {
    return res.json([...demoStore.menu].sort(sortMenu));
  }

  const items = await Menu.find().sort({ category: 1, name: 1 });
  res.json(items);
};

export const createMenuItem = async (req, res) => {
  const demoStore = req.app.locals.demoStore;
  if (demoStore) {
    const item = normalizeMenuInput(req.body);
    item._id = `menu_${Date.now()}`;
    item.createdAt = new Date().toISOString();
    demoStore.menu.unshift(item);
    return res.status(201).json(item);
  }

  const item = await Menu.create(req.body);
  res.status(201).json(item);
};

export const updateMenuItem = async (req, res) => {
  const demoStore = req.app.locals.demoStore;
  if (demoStore) {
    const index = demoStore.menu.findIndex((item) => item._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Menu item not found" });
    demoStore.menu[index] = { ...demoStore.menu[index], ...normalizeMenuInput(req.body, true) };
    return res.json(demoStore.menu[index]);
  }

  const item = await Menu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.json(item);
};

export const deleteMenuItem = async (req, res) => {
  const demoStore = req.app.locals.demoStore;
  if (demoStore) {
    const before = demoStore.menu.length;
    demoStore.menu = demoStore.menu.filter((item) => item._id !== req.params.id);
    if (demoStore.menu.length === before) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ message: "Menu item deleted" });
  }

  const item = await Menu.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.json({ message: "Menu item deleted" });
};

const sortMenu = (a, b) => `${a.category}${a.name}`.localeCompare(`${b.category}${b.name}`);

const normalizeMenuInput = (body, partial = false) => {
  const item = {};
  if (!partial || body.name !== undefined) item.name = String(body.name || "").trim();
  if (!partial || body.category !== undefined) item.category = String(body.category || "").trim();
  if (!partial || body.image !== undefined) item.image = String(body.image || "").trim();
  if (!partial || body.description !== undefined) item.description = String(body.description || "").trim();
  if (!partial || body.price !== undefined) item.price = Number(body.price);
  if (!partial || body.isAvailable !== undefined) item.isAvailable = Boolean(body.isAvailable);

  if (!partial && (!item.name || !item.category || !item.image || !Number.isFinite(item.price) || item.price <= 0)) {
    throw new Error("Name, category, image, and a valid price are required");
  }

  return item;
};
