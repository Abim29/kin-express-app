const Product = require("../models/product");

exports.getProducts = async (req, res, next) => {
  const currentPage = +req.query.page || 1;
  const perPage = 1;
  const search = req.query.search || "";
  try {
    const totalProducts = await Product.countDocuments({
      title: { $regex: search, $options: "i" },
    });

    const products = await Product.find({
      title: { $regex: search, $options: "i" },
    })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Success",
      totalPage: Math.ceil(totalProducts / perPage),
      currentPage,
      hasNextPage: perPage * currentPage < totalProducts,
      hasPreviousPage: currentPage > 1,
      nextPage: currentPage + 1,
      previousPage: currentPage - 1,
      products: products,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.postProduct = async (req, res, next) => {
  if (!req.file) {
    const error = new Error("No image provided!");
    error.statusCode = 422;
    return next(error);
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const { title, price, description, category } = req.body;
  const product = new Product({
    title,
    price,
    description,
    category,
    imageUrl,
  });
  try {
    const result = await product.save();
    res.status(201).json({
      message: "Product added successfully",
      product: {
        _id: result._id,
        title: result.title,
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getProductDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Success", product });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { title, price } = req.body;
  try {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found!");
      error.statusCode = 404;
      throw error;
    }
    product.title = title;
    product.price = price;
    const result = await product.save();
    res
      .status(200)
      .json({ message: "Update product successful", product: result });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Could not find any product!");
      error.statusCode = 404;
      throw error;
    }
    const result = await Product.findByIdAndDelete(id);
    res.status(200).json({
      message: "Product deleted!",
      product: { _id: result._id },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
