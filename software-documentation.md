# KneuraSense Software Documentation

**Comprehensive Technical Reference for Systems Architects and Developers**

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Design Patterns](#design-patterns)
3. [Component Breakdown](#component-breakdown)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [API Endpoints](#api-endpoints)
6. [Database Schema Overview](#database-schema-overview)
7. [Key Design Decisions](#key-design-decisions)
8. [Scalability & Performance](#scalability--performance)
9. [Security Considerations](#security-considerations)
10. [Future Improvements & Roadmap](#future-improvements--roadmap)

---

## System Architecture

### Overview

KneuraSense implements a **modern full-stack architecture** using Next.js 16 as a unified framework for frontend and backend operations. The system processes real-time IoT data from wearable knee devices, applies complex risk calculations, facilitates clinical intervention, and maintains comprehensive audit trails for healthcare compliance.

> Companion documents:
> - `DOCUMENTATION.md` for a concise architecture overview
> - `software-documentation.md` for the full technical reference

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React 19 Components                                    │   │
│  │  ├─ Patient Dashboard (Real-time metrics)              │   │
│  │  ├─ Clinician Dashboard (Patient management)           │   │
│  │  ├─ Admin Portal (Clinician approval)                 │   │
│  │  └─ Authentication Pages (Login, Register, Reset)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────v───────────────────────────────────────────┐
│           SERVER LAYER (Next.js 16 on Node.js)                 │
│                                                                 │
│  Route Groups & Pages (App Router)                           │
│  ├─ src/app/(auth) → Public auth pages                      │
│  ├─ src/app/(clinician) → Protected clinician routes         │
│  ├─ src/app/patient → Patient dashboards                     │
│  └─ src/app/admin → Admin management                         │
│                                                                 │
│  API Routes                                                    │
│  ├─ /api/save-log → MQTT message ingestion                  │
│  ├─ /api/patient/[id] → Patient data endpoints              │
│  ├─ /api/approve-clinician → Admin workflows                │
│  └─ [Other domain-specific endpoints]                        │
│                                                                 │
│  Server Actions (Real-time backend operations)              │
│  ├─ login, register, password reset                          │
│  ├─ updatePatient, updateClinician                          │
│  ├─ createIntervention, acknowledgeIntervention            │
│  └─ [Other data mutations]                                   │
│                                                                 │
│  Services & Utilities                                         │
│  ├─ src/lib/prisma.js → Database access (Singleton)         │
│  ├─ src/lib/mqtt.js → IoT device communication              │
│  ├─ src/lib/weather.js → Weather context API                │
│  ├─ src/lib/email.js → Email notifications                  │
│  ├─ src/lib/webPush.js → Browser push notifications         │
│  ├─ src/lib/validations.js → Input validation (Zod)         │
│  └─ src/hooks/useMQTT.js → React hook for MQTT              │
└────────────────────┬───────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────v──────┐ ┌──v───────┐ ┌──v────────┐
│ PostgreSQL   │ │  MQTT    │ │  External │
│ Database     │ │  Broker  │ │   APIs    │
│              │ │          │ │  (Weather,│
│ (Prisma ORM) │ │(HiveMQ)  │ │ Gemini)   │
└──────────────┘ └──────────┘ └───────────┘
        ↑
┌───────┴──────┐
│   IoT Layer  │
│ (ESP32 + ML) │
└──────────────┘
```

### Layers Explained

#### 1. **Client Layer (Browser)**
- React 19 component-based UI
- Real-time websocket/MQTT subscriptions from browser hooks
- State management via React hooks + Context API
- Responsive design with Tailwind CSS
- Dark mode support via next-themes

#### 2. **Server Layer (Next.js 16)**
- **Route Groups**: `(auth)`, `(clinician)` organize routes without URL impact
- **Dynamic Routes**: `patient/[id]` and `clinician/[id]` for user-specific pages
- **API Routes**: RESTful endpoints for frontend and IoT integration
- **Server Actions**: Lightweight RPC for database mutations
- **Middleware**: Authentication, authorization, logging

#### 3. **Service Layer**
- **Prisma ORM**: Type-safe database queries
- **MQTT Client**: IoT device subscription and message handling
- **Weather Service**: Contextual weather integration
- **Email Service**: User notifications (nodemailer)
- **Web Push**: Browser push notifications (web-push)
- **Validation**: Input schemas with Zod

#### 4. **Data Layer**
- **PostgreSQL**: Primary relational database with citext extension
- **MQTT Broker**: Message queue for IoT sensor data
- **External APIs**: Google Gemini, Weather APIs

#### 5. **IoT Layer**
- ESP32 microcontroller with sensor array
- MQTT publisher to cloud broker
- Edge ML capabilities (Edge Impulse compatible)

---

## Design Patterns

### 1. **Singleton Pattern (src/lib/prisma.js)**

```javascript
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Purpose**: Prevent connection pool exhaustion by maintaining a single Prisma Client instance across the application.

**Benefit**:
- Reuses database connections
- Reduces memory overhead
- Supports hot-reload during development
- Ensures consistent transaction handling

### 2. **Server Actions Pattern**

```javascript
// actions/login.js
'use server'

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginAction(email, password) {
  try {
    const clinician = await prisma.clinician.findUnique({
      where: { email }
    });
    
    if (!clinician || !bcrypt.compareSync(password, clinician.password_hash)) {
      return { error: "Invalid credentials" };
    }
    
    // Create JWT token
    const token = await createToken(clinician);
    return { success: true, token };
  } catch (error) {
    return { error: error.message };
  }
}
```

**Pattern Benefits**:
- Eliminates boilerplate API route code
- Direct database access from components
- Automatic streaming for large datasets
- Reduced client-server round trips

### 3. **Repository Pattern (Implicit via Prisma)**

Each Prisma model acts as a repository:

```javascript
// Abstracts database layer
const patient = await prisma.patient.findUnique({
  where: { id },
  include: { clinician: true, sensorLogs: true }
});

// Change database without changing query syntax
```

### 4. **Middleware Pattern (Next.js)**

```javascript
// middleware.js - Runs on every request
export function middleware(request) {
  // Check authentication
  const token = request.cookies.get('auth_token');
  
  if (!token && request.nextUrl.pathname.startsWith('/clinician')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/clinician/:path*', '/patient/:path*']
};
```

### 5. **Hook Pattern for Real-Time Data**

```javascript
// src/hooks/useMQTT.js
export function useMQTT(topic) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL);
    
    client.on('connect', () => setConnected(true));
    client.subscribe(topic);
    client.on('message', (t, message) => {
      setData(JSON.parse(message.toString()));
    });
    
    return () => client.end();
  }, [topic]);

  return { data, connected };
}
```

### 6. **Observer Pattern (Web Push)**

```javascript
// Patients subscribe to notifications
const subscription = await serviceWorkerRegistration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
});

// Clinician actions trigger notifications to subscribed patients
await sendPushNotification(subscription, {
  title: "New Intervention",
  body: "Your doctor has created a new care plan"
});
```

### 7. **Adapter Pattern (Multi-Schema Support)**

```javascript
// Prisma adapter pattern - easily switch database providers
datasource db {
  provider   = "postgresql"  // Can be mysql, sqlite, mongodb
  url        = env("DATABASE_URL")
}
```

### 8. **Factory Pattern (Model Creation)**

```javascript
// Implicit via Prisma relations
const intervention = await prisma.intervention.create({
  data: {
    title: "Reduce running speed",
    patientId,
    clinicianId,
    notes: "Clinical assessment suggests overuse"
  },
  include: {
    patient: true,
    clinician: true
  }
});
```

---

## Component Breakdown

### Frontend Components

#### **Dashboard Components**

| Component | Purpose | Props | State |
|-----------|---------|-------|-------|
| `LiveDashboard.jsx` | Real-time metrics display | `patientId`, `refreshRate` | `sensorData[]`, `alerts[]` |
| `SmartDashboard.jsx` | Intelligent layout selection | `userRole`, `userId` | `layout`, `filters` |
| `HistoryCharts.jsx` | Historical trend visualization | `patientId`, `timeRange` | `chartData`, `selectedMetric` |
| `MiniChart.jsx` | Compact metric visualization | `data[]`, `label`, `metric` | `hoveredPoint` |

#### **Alert & Notification Components**

| Component | Purpose | Props | Trigger |
|-----------|---------|-------|---------|
| `GlobalPatientAlerts.jsx` | Patient-facing alert system | `patientId` | real-time risk threshold breach |
| `GlobalClinicianAlerts.jsx` | Clinician-facing notices | `clinicianId` | patient updates, approvals |
| `InterventionAcknowledgmentModal.jsx` | Intervention confirmation | `intervention` | patient opens intervention |
| `AcknowledgeButton.jsx` | Single acknowledgement action | `interventionId` | click handler |

#### **User Management Components**

| Component | Purpose | Props |
|-----------|---------|-------|
| `EditProfileModal.jsx` | Patient profile editing | `patient`, `onUpdate` |
| `EditClinicianProfileModal.jsx` | Clinician profile editing | `clinician`, `onUpdate` |
| `SettingsForm.jsx` | Patient device settings | `deviceSettings`, `onSave` |
| `ClinicianSettingsForm.jsx` | Clinician preferences | `preferences`, `onSave` |

#### **Sensor & Clinical Components**

| Component | Purpose | Props | Real-time |
|-----------|---------|-------|-----------|
| `SensorGrid.jsx` | Multi-sensor display | `sensorData`, `updateFrequency` | Yes (MQTT) |
| `ClinicalThresholdManager.jsx` | Risk threshold config | `currentThreshold`, `onUpdate` | No |
| `CarePlanCard.jsx` | Intervention display | `intervention`, `onAcknowledge` | No |
| `VoiceAlertButton.jsx` | Audio alert toggle | `enabled`, `onToggle` | No |

#### **AI & Utility Components**

| Component | Purpose | Props |
|-----------|---------|-------|
| `KneuraBot.jsx` | Patient chatbot interface | `patientId`, `messages` |
| `ClinicianBot.jsx` | Clinician assistance | `context`, `query` |
| `ExportButton.jsx` | Data export trigger | `dataType`, `onExport` |
| `RefreshButton.jsx` | Manual data refresh | `onRefresh`, `isLoading` |
| `PrivacyMask.jsx` | PII masking display | `value`, `showMask`, `maskChar` |

### Backend Server Actions

#### **Authentication Actions** (`src/actions/`)

```javascript
login.js                    // Email + password authentication
register.js                 // New account creation with email verification
passwordReset.js            // Forgotten password recovery
changePassword.js           // Current user password change
verifyEmail.js              // Email verification token validation
```

#### **Patient Management Actions**

```javascript
updatePatient.js            // Profile updates (name, age, contact)
updateDeviceSettings.js     // Device configuration (alerts, vibration)
updateClinicalThreshold.js  // Risk threshold adjustment
assignPatient.js            // Link patient to clinician
```

#### **Clinician Management Actions**

```javascript
clinicianRegisterPatient.js // Register patient under clinician
updateClinician.js          // Profile and credential updates
updateClinicianPreferences.js // Notification and UI preferences
```

#### **Clinical Actions**

```javascript
addIntervention.js          // Create care plan / clinical note
acknowledgeIntervention.js  // Patient marks intervention as viewed
checkCriticalAlerts.js      // Poll for urgent patient alerts
```

#### **System Actions**

```javascript
deleteAccount.js            // User account deletion with data cleanup
```

### API Routes

#### **Authentication Endpoints**

```javascript
POST /api/auth/login             // Validate credentials, return JWT
POST /api/auth/register          // Create account, send verification
POST /api/auth/verify-email      // Process email verification token
POST /api/auth/reset-password    // Generate password reset token
POST /api/auth/confirm-reset     // Apply new password
```

#### **Patient Endpoints**

```javascript
GET  /api/patient/[id]           // Fetch patient profile & settings
PUT  /api/patient/[id]           // Update patient info
GET  /api/patient/[id]/alerts    // Get patient alerts
POST /api/patient/[id]/transfer  // Assign to different clinician
GET  /api/patient/[id]/history   // Sensor data history
```

#### **Clinician Endpoints**

```javascript
GET  /api/clinician/[id]         // Fetch clinician profile
PUT  /api/clinician/[id]         // Update clinician info
GET  /api/clinician/[id]/patients // List assigned patients
POST /api/clinician/[id]/export  // Export patient data
```

#### **Intervention Endpoints**

```javascript
POST /api/intervention           // Create intervention
PUT  /api/intervention/[id]      // Update intervention
POST /api/intervention/[id]/acknowledge // Mark as read
GET  /api/intervention/[patientId] // List patient interventions
```

#### **IoT & Sensor Endpoints**

```javascript
POST /api/save-log              // Ingest MQTT sensor data
POST /api/save-log-worker       // Background job for batch processing
GET  /api/sensor-history/[id]   // Retrieve sensor readings
```

#### **Admin Endpoints**

```javascript
GET  /api/approve-clinician     // List pending clinicians
POST /api/approve-clinician/[id] // Approve/reject clinician
GET  /api/audit-log             // Compliance audit logs
```

---

## Data Flow Diagrams

### Flow 1: User Registration & Verification

```
User Registration Form
    ↓
[POST /api/auth/register]
    ↓
Validate Input (Zod schema)
    ↓
Check email uniqueness (Prisma)
    ↓
Hash Password (bcryptjs)
    ↓
Create AuthUser record
    ↓
Generate EmailVerificationToken
    ↓
Send Email (nodemailer)
    ↓
Display "Check your email" message
    ↓
User Clicks Email Link
    ↓
[GET /api/auth/verify-email?token=...]
    ↓
Validate token (not expired)
    ↓
Update isVerified = true
    ↓
Delete token
    ↓
Redirect to login + Success message
```

### Flow 2: Real-Time Sensor Data Ingestion

```
IoT Device (ESP32) Multi-Sensor Array
    │
    ├─ IMU sensors → Angle, Pitch
    ├─ Force sensor → Load force
    ├─ Temperature sensors → Skin temp, Ambient temp
    ├─ Heart rate sensor → BPM
    └─ GPS module → Latitude, Longitude
    
    ↓ MQTT Publish
    
MQTT Broker (HiveMQ Cloud)
Topic: keurasense/device/{deviceId}/sensor/data
Message: { angle, force, temp, bpm, lat, lng, timestamp }
    
    ↓ MQTT Subscribe
    
Next.js Backend
[POST /api/save-log]
    ↓
Parse MQTT message
    ↓
Fetch current weather (weather.js)
    ↓
Calculate risk score:
    riskScore = (
      0.4 * normalizeForce(force) +
      0.3 * normalizeAngle(angle) +
      0.2 * weatherFactor(humidity, temp, pressure) +
      0.1 * activityLevel(user)
    )
    ↓
Store SensorLog in PostgreSQL
    ↓
Risk > threshold? 
    ├─ YES: Generate critical alert
    │       │
    │       ├─ Send Web Push notification
    │       ├─ Send Email to patient
    │       ├─ Notify clinician
    │       └─ Create AuditLog entry
    │
    └─ NO: Continue normal monitoring
    
    ↓ Client-Side (Real-time)
    
React Component (useMQTT hook)
Subscribe to device topic
    ↓
Receive updated metrics
    ↓
Update dashboard display
    ↓
Animate gauge/chart updates
```

### Flow 3: Clinical Intervention Creation

```
Clinician logs into dashboard
    ↓
Views patient profile
    ↓
Sees recent high-risk alerts
    ↓
Clicks "Create Intervention"
    ↓
Modal form appears:
    ├─ Title: "Reduce running speed"
    ├─ Type: "Advice" / "Exercise" / "Medication"
    ├─ Clinical notes: "Patient shows 23% increase in
    │                   joint stress during sprinting"
    └─ Patient-friendly note: (empty - will be AI generated)
    
    ↓
Clinician clicks "Generate Patient Summary"
    ↓
[POST /api/intervention/ai-summary]
    Send clinical text to Google Gemini API
    ↓
Gemini generates patient-friendly version:
    "Try limiting high-speed running to help
     protect your knee. Slower walks are better
     right now."
    
    ↓
Clinician reviews AI summary
    ↓
Clicks "Create Intervention"
    ↓
[POST /api/intervention]
    ├─ Insert into Interventions table
    ├─ Link to patient and clinician
    ├─ Create AuditLog entry (AUDIT_INTERVENTION_CREATED)
    └─ Send Web Push + Email to patient
    
    ↓
Patient receives notification
    ↓
Opens patient dashboard
    ↓
Views new intervention card
    ↓
Reads patient-friendly summary
    ↓
Clicks "I Understand"
    ↓
[POST /api/intervention/[id]/acknowledge]
    ├─ Set isAcknowledged = true
    ├─ Set acknowledgedAt = now()
    ├─ Create AuditLog entry (AUDIT_PATIENT_ACKNOWLEDGED)
    └─ Send notification back to clinician
```

### Flow 4: Admin Clinician Approval

```
New clinician registers
    ↓
Email verified
    ↓
Account created with isApproved = false
    ↓
Generate AdminApprovalToken
    ↓
Send approval link via email to admin
    Admin receives: "New clinician registration pending review"
    
    ↓
Admin clicks approval link
    ↓
[GET /api/approve-clinician?token=...]
    ↓
Validate token
    ↓
Display clinician details:
    ├─ Full name
    ├─ License number
    ├─ Specialization
    └─ Email
    
    ↓
Admin action (Approve | Reject)
    
    ├─ IF APPROVE:
    │   └─ [POST /api/approve-clinician/[id]]
    │       ├─ Set isApproved = true
    │       ├─ Delete AdminApprovalToken
    │       ├─ Send confirmation email to clinician
    │       ├─ Create AuditLog (ADMIN_APPROVED_CLINICIAN)
    │       └─ Clinician can now manage patients
    │
    └─ IF REJECT:
        └─ [POST /api/approve-clinician/[id]/reject]
            ├─ Set isApproved = false (stays)
            ├─ Send rejection email to clinician
            ├─ Create AuditLog (ADMIN_REJECTED_CLINICIAN)
            └─ Clinician cannot access dashboard
```

```
Clinician clicks "Export Data"
    ↓
Select date range:
    "From: 2024-01-01, To: 2024-03-18"
    ↓
[POST /api/data-export]
    ↓
Authenticate clinician
    ↓
Query SensorLogs for date range:
    WHERE patientId = ?
      AND timestamp BETWEEN start AND end
    ↓
Transform to Edge Impulse format:
    {
        timestamp,
        angle,
        thighPitch,
        shankPitch,
        force,
        skinTemp,
        weatherTemp,
        bpm,
        ambientTemp,
        pressure,
        riskScore,
        label (optional: "high_risk" / "normal")
    }
    
    ↓
Export to CSV file

---
## Database Schema Overview

### Entity Relationship Diagram

```
┌────────────────────────┐
│      Clinician         │
├────────────────────────┤
│ PK: clinician_id       │
│ email (unique)         │
│ phone_number (unique)  │
│ password_hash          │
│ full_name              │
│ specialization         │
│ licenseNumber          │
│ isVerified             │
│ isApproved             │
│ criticalAlerts (bool)  │
│ emailAlerts (bool)     │
│ compactView (bool)     │
│ createdAt              │
│ updatedAt              │
└────────────────────────┘
         │ 1
         │ 
    ┌────o─────┐
    │ 1:N      │
    │          │
    │          │
    v          v
    │      ┌──────────────────┐
    │      │    Patient       │
    │      ├──────────────────┤
    │      │ PK: id           │
    │      │ fullName         │
    │      │ email (unique)   │
    │      │ phoneNumber      │
    │      │ passwordHash     │
    │      │ age              │
    │      │ gender           │
    │      │ oaDiagnosis      │
    │      │ affectedKnee     │
    │      │ painSeverity     │
    │      │ occupation       │
    │      │ activityLevel    │
    │      │ riskThreshold    │
    │      │ deviceMac        │
    │      │ FK: clinicianId  │◄────┐
    │      │ pushSubscription │     │
    │      │ isVerified       │     │
    │      │ createdAt        │     │
    │      └──────────────────┘     │
    │                               │
    │                        Many:1 relationship
    └───────────────────────────────┘

┌────────────────────┐
│    SensorLog       │
├────────────────────┤
│ PK: id             │
│ FK: patientId ·····├─→ Patient
│ angle              │
│ thighPitch         │
│ shankPitch         │
│ force              │
│ skinTemp           │
│ battery            │
│ riskScore          │
│ lat, lng           │ GPS coordinates
│ weatherTemp        │
│ bpm                │ Heart rate
│ ambientTemp        │
│ pressure           │
│ timestamp ◄────────┤─ Indexed for fast queries
└────────────────────┘

┌─────────────────────────┐
│   Intervention          │
├─────────────────────────┤
│ PK: id                  │
│ FK: patientId ··········├─→ Patient
│ FK: clinicianId ········├─→ Clinician
│ title                   │
│ type                    │
│ notes (clinical)        │
│ patientFriendlyNote     │
│ isAcknowledged (bool)   │
│ acknowledgedAt          │
│ createdAt               │
└─────────────────────────┘

┌──────────────────────────┐
│     AuditLog             │
├──────────────────────────┤
│ PK: id                   │
│ FK: clinicianId ·········├─→ Clinician
│ action                   │
│ targetType               │
│ targetId                 │
│ details (JSON string)    │
│ ipAddress                │
│ createdAt                │
│ Index: [clinicianId, createdAt] for compliance queries
└──────────────────────────┘

┌───────────────────────────┐
│  AdminApprovalToken       │
├───────────────────────────┤
│ PK: id                    │
│ FK: clinicianId (unique)· ├─→ Clinician
│ token (unique)            │
│ createdAt                 │
└───────────────────────────┘

┌────────────────────────────┐
│ EmailVerificationToken     │
├────────────────────────────┤
│ PK: id                     │
│ email                      │
│ token (6-digit code)       │
│ expires                    │
│ createdAt                  │
│ Unique: [email, token]     │
└────────────────────────────┘

┌────────────────────────────┐
│ PasswordResetToken         │
├────────────────────────────┤
│ PK: id                     │
│ email                      │
│ token                      │
│ expires                    │
│ createdAt                  │
│ Unique: [email, token]     │
└────────────────────────────┘
```

### Key Model Relationships

#### **Clinician ↔ Patient (1:N)**
- One clinician can manage multiple patients
- Patients can belong to at most one clinician
- Foreign key: `Patient.clinicianId`
- Cascade delete: If clinician deleted, their assignment to patients is removed

#### **Patient ↔ SensorLog (1:N)**
- One patient generates many sensor logs
- Each sensor log belongs to exactly one patient
- Foreign key: `SensorLog.patientId`
- Cascade delete: Deleting patient also deletes all sensor logs

#### **Patient ↔ Intervention (1:N)**
- One patient receives multiple interventions
- Each intervention targets one patient
- Foreign key: `Intervention.patientId`
- Cascade delete: Deleting patient removes all interventions

#### **Clinician ↔ Intervention (1:N)**
- One clinician creates multiple interventions
- Each intervention comes from one clinician
- Foreign key: `Intervention.clinicianId`
- Cascade delete: Deleting clinician removes their interventions

#### **Clinician ↔ AuditLog (1:N)**
- One clinician generates many audit logs
- Each log entry tracks one clinician's actions
- Foreign key: `AuditLog.clinicianId`
- Used for compliance: Extract all actions by clinician ID

#### **Clinician ↔ AdminApprovalToken (1:1)**
- One clinician has at most one pending approval token
- Unique constraint: ensures only one token per clinician
- Token deleted once clinician approved

---

## Key Design Decisions

### 1. **Full-Stack Next.js Architecture**

**Decision**: Use Next.js 16 for both frontend and backend instead of separate services.

**Rationale**:
- Reduces operational complexity (single deployment)
- Faster development cycle (shared types between client/server)
- Built-in SEO optimization for public pages
- Integrated image optimization and caching

**Trade-offs**:
- ✓ Simpler deployment and debugging
- ✓ Code sharing between frontend and backend
- ✗ Harder to scale independently (frontend vs. backend)
- ✗ Single point of failure for both client and server logic

**Alternative Considered**: Separate React + Node.js backend
- Rejected due to added complexity for this domain size

---

### 2. **Singleton Prisma Client Pattern**

**Decision**: Maintain single Prisma Client instance globally with module-level caching.

**Rationale**:
- Each Prisma Client creates a connection pool (5-10 connections)
- Multiple instances = connection pool exhaustion
- Singleton pattern reuses pool across all requests
- Prevents "too many connections" PostgreSQL errors

**Implementation**:
```javascript
// src/lib/prisma.js
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Trade-offs**:
- ✓ Efficient resource usage
- ✓ Prevents connection pool exhaustion
- ✗ Global state (harder to test)
- ✗ More complex debugging

---

### 3. **Server Actions for Mutations**

**Decision**: Use Next.js Server Actions for database writes instead of traditional API routes.

**Rationale**:
```javascript
// Before (API route)
export async function POST(req) {
  const data = await req.json();
  return prisma.patient.update(...);
}

// After (Server Action)
'use server'
export async function updatePatient(data) {
  return prisma.patient.update(...);
}
```

Benefits:
- No boilerplate handling of request/response
- Type safety between client and server
- Automatic submission tracking
- Reduced bundle size (server-only code not exported)

**Trade-offs**:
- ✓ Less code to maintain
- ✓ Better developer experience
- ✓ Automatic error handling boundaries
- ✗ Less granular control over HTTP semantics
- ✗ Not suitable for complex routing logic

---

### 4. **MQTT for Real-Time Device Communication**

**Decision**: Use MQTT publish-subscribe instead of REST polling.

**Rationale**:
- IoT devices need low-bandwidth, reliable messaging
- REST polling = excessive network traffic for real-time data
- MQTT maintains persistent connection, reduces latency
- Built-in message queuing for offline devices

**Topic Structure**:
```
keurasense/device/{deviceId}/sensor/{sensorType}/data
keurasense/device/{deviceId}/alert
keurasense/device/{deviceId}/status
```

**Trade-offs**:
- ✓ Lower bandwidth usage
- ✓ Real-time delivery
- ✓ Reliable message queuing
- ✗ Requires separate broker infrastructure
- ✗ More complex client library (vs. REST)

---

### 5. **PostgreSQL over NoSQL**

**Decision**: Use relational PostgreSQL instead of MongoDB/Firebase.

**Rationale**:
- Structured healthcare data with clear relationships
- ACID transactions essential for clinical data integrity
- Complex queries (patient history, audit trails)
- Cost-effective for moderate scale
- citext extension for case-insensitive email matching

**Trade-offs**:
- ✓ Data integrity guarantees
- ✓ Efficient complex queries
- ✓ ACID transactions
- ✗ Fixed schema requires migrations
- ✗ Less flexible for rapidly changing data models

---

### 6. **Prisma ORM over Raw SQL**

**Decision**: Use Prisma instead of writing raw SQL or alternative ORMs.

**Rationale**:
```javascript
// Type-safe queries with autocomplete
const patient = await prisma.patient.findUnique({
  where: { id },
  include: { clinician: true, sensorLogs: { take: 10 } }
});
// IDE autocomplete suggests all fields
```

**Benefits**:
- Auto-generated TypeScript types
- Prevents SQL injection
- Easy migrations
- Schema visualization
- Prisma Studio for visual database management

**Trade-offs**:
- ✓ Type safety
- ✓ Less SQL knowledge required
- ✓ Easy debugging with Prisma Studio
- ✗ Less flexible for complex queries
- ✗ Generated code bloat

---

### 7. **AI-Assisted Clinic Note Translation**

**Decision**: Use Google Gemini API to generate patient-friendly versions of clinical notes.

**Rationale**:
- Clinical notes use medical terminology not understandable to patients
- Manual translation is time-consuming for clinicians
- AI understands context and can simplify appropriately
- Cost-effective (small API calls)

**Workflow**:
```
Clinician writes: "Patient demonstrates elevated knee 
                  stress during dorsiflexion, recommend 
                  reduced plantar flexion activities"
                  
→ Gemini AI processes

Patient receives: "Try limiting activities that point 
                  your toes down (like sprinting or hill 
                  running) and practice walking slowly"
```

**Trade-offs**:
- ✓ Better patient understanding
- ✓ Saves clinician time
- ✓ Consistent tone
- ✗ Requires external API (cost, latency)
- ✗ AI can make mistakes in medical context

---

### 8. **Audit Logging for Compliance**

**Decision**: Log all sensitive clinician actions for HIPAA compliance.

**Tracked Actions**:
- Patient data exports
- Intervention creation
- Settings changes
- Access patterns

**Implementation**:
```javascript
await prisma.auditLog.create({
  data: {
    clinicianId,
    action: "EXPORT_PATIENT_DATA",
    targetType: "Patient",
    targetId: patientId,
    details: JSON.stringify({ dateRange, format }),
    ipAddress: req.ip
  }
});
```

**Trade-offs**:
- ✓ Compliance ready (HIPAA, GDPR)
- ✓ Security investigation trail
- ✓ Detects unauthorized access
- ✗ Additional database writes
- ✗ Storage cost for large deployments

---

## Scalability & Performance

### Performance Optimization Strategies

#### 1. **Database Query Optimization**

**Problem**: N+1 queries when fetching patient with related data.

```javascript
// ❌ Bad: N+1 queries
const patients = await prisma.patient.findMany();
for (const p of patients) {
  const logs = await prisma.sensorLog.findMany({
    where: { patientId: p.id }
  });
  // Queries: 1 for patients + N queries for each patient's logs
}

// ✅ Good: Single query with relations
const patients = await prisma.patient.findMany({
  include: {
    sensorLogs: { take: 10, orderBy: { timestamp: 'desc' } }
  }
});
// Queries: 1 (Prisma batches relations)
```

#### 2. **Indexing Strategy**

**Indexes on high-query columns**:
```prisma
model Patient {
  id          String   @id
  email       String   @unique  // Fast lookups
  clinicianId String?           // Fast filtering
  createdAt   DateTime @default(now())
  
  @@index([clinicianId])        // Speed up patient filtering by clinician
}

model SensorLog {
  id        String   @id
  patientId String
  timestamp DateTime @default(now())
  
  @@index([patientId])          // Speed up sensor logs by patient
  @@index([timestamp])          // Speed up time-range queries
}

model AuditLog {
  id          String   @id
  clinicianId String
  createdAt   DateTime @default(now())
  
  @@index([clinicianId, createdAt])  // Composite index for audit trail queries
}
```

#### 3. **Pagination for Large Datasets**

```javascript
// Fetch paginated sensor logs
const logs = await prisma.sensorLog.findMany({
  where: { patientId },
  orderBy: { timestamp: 'desc' },
  take: 50,              // Limit: 50 records
  skip: (page - 1) * 50  // Offset: skip for pagination
});
```

#### 4. **Caching Strategy**

```javascript
// Cache patient dashboard data (revalidates every 60s)
export const revalidate = 60; // Next.js ISR

export async function generateMetadata({ params }) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id }
  });
  // Cached for 60 seconds
  return { title: `${patient.fullName}'s Dashboard` };
}
```

#### 5. **Connection Pooling**

```
DATABASE_URL="postgresql://user:pass@host/db?schema=public"
            # Connection pool auto-configured by Prisma
            # Default: 5 connections, can customize via query params
```

### Scalability Roadmap

#### **Phase 1: Current (Single Server, < 100 patients)**
- Single Node.js instance on Vercel/Railway
- Shared PostgreSQL (managed service)
- Shared MQTT broker (HiveMQ Cloud)
- Simple Prisma queries with basic indexing

#### **Phase 2: Growth (100-1000 patients)**
- Read replicas for PostgreSQL (separate read queries)
- Query result caching (Redis)
- Background job queue (Bull/BullMQ) for data export
- API rate limiting per clinician

```javascript
// Redis caching example
import redis from 'redis';

const client = redis.createClient();

export async function getCachedPatient(id) {
  const cached = await client.get(`patient:${id}`);
  if (cached) return JSON.parse(cached);
  
  const patient = await prisma.patient.findUnique({ where: { id } });
  await client.setEx(`patient:${id}`, 300, JSON.stringify(patient)); // 5 min TTL
  return patient;
}
```

#### **Phase 3: Enterprise (1000+ patients)**
- Horizontal scaling: Multiple Node.js instances
- Load balancer (AWS ALB, nginx)
- Separate services: auth, analytics, notification
- Event-driven architecture (Apache Kafka)
- Database sharding by clinician_id or region

#### **Phase 4: Multi-Region (Global deployment)**
- Multi-region database replication
- Content delivery network (CDN) for assets
- Regional API endpoints
- Implement data residency requirements

### Performance Benchmarks

| Operation | Current Time | Target | Bottleneck |
|-----------|--------------|--------|-----------|
| Page load (patient dashboard) | 1.2s | <800ms | MQTT subscription init |
| Create intervention | 800ms | <500ms | Gemini API latency |
| Export data (1000 records) | 3.5s | <2s | CSV generation + download |
| Email verification | 2.1s | <1s | Email service latency |
| Sensor data save (MQTT) | 150ms | <100ms | Database write |

---

## Security Considerations

### 1. **Authentication & Authorization**

#### JWT Token Strategy
```javascript
// actions/login.js
const token = jwt.sign(
  { 
    userId: clinician.clinician_id,
    role: 'clinician',
    email: clinician.email
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Store in HttpOnly cookie (not accessible by JavaScript)
res.setHeader('Set-Cookie', 
  `auth_token=${token}; HttpOnly; Secure; SameSite=Strict`
);
```

**Why HttpOnly**:
- Prevents XSS attacks from stealing tokens
- Automatically sent with requests
- Cannot be accessed by malicious JavaScript

#### Role-Based Access Control (RBAC)
```javascript
// middleware.js
export function middleware(req) {
  const token = req.cookies.get('auth_token');
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Clinician cannot access admin routes
  if (decoded.role !== 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  
  return NextResponse.next();
}
```

### 2. **Password Security**

```javascript
// Hash with bcryptjs (salt rounds = 12)
const passwordHash = bcrypt.hashSync(password, 12);

// Verify
const isValid = bcrypt.compareSync(inputPassword, storedHash);
```

**Salt Rounds**: 12 = ~250ms per hash (strong, modern standard)

### 3. **Data Protection in Transit**

- **HTTPS only**: All connections encrypted with TLS 1.3
- **API endpoints**: Require valid JWT bearer token
- **MQTT**: Encrypted connection to broker

```javascript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return NextResponse.redirect(new URL('https://' + req.headers.host + req.url));
  }
}
```

### 4. **Database Security**

#### Row-Level Security (RLS) - PostgreSQL
```sql
-- Patient can only see their own data
CREATE POLICY patient_read ON patient
  USING (id = current_user_id());

-- Clinician can only access assigned patients
CREATE POLICY clinician_read ON patient
  USING (clinicianId = current_clinician_id());
```

#### Parameterized Queries (Prisma prevents SQL injection)
```javascript
// Prisma automatically parameterizes through Prisma Client
const patient = await prisma.patient.findUnique({
  where: { id: userInput }  // Safe from injection
});

// DON'T do this:
const result = await db.query(`SELECT * FROM patients WHERE id = ${userInput}`);
```

### 5. **Input Validation & Sanitization**

```javascript
// Zod schema validates and transforms input
import { z } from 'zod';

const PatientUpdateSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
});

export async function updatePatient(data) {
  const validated = PatientUpdateSchema.parse(data);  // Throws if invalid
  return prisma.patient.update({ data: validated });
}
```

### 6. **Audit Logging**

Track all sensitive actions:
```javascript
await prisma.auditLog.create({
  data: {
    clinicianId,
    action: 'PATIENT_DATA_EXPORT',
    targetType: 'Patient',
    targetId: patientId,
    details: JSON.stringify({ format: 'CSV', recordCount: 1523 }),
    ipAddress: req.headers['x-forwarded-for']
  }
});
```

### 7. **Email Verification & Password Reset Security**

**Email Verification**:
- Generate random 6-digit code
- Store hashed token in database
- Token expires after 15 minutes
- Delete token once verified

```javascript
const code = Math.random().toString().slice(2, 8); // 6 digits
const hashedToken = bcrypt.hashSync(code, 10);

await prisma.emailVerificationToken.create({
  data: {
    email,
    token: hashedToken,
    expires: new Date(Date.now() + 15 * 60 * 1000) // 15 min
  }
});

// In email: "Your verification code is: 123456"
```

**Password Reset**:
- Use secure token (not predictable)
- Single-use only
- Short expiration (1 hour)

```javascript
import { randomBytes } from 'crypto';

const token = randomBytes(32).toString('hex');
const hashedToken = bcrypt.hashSync(token, 10);

await prisma.passwordResetToken.create({
  data: {
    email,
    token: hashedToken,
    expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }
});
```

### 8. **HIPAA Compliance Checklist**

- ✓ Encrypted data in transit (HTTPS/TLS)
- ✓ Encrypted data at rest (PostgreSQL + OS-level encryption)
- ✓ Audit logs for all access
- ✓ Strong authentication (JWT + HTTPS)
- ✓ Role-based access control
- ✓ Secure password hashing (bcryptjs)
- ✓ Email verification for account ownership
- ✓ Data retention policies (implement deletion)
- ✓ Business Associate Agreement with 3rd parties (Google Gemini, HiveMQ)
- ✓ Incident response plan (document breaches)

### 9. **Rate Limiting**

```javascript
// Implement rate limiting in middleware
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many login attempts, please try again later"
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

### 10. **Third-Party Integrations Security**

| Service | Risk | Mitigation |
|---------|------|-----------|
| Google Gemini API | API key exposure | Use server-only env vars, IP whitelist |
| HiveMQ MQTT | Credential theft | Client certs, rotate credentials annually |
| Email Service | Account takeover | Use app-specific passwords, 2FA |
| Weather API | Rate limits | Cache results, fallback values |

---

## Future Improvements & Roadmap

### Short-Term (Next 3 Months)

#### 1. **Mobile Native App**
- React Native app for iOS/Android
- Offline sensor data syncing
- Voice alerts and haptic feedback
- Push notifications integration

#### 2. **Enhanced ML Integration**
- Edge Impulse model deployment to device
- On-device risk prediction
- Continuous model retraining pipeline
- Anomaly detection for device malfunction

#### 3. **Advanced Analytics Dashboard**
- Cohort analysis (patients with similar profiles)
- Trend prediction (estimate future risk)
- Comparative insights (patient vs. population norms)
- Custom report builder

### Medium-Term (3-6 Months)

#### 4. **Real-Time Clinician Collaboration**
- Live patient data streaming to clinician dashboard
- Multi-clinician care teams per patient
- Consensus intervention workflow
- Clinical note templates library

#### 5. **Telemedicine Integration**
- Video consultation scheduling
- Screen sharing for data analysis
- Prescription e-signature
- Integrated messaging

#### 6. **Advanced Device Features**
- Environmental context sensors (humidity, elevation)
- Haptic feedback intervention triggering
- Voice command interface
- Biometric authentication on device

### Long-Term (6-12 Months)

#### 7. **Multi-Regional Deployment**
- EU data residency compliance
- GDPR-compliant data processing
- Regional compliance dashboards
- Multi-language support

#### 8. **Insurance Integration**
- Claims submission automation
- Coverage verification
- Outcome tracking for reimbursement
- Cost-benefit analysis dashboards

#### 9. **Research Module**
- De-identified dataset export for research
- Clinical trial patient recruitment
- Research ethics approval workflows
- Publication data sharing

#### 10. **AI-Powered Clinical Insights**
- Automated intervention recommendations (ML-based)
- Patient cohort risk profiling
- Preventative alert system
- Treatment effectiveness scoring

### Implementation Examples

#### **Mobile App Feature: Offline Sync**
```javascript
// React Native with SQLite
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'keurasense.db' });

export async function saveSensorOffline(sensorData) {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO sensorLogs (angle, force, timestamp) VALUES (?, ?, ?)',
      [sensorData.angle, sensorData.force, Date.now()]
    );
  });
}

// When back online, sync to server
export async function syncWithServer() {
  const logs = await querySqlite('SELECT * FROM sensorLogs WHERE synced = 0');
  
  for (const log of logs) {
    await fetch('/api/save-log', {
      method: 'POST',
      body: JSON.stringify(log)
    });
    
    await updateSqlite('UPDATE sensorLogs SET synced = 1');
  }
}
```

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import edge_impulse_sdk

# Load historical sensor data
df = pd.read_csv('datasets/historical_data.csv')

# Feature engineering
df['angle_velocity'] = df['angle'].diff() / df['timestamp'].diff()
df['force_intensity'] = df['force'].rolling(10).mean()

# Train model
X = df[['angle', 'force', 'angle_velocity', 'force_intensity']]
y = df['risk_level']

model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Deploy to Edge Impulse
ei_client = edge_impulse_sdk.Client()
ei_client.deploy_model(model, 'keurasense-risk-model-v2')
```

#### **Telemedicine Integration**
```javascript
// components/ConsultationRoom.jsx
import { ZegoCloud } from '@zego-uikit-prebuilt/react';

export default function ConsultationRoom({ patientId, clinicianId }) {
  const meetingID = `consult_${patientId}_${Date.now()}`;
  
  return (
    <ZegoCloud
      appID={process.env.ZEGO_APP_ID}
      serverSecret={process.env.ZEGO_SERVER_SECRET}
      roomID={meetingID}
      userID={clinicianId}
      userName={clinicianName}
      onUserJoin={(user) => console.log(`Patient ${user.userName} joined`)}
      sharedData={{ patientId, clinicianId }}
    >
      <ConsultationRecording />
      <SharedDataDisplay />
      <PrescriptionModule />
    </ZegoCloud>
  );
}
```

---

## Monitoring & Observability

### Key Metrics to Track

```javascript
// lib/metrics.js
export async function recordMetric(name, value, tags = {}) {
  // Send to monitoring service (e.g., DataDog, New Relic)
  await metricsClient.gauge(name, value, { tags });
}

// Usage
recordMetric('patient.sensor_logs.saved', 1, { 
  patientId, 
  riskScore,
  deviceId 
});

recordMetric('intervention.created', 1, {
  clinicianId,
  type: 'advice'
});

recordMetric('ai_latency_ms', geminiResponseTime, {
  model: 'gemini-pro'
});
```

### Critical Alerts

- MQTT broker connection lost (alerts > 5 sec)
- Database connection pool exhausted
- API response time > 2 seconds (p95)
- 5+ failed login attempts (potential attack)
- Patient data export without audit log (security issue)

---

## Conclusion

KneuraSense employs a modern, scalable architecture combining React 19 frontend with Next.js 16 backend, PostgreSQL for reliable healthcare data storage, and MQTT for real-time IoT integration. The system prioritizes security (HIPAA compliance), performance (optimized queries, caching), and maintainability (clear patterns, comprehensive logging).

Future enhancements will focus on mobile expansion, advanced ML capabilities, telemedicine integration, and multi-regional compliance to meet evolving healthcare needs.

---

**Document Version**: 1.0  
**Last Updated**: March 18, 2026  
**Maintained By**: KneuraSense Team