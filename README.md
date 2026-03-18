# KneuraSense

**Real-Time Knee Joint Monitoring for Osteoarthritis Prevention**

KneuraSense is an integrated IoT healthcare platform combining a wearable knee device with a clinical web dashboard to monitor joint stress, predict overuse risk, and facilitate early clinical intervention. Designed specifically for populations at risk of knee osteoarthritis, this system provides real-time alerts, contextual weather integration, and clinical management tools to prevent pain flare-ups and optimize patient outcomes.

## 📋 Table of Contents

- [Key Features](#-key-features)
- [System Overview](#-system-overview)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Environment Setup](#-environment-setup)
- [Usage Guide](#-usage-guide)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Key Workflows](#-key-workflows)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

---

## ✨ Key Features

- **Real-Time Sensor Monitoring**: Continuous knee joint stress analysis from wearable IoT device
- **Intelligent Risk Assessment**: Multi-factor risk scoring incorporating movement, load, terrain, and weather
- **Clinical Dashboard**: Comprehensive patient management interface for healthcare providers
- **Patient Engagement**: Real-time alerts, device notifications (vibration/LED), and personalized care plans
- **AI-Powered Insights**: Gemini AI integration for generating patient-friendly clinical notes
- **Weather Integration**: Environmental context for accurate risk prediction
- **Audit & Compliance**: Comprehensive logging for HIPAA and data protection compliance
- **Device Management**: Remote configuration of alert settings, vibration intensity, and LED controls
- **Data Export Pipeline**: ML-compatible data export for Edge Impulse model training
- **Multi-Role Access**: Clinician and patient dashboards with role-based features

---

## 🏗️ System Overview

KneuraSense follows a **full-stack integrated architecture**:

```
┌────────────────────────────────────────┐
│         Patient / Clinician            │
│         Web Dashboard (React 19)       │
└────────────────┬───────────────────────┘
                 │
┌────────────────v─────────────────────────────────┐
│   Next.js 16 Backend (API Routes & Server Actions)  │
│   ├─ Authentication (JWT, Email Verification)      │
│   ├─ Patient/Clinician Management                  │
│   ├─ Real-Time Data Processing                     │
│   └─ Integration Services (Weather, MQTT, AI)      │
└────────────────┬──────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───v────┐  ┌───v────┐  ┌───v──────┐
│ MQTT   │  │Gemini  │  │ Weather  │
│ Broker │  │  AI    │  │ API      │
└────────┘  └────────┘  └──────────┘
    │
┌───v─────────────────────────┐
│   PostgreSQL Database        │
│   (Prisma ORM)              │
└──────────────────────────────┘

┌────────────────────────────────────────┐
│      IoT Knee Device (ESP32)            │
│   ├─ IMU Sensors (Angle, Pitch)        │
│   ├─ Force Sensor                       │
│   ├─ Temperature Sensors                │
│   ├─ Heart Rate Sensor                  │
│   └─ MQTT Publish                       │
└────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend & Backend
- **Next.js 16**: Full-stack React framework with App Router
- **React 19**: UI component library with latest features
- **TypeScript/JavaScript**: Type safety and flexibility

### Database & ORM
- **PostgreSQL 14+**: Relational database with citext extension
- **Prisma ORM 7.3.0**: Type-safe database access and migrations
- **Connection Pooling**: Singleton pattern for efficient resource management

### Real-Time Communication
- **MQTT 5.15.0**: IoT device sensor data streaming (HiveMQ Cloud)
- **Web Push**: Browser notifications for patient alerts

### Authentication & Security
- **bcryptjs 3.0.3**: Secure password hashing
- **jose 6.1.3**: JWT token management
- **nodemailer 8.0.1**: Email verification and password reset

### AI & Analytics
- **Google Generative AI (Gemini)**: Patient-friendly clinical note generation
- **recharts 3.7.0**: Data visualization and historical trends

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React 0.563.0**: Icon library
- **next-themes 0.4.6**: Dark mode support

### Form Validation & Utilities
- **React Hook Form 7.71.1**: Efficient form state management
- **Zod 4.3.6**: TypeScript-first schema validation
- **react-markdown 10.1.0**: Markdown rendering

### ML Pipeline
- **Python 3.11+**: Data processing and export
- **pandas**: CSV and data manipulation
- **psycopg2**: PostgreSQL driver
- **python-dotenv**: Environment configuration

---

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** v18 or later ([https://nodejs.org/](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **PostgreSQL** v14 or later ([https://www.postgresql.org/download/](https://www.postgresql.org/download/))
- **Git** ([https://git-scm.com/](https://git-scm.com/))
- **Python** 3.11+ (for ML pipeline) ([https://www.python.org/](https://www.python.org/))

### Create and Verify PostgreSQL

```bash
# Windows: Open Command Prompt as Administrator
psql -U postgres

# Create the database
CREATE DATABASE keurasense;
```

---

## 📦 Installation Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd KneuraSense
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs all packages including Next.js, Prisma ORM, React, Tailwind CSS, and utilities.

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/keurasense"

# MQTT Configuration
NEXT_PUBLIC_MQTT_BROKER_URL="<your-mqtt-broker-url>"
NEXT_PUBLIC_MQTT_USERNAME="<your-mqtt-username>"
NEXT_PUBLIC_MQTT_PASSWORD="<your-mqtt-password>"

# Email Configuration
EMAIL_USER="<your-email@gmail.com>"
EMAIL_PASSWORD="<your-email-password>"

# AI Integration
NEXT_PUBLIC_GEMINI_API_KEY="<your-google-generative-ai-key>"

# Weather API
NEXT_PUBLIC_WEATHER_API_KEY="<your-weather-api-key>"

# Web Push (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<your-vapid-public-key>"
VAPID_PRIVATE_KEY="<your-vapid-private-key>"

# JWT Secret
JWT_SECRET="<generate-a-random-string>"

# Application
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Set Up Database Schema

The first time only, initialize the database with Prisma migrations:

```bash
npx prisma migrate dev --name init
```

View the database interactively:

```bash
npx prisma studio  # Opens browser interface at http://localhost:5555
```

### Step 6: Verify Installation

Test that everything is set up correctly:

```bash
npm run lint
```

You should see no critical errors. Warnings are acceptable.

---

## 🔧 Environment Setup

### Database Connection

Verify PostgreSQL is running:

```bash
# Windows
psql -U postgres -d keurasense -c "SELECT version();"

# Mac/Linux
psql -U postgres -d keurasense -c "SELECT version();"
```

### MQTT Broker Setup

Use HiveMQ Cloud or self-hosted MQTT broker:

1. Create account at [https://www.hivemq.cloud/](https://www.hivemq.cloud/)
2. Note your broker URL, username, and password
3. Add to `.env.local`

### Email Service Setup (Gmail Example)

1. Enable 2-Factor Authentication on Gmail
2. Generate an App Password
3. Add credentials to `.env.local`

### AI Integration (Google Gemini)

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env.local`

---

## 🚀 Usage Guide

### For Patients

1. **Sign Up**: Create account via registration page
2. **Verify Email**: Click verification link sent to email
3. **Wear Device**: Pair knee device via MQTT
4. **View Dashboard**: Monitor real-time sensor readings and risk scores
5. **Receive Alerts**: Get notifications for high-stress events
6. **Track Interventions**: View care plans from assigned clinician

### For Clinicians

1. **Register**: Create clinician account (requires admin approval)
2. **Wait for Approval**: Admin reviews credentials
3. **Assign Patients**: Search and link patients to your account
4. **Create Interventions**: Design care plans with AI assistance
5. **Monitor Patients**: Track patient engagement and outcomes
6. **Export Data**: Generate audit trail and ML training datasets

### For Administrators

1. **Approve Clinicians**: Review pending clinician registrations
2. **Manage System**: Configure application-wide settings
3. **View Audit Logs**: Track all sensitive operations for compliance

---

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

Opens at http://localhost:3000

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## 📂 Project Structure

```
KneuraSense/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (clinician)/        # Protected clinician pages
│   │   │   ├── layout.js
│   │   │   └── [id]/analytics/
│   │   ├── patient/            # Patient dashboard
│   │   │   └── [id]/
│   │   ├── api/                # Backend API routes
│   │   │   ├── approve-clinician/
│   │   │   ├── save-log/
│   │   │   └── patient/[id]/
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Home page
│   │   └── globals.css         # Global styles
│   ├── actions/                # Server actions
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── changePassword.js
│   │   └── updateClinician.js
│   ├── components/             # React components
│   │   ├── Dashboard.jsx
│   │   ├── AlertModal.jsx
│   │   ├── SensorGrid.jsx
│   │   └── StressGauge.jsx
│   ├── hooks/                  # Custom React hooks
│   │   └── useMQTT.js
│   ├── lib/                    # Utilities & services
│   │   ├── prisma.js           # Singleton Prisma client
│   │   ├── mqtt.js             # MQTT integration
│   │   ├── weather.js          # Weather API client
│   │   ├── email.js            # Email service
│   │   ├── webPush.js          # Web push notifications
│   │   └── validations.js      # Input validation schemas
│   └── generated/              # Auto-generated Prisma types
│       ├── client.ts
│       ├── models.ts
│       └── models/
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   ├── images/
│   └── sw.js                   # Service worker
├── ml-pipeline/                # Python ML data export
│   ├── export_data.py
│   ├── requirements.txt
│   └── datasets/
├── next.config.mjs             # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

---

## 🔄 Key Workflows

### User Registration & Verification

```
Patient Input Email & Password
    ↓
Hash Password (bcryptjs)
    ↓
Create Account (Prisma)
    ↓
Send Email Verification
    ↓
User Clicks Link
    ↓
Mark isVerified = true
```

### Sensor Data Ingestion

```
IoT Device Publishes via MQTT
    ↓
MQTT Broker Receives Message
    ↓
Application Subscribes & Parses
    ↓
Extract: angle, force, temperature, heart rate, location
    ↓
Calculate Risk Score
    ↓
Save SensorLog (Prisma)
    ↓
Risk > Threshold? → Send Alert
```

### Clinician Intervention Workflow

```
Clinician Writes Clinical Notes
    ↓
Send to Gemini AI
    ↓
AI Generates Patient-Friendly Summary
    ↓
Create Intervention Record (Prisma)
    ↓
Send Notification to Patient
    ↓
Patient Views & Acknowledges
```

### Admin Clinician Approval

```
Clinician Submits Registration
    ↓
Create AdminApprovalToken
    ↓
Send Approval Link to Admin
    ↓
Admin Reviews Credentials
    ↓
Admin Approves/Rejects
    ↓
Update isApproved Flag (Prisma)
```

---

## 🚢 Deployment

### Prerequisites for Production

- PostgreSQL hosted (AWS RDS, Heroku Postgres, or self-managed)
- MQTT Broker (HiveMQ Cloud or self-hosted)
- Environment variables configured securely
- Email service configured (Gmail, SendGrid, etc.)
- Google Gemini API key
- JWT_SECRET generated (use OpenSSL or strong random)

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Vercel will:
- Prompt for environment variables
- Build and deploy automatically
- Provide a public URL

### Deploy to Self-Hosted Server (Node.js)

```bash
# On production server
git clone <repository-url>
cd KneuraSense
npm install
npm run build

# Create .env.local with production values
cat > .env.local << EOF
DATABASE_URL="..."
# ... other env vars
EOF

# Start production server
npm run start  # Listens on port 3000 by default
```

### Using PM2 for Process Management

```bash
npm install -g pm2

# Start application
pm2 start npm --name keurasense -- start

# View logs
pm2 logs keurasense

# Restart on reboot
pm2 startup
pm2 save
```

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `pg_isready` (Mac/Linux) or check Services (Windows)
- Verify DATABASE_URL in `.env.local`
- Check PostgreSQL user permissions

### Prisma Client Not Found

```bash
npx prisma generate
```

### MQTT Connection Fails

- Verify broker URL and credentials in `.env.local`
- Check network connectivity to broker
- Confirm MQTT username/password are correct

### Email Not Sending

- Enable "Less Secure App Access" for Gmail (if using)
- Verify EMAIL_USER and EMAIL_PASSWORD in `.env.local`
- Check email service credentials

### Port 3000 Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

---

## 📚 Documentation

For comprehensive technical documentation, design patterns, architecture deep-dives, and implementation details, see:

- **[software-documentation.md](./software-documentation.md)** - Complete technical reference including system architecture, design patterns, API endpoints, database schema, scalability considerations, and roadmap

---

## 📞 Support & Contributing

For issues, feature requests, or contributions:

1. Check existing issues on GitHub
2. Create a detailed bug report if needed
3. Follow coding standards: ESLint for JavaScript, Prisma format for schema
4. Test locally before submitting updates

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

## 👥 Authors

- **Senior Software Engineering Team**
- Healthcare IoT Architecture & Implementation

---

**KneuraSense** - Protecting Knees, Enhancing Lives

## Learn More

* Next.js – [https://nextjs.org/docs](https://nextjs.org/docs)
* Prisma – [https://www.prisma.io/docs](https://www.prisma.io/docs)
* PostgreSQL – [https://www.postgresql.org/docs](https://www.postgresql.org/docs)
* Tailwind CSS – [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## Contributing

1. Create a new branch
2. Make and test your changes locally
3. Run `npm run lint`
4. Push and open a pull request

---

## Notes for Team Members

* **Never commit `.env.local`**
* Always run `npm install` after pulling updates
* Use `npx prisma db push` for schema changes
* Update dependencies carefully

Happy coding!
