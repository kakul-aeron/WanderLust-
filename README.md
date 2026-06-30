# WanderLust

WanderLust is a full-stack travel and stay booking web application built with Node.js, Express, MongoDB, and EJS. It allows users to browse listings, search and filter stays, create bookings, leave reviews, manage accounts, and interact with an AI-powered assistant for travel-related queries.

## Features

- Browse and search accommodation listings
- Filter listings by category and search terms
- Create, edit, and delete listings
- User authentication and account management
- Booking flow for available stays
- Review system for completed stays
- Image upload support via Cloudinary
- Email and SMS integration for notifications
- AI chat endpoint powered by Groq

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- EJS templates
- Passport.js for authentication
- Cloudinary for image storage
- SendGrid / SMTP for email
- Twilio for SMS

## Project Structure

- app.js - Main Express server and app configuration
- controllers/ - Route handlers for listings, bookings, reviews, and users
- models/ - Mongoose schemas and models
- routes/ - Express route definitions
- views/ - EJS templates for the UI
- public/ - Static assets such as CSS and JavaScript
- utils/ - Helper modules for mail, SMS, booking status, and errors

## Prerequisites

- Node.js 20.x
- MongoDB Atlas or a local MongoDB instance
- Cloudinary account (for image uploads)
- Optional: SendGrid or SMTP credentials for email
- Optional: Twilio credentials for SMS
- Optional: Groq API key for AI chat features

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the project root with the required environment variables.

## Environment Variables

Create a .env file with values similar to the following:

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust
SESSION_SECRET=your-session-secret
GROQ_API_KEY=your-groq-api-key

CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email-user
MAIL_PASS=your-email-password
MAIL_FROM=your-from-address
SENDGRID_API_KEY=your-sendgrid-api-key

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=your-twilio-number
```

## Running the App

Start the development server:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The app will run on:

```text
http://localhost:8080
```

## Notes

- If MongoDB Atlas is used, make sure your network access and credentials are configured correctly.
- Cloudinary, email, and SMS features are optional but recommended for the full experience.
- The app redirects the root URL to the listings page by default.

## License

ISC
