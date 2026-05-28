// src/routes/accountRoutes.js
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");

// Cấu hình Endpoint: GET http://localhost:3000/api/account/checkout-info/:maND
router.get("/checkout-info/:maND", accountController.getCheckoutProfile);

module.exports = router;
