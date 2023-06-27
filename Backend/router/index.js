const express = require("express");
const router = express.Router();
const authController = require("../authController/authController");
const blogController=require("../authController/blogController")
const commentController=require("../authController/commentController")
const auth = require("../authController/auth")
//Test


// router.get("/test", (req, res) => {
//     res.json({ msg: "Working!" });
//   });


//register
router.post("/register", authController.register)
//loginru
router.post("/login", authController.login)
//logout
router.post("/logout", auth, authController.logout)
//refresh
router.get("/refresh", authController.refresh)

//Blog

//create

router.post("/blog",auth,blogController.create)

//get all notes
router.get("/blog/all",auth, blogController.getAll)
//Get by ID
router.get("/blog/:id",auth,blogController.getById)
//update
router.put("/blog",auth,blogController.update)

//Delete

router.delete("/blog/:id",auth,blogController.delete)

//comment

//create
router.post("/comment",auth,commentController.create)
//getByID

router.get("/comment/:id",auth,commentController.getById)
module.exports = router