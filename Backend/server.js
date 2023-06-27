const express=require("express")
const dbconnect=require("./database/index")
const router=require("./router/index")
const errorHandling=require("./middleware/ErrorHandling")
const cookieParser = require("cookie-parser");

const {PORT} =require("./config/index")
const app =express();
app.use(cookieParser());
app.use(express.json())
app.use(router)
app.use("/storage",express.static("storage"))

dbconnect();
app.use(errorHandling)

// app.get("/",(req,res)=>{res.json({msg:"Hello World"})})
app.listen(PORT,console.log(`Backend is connected on ${PORT}`))
