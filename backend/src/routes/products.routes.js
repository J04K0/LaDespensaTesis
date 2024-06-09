import express from "express";
import {  getProducts,getProductById, addProduct,updateProduct,deleteProduct, } from "../controllers/products.controller.js";
const router = express.Router()

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   POST api/products
// @desc    Add a new product
// @access  Public
router.post('/', addProduct);

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
router.put('/:id', updateProduct);

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
router.delete('/:id', deleteProduct);

export default router;