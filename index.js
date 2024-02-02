// Import the Express library
const express = require('express');
const cors = require("cors");


// Require the configuration file for the database
require('./db/config');

// Require the User model from the database
const User = require("./db/User");
// import the Product model from the database
const Product=require("./db/Product")

const Jwt=require('jsonwebtoken');  // importing the json Web Token
 const jwtKey='e-comm';     //defining a key for our token

// Create an instance of the Express application
const app = express();

// Use JSON middleware to parse incoming JSON requests
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 5000;
// Define a route to handle POST requests for creating a new user
app.post("/user", async (req, resp) => {
    // Create a new User instance with the request body
    let user = new User(req.body);

    // Save the user to the database and wait for the result
    let result = await user.save();
    result=result.toObject();  // to remove the password field shown to the user
    delete result.password

    // Send the result as a response
                
        Jwt.sign({result},jwtKey,{expiresIn:"2h"}, (err,token)=>{
            if(err){
                resp.send({result : "Something went wrong ,Please try after some time"})
            }
            resp.send({result,auth: token});  //sending the user as well as the token with response as a object
        })             
});

// define a route to handle POST requests for login a user

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password"); // matches the data that comes from user with the database with findOne method
                                                             // and removes the password field from the user so that the passwrd details are credential
        if (user) {             
            Jwt.sign({user},jwtKey,{expiresIn:"2h"}, (err,token)=>{
                if(err){
                    resp.send({result : "Something went wrong ,Please try after some time"})
                }
                resp.send({user,auth: token});  //sending the user as well as the token with response as a object
            })                                      
            
        }
        else {
            resp.send({result :"No user Found"})
        }
    }

    else {
        resp.send({result :"No user Found"})
    }
})

app.post("/add-product",verifyToken,async(req,resp)=>{
    let product= new Product(req.body);
    let result=await product.save();
    resp.send(result)
});


app.get("/products",verifyToken,async (req,resp)=>{
    let products= await Product.find(); // find method gets all the products from the Product Schema
    if(products.length>0){
        resp.send(products)
    }
    else{
        resp.send({result :"No products found"});
    }
});


//creating a route for deleting a product from database
app.delete("/product/:id",verifyToken,async (req,resp)=>{
   
    const result= await Product.deleteOne({_id:req.params.id})   
    resp.send(result);                    // deleteOne method is for deleting one record from collection
});

app.get("/product/:id",verifyToken,async (req,resp)=>{
     let result=await Product.findOne({_id:req.params.id});   //findOne method is for finding one record that is given by database
     if(result){
     resp.send(result)
     }
     else{
        resp.send({result: "No Record found"})
     }
});

// Make a new route for Update Product API
app.put("/product/:id",verifyToken,async(req,resp)=>{
    let result=await Product.updateOne(    // updateOne method is used to update the data of one product and it takes 2 parameters
                                            // one is on the basis of which we have to update the product 
        {_id:req.params.id},
        {
           $set: req.body
        }
    )
    resp.send(result)
});
// Seacrh ApI for Product
//defining a route for searching the product
app.get("/search/:key",verifyToken,async(req,resp)=>{   // adding the middleware verifyToken in search API 
    let result=await Product.find({
        "$or":[
            {name:{$regex:req.params.key}},
            {company:{$regex : req.params.key}},
            {category:{$regex:req.params.key}}
        ]
    });
    resp.send(result)
})
// adding a middleware for authenticating the token
function verifyToken(req,resp,next){
    let token=req.headers['authorization'];
    if(token){
        token=token.split(' ')[1];   // tokens are passsed with bearer tokencode
        //console.warn("middleware called if",token)
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({result: "Please provide valid token"})
            }
            else{
                next();
            }
        })

    }
    else{
        resp.status(403).send({result: "Please add token with header"})
    }
}

// Start the server and listen on port 5000
app.listen(port);
