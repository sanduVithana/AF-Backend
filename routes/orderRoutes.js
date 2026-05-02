const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Kid place order
router.post("/", authMiddleware(["kid"]), orderController.placeOrder);

// Admin get orders
router.get("/", authMiddleware(["admin"]), orderController.getAllOrders);
router.get("/:experimentId", authMiddleware(["admin"]), orderController.getOrdersByExperiment);

// Admin update order status
router.patch("/:orderId/status", authMiddleware(["admin"]), orderController.updateOrderStatus);

module.exports = router;
