const express = require("express");
const router = express.Router();
const {
  getHello,
  getHelloComponent,
} = require("../controllers/helloController");

router.get("/hello", getHello);
router.get("/hello-component", getHelloComponent);

module.exports = router;
