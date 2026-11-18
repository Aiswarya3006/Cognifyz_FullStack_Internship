require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const { rateLimit } = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "task7-development-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax" }
}));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const oauthEnabled = Boolean(
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET
);

if (oauthEnabled) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL ||
      "http://localhost:3007/auth/github/callback"
  }, (accessToken, refreshToken, profile, done) => {
    done(null, {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName
    });
  }));
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many API requests. Please try again after one minute."
  }
});

app.get("/", (req, res) => {
  res.render("index", {
    user: req.user || null,
    oauthEnabled,
    message: req.query.oauth === "disabled"
      ? "GitHub OAuth is not configured. Add credentials to .env to enable it."
      : req.query.oauth === "failed"
      ? "GitHub authentication failed. Please try again."
      : ""
  });
});

app.get("/auth/github", (req, res, next) => {
  if (!oauthEnabled) {
    return res.redirect("/?oauth=disabled");
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

app.get("/auth/github/callback",
  (req, res, next) => {
    if (!oauthEnabled) return res.redirect("/?oauth=disabled");
    next();
  },
  passport.authenticate("github", { failureRedirect: "/?oauth=failed" }),
  (req, res) => res.redirect("/")
);

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get("/api/github/:username", apiLimiter, async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();

    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid GitHub username."
      });
    }

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Cognifyz-Task7-App"
        },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "GitHub user not found."
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "GitHub API request failed."
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      user: {
        username: data.login,
        name: data.name,
        bio: data.bio,
        publicRepos: data.public_repos,
        followers: data.followers,
        profileUrl: data.html_url,
        avatarUrl: data.avatar_url
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Page or API route not found."
  });
});

app.use((err, req, res, next) => {
  console.error("Application error:", err.message);

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`Task 7 server running at http://localhost:${PORT}`);
  console.log(`GitHub OAuth: ${oauthEnabled ? "Enabled" : "Not configured (demo mode)"}`);
});
