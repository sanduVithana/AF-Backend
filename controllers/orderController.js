const Order = require("../models/Order");
const User = require("../models/User");
const Experiment = require("../models/Experiment");
const nodemailer = require("nodemailer");

const APP_NAME = process.env.APP_NAME || "MiniMinds";
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function fromLine() {
  return `"${APP_NAME}" <${FROM_EMAIL}>`;
}

function orderEmailTemplate({ kidName, experimentTitle, quantity, notes, price, total }) {
  return `
  <div style="background:#f6f9fc;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:650px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.08)">
      <tr>
        <td style="padding:18px 22px;background:linear-gradient(90deg,#0ea5e9,#10b981);color:#ffffff;">
          <div style="font-size:18px;font-weight:800;">${APP_NAME}</div>
          <div style="font-size:13px;opacity:0.95;margin-top:2px;">Science Kit Order Confirmation</div>
        </td>
      </tr>

      <tr>
        <td style="padding:22px;">
          <h2 style="margin:0 0 10px 0;color:#0f172a;font-size:22px;">Order placed successfully ✅</h2>

          <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
            Hi <b>${kidName || "Student"}</b> 👋,<br/>
            Your science kit order has been received. Here are the details:
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-top:16px;">
            <div style="font-weight:900;color:#0f172a;margin-bottom:8px;">📦 Order Details</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
              <tr>
                <td style="padding:6px 0;"><b>Experiment</b></td>
                <td style="padding:6px 0;text-align:right;">${experimentTitle}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><b>Quantity</b></td>
                <td style="padding:6px 0;text-align:right;">${quantity}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><b>Price/kit</b></td>
                <td style="padding:6px 0;text-align:right;">LKR ${price.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><b>Total</b></td>
                <td style="padding:6px 0;text-align:right;">LKR ${total.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><b>Notes</b></td>
                <td style="padding:6px 0;text-align:right;">${notes || "None"}</td>
              </tr>
            </table>

          <p style="margin:16px 0 0 0;color:#334155;font-size:14px;line-height:1.6;">
            We’re excited to help you learn through hands-on experiments! 🚀
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:16px 22px;background:#f1f5f9;color:#64748b;font-size:12px;line-height:1.6;">
          <div><b>${APP_NAME}</b> • Made for Kids • SDG 4 Quality Education</div>
          <div style="margin-top:6px;">This is an automated email. If you didn’t place this order, please contact support.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

/* =========================
   PLACE ORDER (Kid)
========================= */
exports.placeOrder = async (req, res) => {
  try {
    const { kid_id, experiment_id, quantity, notes } = req.body;

    if (!kid_id || !experiment_id) {
      return res.status(400).json({ message: "kid_id and experiment_id are required" });
    }

    const kid = await User.findOne({ user_id: kid_id });
    if (!kid) return res.status(404).json({ message: "Kid not found" });

    const experiment = await Experiment.findOne({ experiment_id: experiment_id });
    if (!experiment) return res.status(404).json({ message: "Experiment not found" });

    const order = new Order({
      kid_id,
      experiment_id,
      quantity: quantity ?? 1,
      notes: notes ?? "",
    });

    const savedOrder = await order.save();

    // ✅ Send email AFTER saving order
    if (kid.email) {
      try {
        const transporter = createTransporter();

        const kitPrice = experiment.price || 0;
        const totalAmount = kitPrice * savedOrder.quantity;

        await transporter.sendMail({
          from: fromLine(),
          to: kid.email,
          subject: `${APP_NAME} — Order Confirmation ✅`,
          html: orderEmailTemplate({
            kidName: kid.name,
            experimentTitle: experiment.title,
            quantity: savedOrder.quantity,
            notes: savedOrder.notes,
            price: kitPrice,
            total: totalAmount,
          }),
        });
      } catch (emailError) {
        console.log("⚠ Email failed:", emailError.message);
      }
    }

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ORDER STATUS (Admin)
========================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "cancelled", "delivered"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findOneAndUpdate(
      { order_id: Number(req.params.orderId) },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ORDERS BY EXPERIMENT (Admin)
========================= */
exports.getOrdersByExperiment = async (req, res) => {
  try {
    const experimentIdNumber = Number(req.params.experimentId);

    if (isNaN(experimentIdNumber)) {
      return res.status(400).json({ message: "Invalid experiment ID" });
    }

    const experiment = await Experiment.findOne({ experiment_id: experimentIdNumber });
    if (!experiment) return res.status(404).json({ message: "Experiment not found" });

    const orders = await Order.find({ experiment_id: experimentIdNumber });

    res.json({
      experiment: experiment.title,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ALL ORDERS (Admin)
========================= */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({ path: 'experiment_id', model: 'Experiment', localField: 'experiment_id', foreignField: 'experiment_id', select: 'title' })
      .populate({ path: 'kid_id', model: 'User', localField: 'kid_id', foreignField: 'user_id', select: 'name email' });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};