# Task 7 - OAuth, External API, Rate Limiting and Error Handling

## Features
- GitHub OAuth login using Passport and passport-github2.
- GitHub public profile lookup using the GitHub REST API.
- API rate limiting: 10 requests per minute.
- Input validation and API error handling.
- Express 404 and centralized error middleware.

## Run
npm install
npm start

Open http://localhost:3007

## Optional GitHub OAuth configuration
Create a .env file with:
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3007/auth/github/callback
SESSION_SECRET=your_random_secret

OAuth remains in demo mode until valid GitHub OAuth credentials are configured.
