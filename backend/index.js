const express = require("express");
const cors = require("cors");
const helloRoutes = require("./src/routes/helloRoutes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/", helloRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
