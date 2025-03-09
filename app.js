const express = require("express");
require("dotenv").config();

const PORT = process.env.APP_PORT;

const app = express();
app.listen(PORT, () => {
  console.log(`listening to: http://localhost:${PORT}`);
});
