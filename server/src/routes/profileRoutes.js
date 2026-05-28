const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");

// Đường dẫn: GET http://localhost:3000/api/profile/:maND
router.get("/:maND", ProfileController.getProfile);

// Đường dẫn: PUT http://localhost:3000/api/profile/update/:maND
router.put("/update/:maND", ProfileController.updateProfile);

// Đường dẫn: PUT http://localhost:3000/api/profile/change-password/:maND
router.put("/change-password/:maND", ProfileController.changePassword);

module.exports = router;
