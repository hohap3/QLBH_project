// src/routes/checkoutRoutes.js
const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
// const verifyToken = require("../middlewares/authMiddleware"); // Middleware xác thực sau này nếu làm nâng cao

// Nếu dùng middleware sau này: router.post("/process", verifyToken, checkoutController.createCheckoutOrder);
router.post("/process", checkoutController.createCheckoutOrder);

module.exports = router;
