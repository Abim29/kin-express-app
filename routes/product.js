const express = require("express");
const productController = require("../controllers/product");
const router = express.Router();

const isAuth = require("../middleware/is-auth");

router.get("/", productController.getProducts);
router.post("/", isAuth, productController.postProduct);
router.get("/:id", productController.getProductDetail);
router.put("/:id", isAuth, productController.updateProduct);
router.delete("/:id", isAuth, productController.deleteProduct);
module.exports = router;
