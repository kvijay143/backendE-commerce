// define a Product Schema for Products Collection
// Require the Mongoose library
const mongoose = require('mongoose');

// Define the user schema with name, email, and password fields
const productSchema = new mongoose.Schema({
    name: String,
    price: String,
    category: String,
    userId : String,
    company :String
});

// Export the products model based on the schema
module.exports = mongoose.model("products", productSchema);