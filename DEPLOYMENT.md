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

## Enviorenment variables

- APP_URL 
- CLIENT_URL
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_CLOUD_NAME
- EMAIL_FROM
- EMAIL_HOST: smtp
- EMAIL_PASS
- EMAIL_PORT: 587
- EMAIL_USER
- JWT_SECRET_KEY
- MONGO_URI
- YOUTUBE_API_KEY

## Backend API URL
https://af-backend-production-79ae.up.railway.app

### Backend Deployment (Railway)
![Backend Deployment](/deployment/Railway.png)
*Backend successfully deployed on Railway*