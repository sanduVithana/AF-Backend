# MiniMinds Backend

Secure RESTful API for the **MiniMinds Kids Science Learning Platform**.

This backend powers kid authentication, admin management, science experiments, tutorials, quizzes, progress tracking, feedback submission, and science kit ordering.

## Features

- JWT-based authentication and role-based authorization
- Kid registration with profile image upload
- Admin account creation and kid account management
- Experiment management with image upload
- Tutorial management with step-by-step learning content
- YouTube video search and tutorial video linking
- Quiz creation, quiz submission, and result tracking
- Progress tracking with badge awarding
- Feedback submission and management
- Science kit ordering with email confirmation
- Email verification and password reset via email
- MongoDB integration with Mongoose models
- Cloudinary image storage

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- bcryptjs
- Nodemailer
- Cloudinary
- Multer + multer-storage-cloudinary
- CORS
- dotenv

## Folder Structure

```text
Backend/
├── config/
│   └── cloudinary.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── experimentController.js
│   ├── feedback.controller.js
│   ├── orderController.js
│   ├── progress.controller.js
│   ├── quizController.js
│   ├── tutorialController.js
│   └── youtubeController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── tutorialAuth.js
│   └── uploadMiddleware.js
├── models/
│   ├── Experiment.js
│   ├── Order.js
│   ├── Quiz.js
│   ├── QuizResult.js
│   ├── Tutorial.js
│   ├── User.js
│   ├── feedback.model.js
│   └── progress.model.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── experimentRoutes.js
│   ├── feedback.routes.js
│   ├── orderRoutes.js
│   ├── progress.routes.js
│   ├── quizRoutes.js
│   ├── tutorialRoutes.js
│   └── youtubeRoutes.js
├── utils/
│   ├── mailer.js
│   └── validSteps.js
├── router.js
├── server.js
└── package.json
```

## Functional Modules

### 1. Authentication and User Management
- Kid registration
- Login with JWT
- Fetch current profile
- Update profile
- Delete own account
- Change password
- Email verification
- Forgot password / reset password

### 2. Admin Management
- Seed first admin
- Create new admin
- View all kid accounts
- Activate / deactivate kids

### 3. Experiments
- Create experiment
- View all experiments
- View single experiment
- Update experiment
- Delete experiment

### 4. Tutorials
- Create tutorial for an experiment
- Update tutorial
- Delete tutorial
- Get tutorial details
- Get tutorial steps only
- List tutorials by experiment
- Link selected YouTube video to a tutorial

### 5. Quizzes
- Create quiz per experiment
- Update quiz
- Delete quiz
- Get quiz for a kid/admin without answers
- Submit quiz answers
- View kid quiz history
- View results by experiment

### 6. Progress Tracking
- Mark experiment as completed
- View logged-in kid progress
- View all progress records as admin
- Automatic badge assignment:
  - Beginner Scientist
  - Junior Explorer
  - Senior Innovator
  - Master Scientist

### 7. Feedback
- Submit one feedback per experiment per kid
- View feedback for one experiment
- View own feedback
- Update feedback
- Delete feedback
- Admin view for all feedback

### 8. Orders
- Place science kit order
- Admin view all orders
- Admin filter orders by experiment
- Admin update order status

## External APIs and Services Used

### 1. YouTube Data API
Used to search educational YouTube videos and attach a selected video to a tutorial.

## Environment Variables

Create a `.env` file inside the `Backend` folder.

```env
PORT=5000
DB_URI=your_mongodb_connection_string

SECRET_KEY=your_jwt_secret
TOKEN_EXPIRES_IN=24h

APP_URL=http://localhost:5000
APP_NAME=MiniMinds

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

YOUTUBE_API_KEY=your_youtube_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Installation and Setup

```bash
git clone <your-repository-url>
cd AF-Project-feature-user-management/Backend
npm install
npm start
```

Server runs on:

```text
http://localhost:5000
```

Base API URL:

```text
http://localhost:5000/api
```

## Authentication

Protected routes require a JWT token.

```http
Authorization: Bearer <token>
```

## Roles

- `admin`
- `kid`

## API Endpoints

### Auth Routes
Base path: `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register-kid` | Public | Register a kid with optional profile image |
| POST | `/login` | Public | Login and receive JWT |
| GET | `/me` | Admin, Kid | Get current user profile |
| PUT | `/me` | Admin, Kid | Update current user profile |
| DELETE | `/me` | Admin, Kid | Delete own account |
| PUT | `/change-password` | Admin, Kid | Change logged-in user password |
| GET | `/verify/:token` | Public | Verify email |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password/:token` | Public | Reset password |

