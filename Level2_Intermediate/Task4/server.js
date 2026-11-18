
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3004;

// Temporary in-memory storage
const registrations = [];
let nextId = 1;

const allowedCourses = [
  "Full Stack Development",
  "Python Development",
  "Web Development"
];

const allowedExperiences = [
  "",
  "Beginner",
  "Intermediate",
  "Advanced"
];

const allowedSkills = [
  "HTML & CSS",
  "JavaScript",
  "Node.js",
  "Python",
  "Database"
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function validateRegistration(data) {
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const course = String(data.course || "").trim();
  const phone = String(data.phone || "").trim();
  const experience = String(data.experience || "").trim();
  const interest = String(data.interest || "").trim();

  const skills = Array.isArray(data.skills)
    ? data.skills
    : data.skills
      ? [data.skills]
      : [];

  if (!name || !email || !course || !phone) {
    return { error: "Please complete all required fields." };
  }

  if (name.length < 2 || name.length > 60) {
    return { error: "Name must contain 2 to 60 characters." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    return { error: "Phone number must contain exactly 10 digits." };
  }

  if (!allowedCourses.includes(course)) {
    return { error: "Please select a valid course." };
  }

  if (!allowedExperiences.includes(experience)) {
    return { error: "Please select a valid experience level." };
  }

  if (interest.length > 150) {
    return { error: "Course interest must be under 150 characters." };
  }

  if (
    !skills.every(skill => allowedSkills.includes(skill)) ||
    skills.length > allowedSkills.length
  ) {
    return { error: "Please select valid skills." };
  }

  return {
    value: {
      name,
      email,
      course,
      phone,
      experience: experience || "Not specified",
      interest: interest || "Not specified",
      skills
    }
  };
}

function renderHome(res, { message = "", error = "" } = {}, status = 200) {
  return res.status(status).render("index", {
    message,
    error,
    registrations
  });
}

// Web page
app.get("/", (req, res) => {
  renderHome(res);
});

// Existing HTML form submission
// Existing HTML form submission
app.post("/register", (req, res) => {
  const result = validateRegistration(req.body);

  if (result.error) {
    return renderHome(res, { error: result.error }, 400);
  }

  // Server-side password strength validation
  const password = String(req.body.password || "");

  const passwordIsStrong =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!passwordIsStrong) {
    return renderHome(
      res,
      {
        error: "Password must contain at least 8 characters, uppercase, lowercase, a number, and a special character."
      },
      400
    );
  }

  // Store registration details only. Never store the password.
  registrations.push({
    id: nextId++,
    ...result.value
  });

  return renderHome(res, {
    message: `Registration successful! Welcome, ${result.value.name}.`
  });
});

// ------------------------------------
// TASK 5 – REST API CRUD
// ------------------------------------

// READ: Get all registrations
app.get("/api/registrations", (req, res) => {
  res.json({
    success: true,
    count: registrations.length,
    data: registrations
  });
});

// READ: Get one registration
app.get("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const student = registrations.find(item => item.id === id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Registration not found."
    });
  }

  res.json({
    success: true,
    data: student
  });
});

// CREATE: Add registration through API
app.post("/api/registrations", (req, res) => {
  const result = validateRegistration(req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  const student = {
    id: nextId++,
    ...result.value
  };

  registrations.push(student);

  res.status(201).json({
    success: true,
    message: "Registration created successfully.",
    data: student
  });
});

// UPDATE: Edit registration
app.put("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = registrations.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Registration not found."
    });
  }

  const result = validateRegistration(req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  registrations[index] = {
    id,
    ...result.value
  };

  res.json({
    success: true,
    message: "Registration updated successfully.",
    data: registrations[index]
  });
});

// DELETE: Remove registration
app.delete("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = registrations.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Registration not found."
    });
  }

  const deletedStudent = registrations.splice(index, 1)[0];

  res.json({
    success: true,
    message: "Registration deleted successfully.",
    data: deletedStudent
  });
});

// Unknown route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Page or API route not found."
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

