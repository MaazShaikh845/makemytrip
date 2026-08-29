# ✈️ MakeMy Tour

A full-stack travel booking platform for flights and hotels, built with **Spring Boot** (backend) and **Next.js** (frontend), backed by **MongoDB Atlas**.

> **Live Demo**
> - 🌐 Frontend: https://makemytrip-2-2p53.onrender.com
> - 🔌 Backend API: https://makemytrip-21z3.onrender.com

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [Backend (Spring Boot)](#1-backend-spring-boot)
  - [Frontend (Next.js)](#2-frontend-nextjs)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Docker](#docker)
- [Deploying to Render](#deploying-to-render)
- [Default Admin Account](#default-admin-account)

---

## Features

- 🔐 User registration and login (with BCrypt password hashing)
- ✈️ Browse and book flights
- 🏨 Browse and book hotels
- 📋 View booking history on profile page
- 👤 Edit profile (name, phone number)
- 🛡️ Admin panel for managing flights and hotels
- 📦 MongoDB-backed data persistence with embedded bookings per user

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 4, Spring Data MongoDB, Spring Security |
| Frontend | Next.js 15 (App Router), TypeScript, Redux Toolkit, Tailwind CSS |
| Database | MongoDB Atlas |
| Deployment | Render (Docker for backend, Node.js for frontend) |

---

## Project Structure

```
makemytrip/
├── src/                          # Spring Boot backend source
│   └── main/java/com/makemytrip/
│       ├── booking/              # Booking logic (flight & hotel)
│       ├── flight/               # Flight model, controller, repository
│       ├── hotel/                # Hotel model, controller, repository
│       ├── user/                 # User auth, profile
│       ├── DataSeeder.java       # Seeds initial flight & hotel data
│       ├── MakemytripApplication.java
│       └── SecurityConfig.java   # CORS + Security config
├── src/main/resources/
│   └── application.properties    # MongoDB URI, server port
├── makemytour/                   # Next.js frontend
│   ├── app/                      # App Router pages
│   │   ├── page.tsx              # Home (flights + hotels)
│   │   ├── profile/page.tsx      # Profile + My Bookings
│   │   ├── book-flight/[id]/     # Flight booking page
│   │   ├── book-hotel/[id]/      # Hotel booking page
│   │   └── admin/page.tsx        # Admin dashboard
│   ├── components/               # Reusable React components
│   ├── lib/api.ts                # All API calls to backend
│   ├── store/index.ts            # Redux auth slice
│   └── .env.local                # Frontend environment variables
├── Dockerfile                    # Docker multi-stage build for backend
└── pom.xml                       # Maven build file
```

---

## Prerequisites

Make sure you have the following installed:

- [Java 21+](https://adoptium.net/)
- [Maven](https://maven.apache.org/) (or use the included `mvnw`)
- [Node.js 18+](https://nodejs.org/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works)
- [Docker](https://www.docker.com/) (optional, for containerized backend)
- [Git](https://git-scm.com/)

---

## Local Setup

### 1. Backend (Spring Boot)

#### Clone the repository

```bash
git clone https://github.com/MaazShaikh845/makemytrip.git
cd makemytrip
```

#### Configure MongoDB

Open `src/main/resources/application.properties` and update:

```properties
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/makemytrip?appName=Main
spring.data.mongodb.database=makemytrip
server.port=8082
```

Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials.

#### Run the backend

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Mac/Linux
./mvnw spring-boot:run
```

The backend starts at **http://localhost:8082**

> On first startup, `DataSeeder.java` automatically seeds the database with sample flights and hotels.

---

### 2. Frontend (Next.js)

```bash
cd makemytour
npm install
```

#### Create environment file

Create `makemytour/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8082
```

#### Run the frontend

```bash
npm run dev
```

The frontend starts at **http://localhost:3000**

---

## Environment Variables

### Frontend (`makemytour/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Spring Boot backend URL | `https://makemytrip-21z3.onrender.com` |

### Backend (`application.properties`)

| Property | Description |
|----------|-------------|
| `spring.data.mongodb.uri` | MongoDB Atlas connection string |
| `spring.data.mongodb.database` | Database name |
| `server.port` | Backend server port (default: `8082`) |

---

## API Endpoints

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/signup` | Register a new user |
| POST | `/user/login` | Login with email and password |
| GET | `/user/search?email=` | Find user by email |
| PUT | `/user/{id}` | Update user profile |

### Flights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flights` | Get all flights |
| GET | `/flights/{id}` | Get a flight by ID |
| POST | `/flights` | Add a flight (Admin) |
| PUT | `/flights/{id}` | Update a flight (Admin) |
| DELETE | `/flights/{id}` | Delete a flight (Admin) |

### Hotels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hotels` | Get all hotels |
| GET | `/hotels/{id}` | Get a hotel by ID |
| POST | `/hotels` | Add a hotel (Admin) |
| PUT | `/hotels/{id}` | Update a hotel (Admin) |
| DELETE | `/hotels/{id}` | Delete a hotel (Admin) |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings/flight` | Book a flight |
| POST | `/bookings/hotel` | Book a hotel |
| GET | `/bookings/user/{userId}` | Get all bookings for a user |
| GET | `/bookings/{id}` | Get a single booking |
| DELETE | `/bookings/{id}` | Cancel a booking |

---

## Docker

Build and run the backend as a Docker container:

```bash
# Build the image
docker build -t makemytrip-backend .

# Run the container (pass MongoDB URI as env variable)
docker run -p 8082:8082 \
  -e SPRING_DATA_MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/makemytrip" \
  makemytrip-backend
```

---

## Deploying to Render

### Backend (Docker Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**
2. Connect your GitHub repo (`MaazShaikh845/makemytrip`)
3. Set the following:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Port**: `8082`
4. Add environment variable:
   - `SPRING_DATA_MONGODB_URI` = your MongoDB Atlas URI
5. Click **Deploy**

Backend live at: **https://makemytrip-21z3.onrender.com**

---

### Frontend (Node.js Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**
2. Connect the same GitHub repo
3. Set the following:
   - **Runtime**: Node
   - **Root Directory**: `makemytour`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://makemytrip-21z3.onrender.com`
5. Click **Deploy**

Frontend live at: **https://makemytrip-2-2p53.onrender.com**

---

## Default Admin Account

A default admin user is available for testing:

| Field | Value |
|-------|-------|
| Email | `maaz@example.com` |
| Password | `password` |
| Role | `ADMIN` |

> Admin users can access the **Admin Panel** via the shield icon in the navbar to add, edit, and delete flights and hotels.

---

## License

This project is for educational purposes.
