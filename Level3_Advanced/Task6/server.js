const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = 3006;

const db = new DatabaseSync(path.join(__dirname, "students.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
  )
`);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "task6-development-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax" }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied: Admin permission required.");
  }
  next();
}

app.get("/", (req, res) => {
  res.render("index", {
    user: req.session.user || null,
    message: "",
    error: ""
  });
});

app.post("/register", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (name.length < 2 || name.length > 60 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8) {
    return res.status(400).render("index", {
      user: null,
      message: "",
      error: "Enter a valid name, email and password of at least 8 characters."
    });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  try {
    db.prepare(
      "INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)"
    ).run(name, email, passwordHash, salt);

    res.render("index", {
      user: null,
      message: "Account created successfully. Please log in.",
      error: ""
    });
  } catch (err) {
    res.status(400).render("index", {
      user: null,
      message: "",
      error: "This email may already be registered."
    });
  }
});

app.post("/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) {
    return res.status(401).render("index", {
      user: null,
      message: "",
      error: "Invalid email or password."
    });
  }

  const submittedHash = Buffer.from(hashPassword(password, user.salt), "hex");
  const storedHash = Buffer.from(user.password_hash, "hex");

  if (!crypto.timingSafeEqual(submittedHash, storedHash)) {
    return res.status(401).render("index", {
      user: null,
      message: "",
      error: "Invalid email or password."
    });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.redirect("/dashboard");
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("index", {
    user: req.session.user,
    message: "You are logged in successfully.",
    error: ""
  });
});

app.get("/api/profile", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

app.get("/admin", requireAuth, requireAdmin, (req, res) => {
  res.send("Welcome to the admin area.");
});

app.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Task 6 running at http://localhost:${PORT}`);
});
