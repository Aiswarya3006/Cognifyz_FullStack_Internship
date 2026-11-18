
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Display registration form
app.get("/", (req, res) => {
  res.render("index", { message: "" });
});

// Handle form submission
app.post("/register", (req, res) => {
  const { name, email, course } = req.body;

  res.render("index", {
    message: `Thank you, ${name}! Your registration was received for ${course}.`
  });
});

app.listen(PORT, () => {
  console.log(`Task 1 server running at http://localhost:${PORT}`);
});
