import Razorpay from "razorpay";

export const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(400).json({ message: "Razorpay test keys are not configured" });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`
  });

  res.json({ ...order, keyId });
};
