const express = require("express");
const path = require("path");
const app = express();
const PORT = 3002;
const students = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", { message: "", error: "", students });
});

app.post("/register", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const course = String(req.body.course || "").trim();

  let error = "";
  if (name.length < 2 || name.length > 60) error = "Name must contain 2 to 60 characters.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Enter a valid email.";
  else if (!course) error = "Please select a course.";
  else if (students.some(s => s.email === email)) error = "Email already registered.";

  if (error) return res.status(400).render("index", { message: "", error, students });

  students.push({ id: students.length + 1, name, email, course });
  res.render("index", { message: "Registration successful!", error: "", students });
});

app.listen(PORT, () => console.log(`Task 2 running at http://localhost:${PORT}`));
