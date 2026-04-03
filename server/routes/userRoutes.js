const express = require("express");
const router = express.Router();
const { getProfile, loginUser, registerUser, updateProfile } = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:userId", getProfile);
router.patch("/:userId", updateProfile);

module.exports = router;