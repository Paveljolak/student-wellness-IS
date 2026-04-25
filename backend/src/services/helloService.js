const getHelloMessage = () => {
  return { message: "Hello from main page!" };
};

const getHelloComponentMessage = () => {
  return { message: "Hello from the component!" };
};

module.exports = { getHelloMessage, getHelloComponentMessage };
