const {
  getHelloMessage,
  getHelloComponentMessage,
} = require("../services/helloService");

const getHello = (req, res) => {
  const data = getHelloMessage();
  res.json(data);
};

const getHelloComponent = (req, res) => {
  const data = getHelloComponentMessage();
  res.json(data);
};

module.exports = { getHello, getHelloComponent };
