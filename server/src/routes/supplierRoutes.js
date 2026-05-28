const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

// Route: http://localhost:3000/api/suppliers
router.get("/", supplierController.getAllSuppliers);
router.get("/:id", supplierController.getSupplierById);
router.post("/add", supplierController.createSupplier);
router.put("/update/:id", supplierController.updateSupplier);
router.delete("/delete/:id", supplierController.deleteSupplier);

module.exports = router;
