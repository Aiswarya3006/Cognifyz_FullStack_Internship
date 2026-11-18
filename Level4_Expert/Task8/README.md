# Task 8 - TaskFlow Background Job Manager

## Overview
A task management application demonstrating Express middleware, scheduled background jobs and API response caching.

## Features
- Request ID middleware
- HTTP request logging and response timing
- Security response headers
- Scheduled background job using node-cron (every minute)
- Dashboard API caching with 30-second TTL
- Cache invalidation when tasks change
- Task creation and completion
- Health check API
- Centralized 404 and error handling

## Technologies
- Node.js
- Express.js
- EJS
- node-cron
- HTML and CSS

## Run
npm install
npm start

Open http://localhost:3008

## API endpoints
- GET /api/dashboard
- GET /api/health

## Note
Tasks and cache data are stored in memory for this demonstration. Data resets when the server restarts.