### Admin Routes
Base path: `/api/admin`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/seed-admin` | Public/initial setup | Create first admin |
| POST | `/create-admin` | Admin | Create another admin |
| GET | `/kids` | Admin | List all kids |
| PATCH | `/user/:id/status` | Admin | Activate or deactivate a user |

### Experiment Routes
Base path: `/api/experiments`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Get all experiments |
| GET | `/:id` | Public | Get experiment by `experiment_id` |
| POST | `/` | Admin | Create experiment with optional image |
| PUT | `/:id` | Admin | Update experiment |
| DELETE | `/:id` | Admin | Delete experiment |

### Tutorial Routes
Base path: `/api/tutorials`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Admin | Create tutorial |
| PUT | `/:id` | Admin | Update tutorial |
| DELETE | `/:id` | Admin | Delete tutorial |
| GET | `/experiment/:experimentId` | Admin, Kid | List tutorials by experiment |
| GET | `/:id` | Admin, Kid | Get tutorial details |
| GET | `/:id/steps` | Admin, Kid | Get tutorial steps only |
| PATCH | `/:id/youtube/select` | Admin | Attach selected YouTube video |

### YouTube Routes
Base path: `/api/youtube`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/search?q=<query>&max=6&tutorialId=<id>` | Admin, Kid | Search YouTube videos |

### Quiz Routes
Base path: `/api/quizzes`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | Get all quizzes |
| POST | `/` | Admin | Create quiz |
| PUT | `/:quiz_id` | Admin | Update quiz |
| DELETE | `/:quiz_id` | Admin | Delete quiz and related results |
| GET | `/experiment/:experiment_id` | Admin, Kid | Get active quiz without correct answers |
| POST | `/:quiz_id/submit` | Kid | Submit quiz answers |
| GET | `/my-results` | Kid | Get own quiz result history |
| GET | `/experiment/:experiment_id/results` | Admin | Get results for an experiment |

### Feedback Routes
Base path: `/api/feedback`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Kid | Submit feedback |
| GET | `/experiment/:experimentId` | Public | Get feedback for an experiment |
| GET | `/my` | Kid | Get logged-in kid feedback |
| PUT | `/:id` | Kid, Admin | Update feedback |
| DELETE | `/:id` | Kid, Admin | Delete feedback |
| GET | `/admin/all` | Admin | Get all feedback |

### Progress Routes
Base path: `/api/progress`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/complete/:experimentId` | Kid | Mark an experiment as completed |
| GET | `/my` | Kid | Get logged-in kid progress |
| GET | `/admin/all` | Admin | Get all kids' progress |

### Order Routes
Base path: `/api/orders`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Kid | Place an order |
| GET | `/` | Admin | Get all orders |
| GET | `/:experimentId` | Admin | Get orders for one experiment |
| PATCH | `/:orderId/status` | Admin | Update order status |

## Example Requests

### Register Kid
```http
POST /api/auth/register-kid
Content-Type: multipart/form-data
```

Fields:
- `email`
- `password`
- `name`
- `age`
- `grade`
- `profile_image`

### Login
```json
POST /api/auth/login
{
  "email": "kid@example.com",
  "password": "12345678"
}
```

### Create Experiment
```json
POST /api/experiments
{
  "title": "Balloon Rocket",
  "description": "Learn Newton's Third Law with a balloon.",
  "ageGroup": "8-12",
  "tools": ["Balloon", "String", "Tape", "Straw"],
  "price": 500,
  "difficulty": "Beginner",
  "duration": "20 minutes"
}
```

### Create Quiz
```json
POST /api/quizzes
{
  "experiment_id": 1,
  "title": "Balloon Rocket Quiz",
  "questions": [
    {
      "questionText": "What pushes the balloon forward?",
      "options": ["Gravity", "Air pressure", "Magnetism", "Heat"],
      "correctIndex": 1,
      "explanation": "Escaping air produces thrust."
    }
  ]
}
```

### Submit Quiz
```json
POST /api/quizzes/1/submit
{
  "answers": [1]
}
```

## Validation and Security

- JWT token validation for protected routes
- Role-based route restrictions
- Unique email validation
- One feedback per kid per experiment
- One tutorial per experiment
- One quiz per experiment
- Sequential tutorial step validation
- Image file type filtering
- 5MB upload size limit
- Password hashing using bcryptjs


## Deployment Guide

## Backend Deployment (Railway)

The backend REST API built with Node.js and Express.js was deployed using Railway.

Steps:
- Created a new project in Railway.
- Connected the backend GitHub repository.
- Configured environment variables in the Railway dashboard.
- Set the start command:npm start
- Railway automatically installed dependencies and deployed the application.
- A public backend URL was generated after deployment.

- Backend API URL - https://af-backend-production-79ae.up.railway.app

### Backend Deployment (Railway)
![Backend Deployment](/deployment/Railway.png)
*Backend successfully deployed on Railway*


## License

This project was developed for the **SE3040 – Application Frameworks** assignment.

