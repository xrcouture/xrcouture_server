const express = require("express");
const router = express.Router();

const {
  signUp,
  signIn,
  signOut,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setBrandProfile,
  setCookie
} = require("../controllers/authcontroller");

const { authenticateUser } = require("../middleware/authentication");

router.post("/signup", signUp);
router.post("/signin", signIn);
router.delete("/signout", /*authenticateUser,*/ signOut);
router.post("/verify-email", verifyEmail);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);
router.post("/form", /*authenticateUser, */setBrandProfile);
router.get("/setcookie", setCookie)

module.exports = router;
