const express = require("express");
const path = require("path");

const app = express();
const PORT = 3003;

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Task 3 running at http://localhost:${PORT}`);
});
