import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "preparing", "served"],
      default: "pending"
    },
    tableNo: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
