const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* =========================
   Counter Schema (Internal)
========================= */
const counterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Number,
    default: 0,
  },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* =========================
   Order Schema
========================= */
const orderSchema = new Schema(
  {
    order_id: {
      type: Number,
      unique: true,
      index: true,
    },

    // 🔥 STORE AUTO INCREMENT ID (NOT ObjectId)
    kid_id: {
      type: Number,
      required: true,
    },

    experiment_id: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "delivered"],
      default: "pending",
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* =========================
   Auto Increment Hook
========================= */
orderSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "order_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.order_id = counter.value;
});

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);