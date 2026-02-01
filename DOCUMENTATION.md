# KneuraSense Documentation
## Technical Deep-Dive: Architecture & Implementation

This section provides a comprehensive technical overview of the KneuraSense system architecture, designed to facilitate onboarding and guide architectural decisions.

### Architectural Overview

KneuraSense employs a modern full-stack architecture built on Next.js with clear separation of concerns:

```
┌─────────────────────┐
│   React Components  │  (components/, UI logic)
└──────────┬──────────┘
           │
┌──────────v─────────────────────────────────────┐
│   Next.js App Router (app/)                     │
│   ├── Route Groups: (clinician), (auth)        │
│   ├── Dynamic Routes: patient/[id]              │
│   └── API Routes: api/                          │
└──────────┬──────────────────────────────────────┘
           │
┌──────────v──────────────────┐
│   Data Layer (lib/)          │
│   ├── Prisma ORM Client     │
│   ├── MQTT Integration      │
│   └── Weather Service       │
└──────────┬──────────────────┘
           │
┌──────────v──────────────────┐
│   PostgreSQL Database        │
└─────────────────────────────┘
```

#### Frontend-API Interaction Flow

The application follows a clear request-response pattern:

1. **UI Layer** (`components/`): React components handle user interactions and state management
2. **Route Logic** (`app/`): Next.js pages and layouts orchestrate page rendering and data flows
3. **API Routes** (`app/api/`): Backend endpoints expose data operations and integrate with the database
4. **Data Persistence** (`lib/prisma.js`): Singleton Prisma Client manages all database operations

**Example flow for patient data retrieval:**
```
React Component → app/patient/[id]/dashboard/page.js → api/patient/[id]/route.js → lib/prisma.js → PostgreSQL
```

### Route Architecture: (clinician) Route Group vs. patient/[id]

Next.js **route groups** (denoted by parentheses) enable logical organization without affecting URL structure:

| Route Type | Pattern | Purpose | URL Example |
|-----------|---------|---------|-------------|
| **Clinician Route Group** | `app/(clinician)/` | Protected clinician-only pages | `/clinician/[id]/dashboard` |
| **Patient Dynamic Route** | `app/patient/[id]/` | Patient-specific dashboards | `/patient/[id]/dashboard` |
| **Auth Route Group** | `app/(auth)/` | Public authentication pages | `/login`, `/register` |

**Key Distinction:**
- **(clinician)** uses a route group to share a common layout (`app/(clinician)/layout.js`) without the word "clinician" appearing in the URL
- **patient/[id]** is a dynamic segment route, where `[id]` becomes a variable path parameter accessible as a URL slug

Both can have nested layouts and components, but route groups are semantically grouped without URL implications, while dynamic routes create user-facing URLs.

---

### Database & Data Layer

#### Prisma Client Architecture

The `generated/` directory contains auto-generated Prisma client code that bridges your TypeScript/JavaScript code to the PostgreSQL database:

| File/Directory | Purpose |
|---|---|
| `generated/client.ts` | Main Prisma Client export for database queries |
| `generated/models.ts` | TypeScript type definitions for database models |
| `generated/enums.ts` | Enum definitions (status types, roles, etc.) |
| `generated/commonInputTypes.ts` | Input type definitions for mutations |
| `generated/models/Clinician.ts` | Clinician model with relations and methods |
| `generated/models/Patient.ts` | Patient model with relations and methods |
| `generated/internal/` | Internal Prisma utilities and namespaces |

**Generation Process:**
```bash
npx prisma generate  # Re-generates client when schema.prisma changes
```

These files are auto-generated from `prisma/schema.prisma`, so they should **never be manually edited**. They update whenever your database schema changes.

#### Singleton Prisma Instance: lib/prisma.js

All database operations route through a single Prisma Client instance (`lib/prisma.js`) to prevent connection pool exhaustion and ensure consistent transaction handling:

```javascript
// lib/prisma.js - Singleton Pattern
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Why Singleton?**
- **Connection Pooling**: Reuses database connections across the entire application
- **Memory Efficiency**: Prevents multiple Client instances consuming excessive resources
- **Transaction Safety**: Centralized transaction management
- **Hot Reload Support**: Preserves database connection during development

**Usage Example:**
```javascript
// app/api/patient/[id]/route.js
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(params.id) },
    include: { clinician: true }
  });
  return Response.json(patient);
}
```

#### Model Relationships

The data model defines relationships between Clinician and Patient entities:

```
Clinician
  ├── id (Primary Key)
  ├── email
  ├── passwordHash
  ├── patients (One-to-Many Relation)
  └── [additional fields...]

Patient
  ├── id (Primary Key)
  ├── name
  ├── clinicianId (Foreign Key)
  ├── clinician (Many-to-One Relation)
  ├── sensorReadings (One-to-Many Relation)
  └── [additional fields...]
```

**Querying with Relations:**
```javascript
// Fetch clinician with all patients
const clinician = await prisma.clinician.findUnique({
  where: { id: clinicianId },
  include: { patients: true }
});

// Fetch patient with clinician details
const patient = await prisma.patient.findUnique({
  where: { id: patientId },
  include: { clinician: true }
});
```

---

### Infrastructure & Utilities

#### Real-Time Messaging: lib/mqtt.js

MQTT (Message Queuing Telemetry Transport) handles real-time communication between IoT devices and the web application:

**Purpose:**
- **Sensor Data Streaming**: Receives continuous updates from knee sensors
- **Low Bandwidth**: MQTT is optimized for IoT with minimal overhead
- **Publish-Subscribe Model**: Decouples device publishers from data consumers
- **Reliability**: Supports message persistence and acknowledgment

**Integration Points:**
```
IoT Devices → MQTT Broker → lib/mqtt.js → Application State/Database
```

**Topic Structure** (typical pattern):
```
keurasense/device/{deviceId}/sensor/{sensorType}/data
keurasense/device/{deviceId}/alert
keurasense/device/{deviceId}/status
```

**Implementation Pattern:**
```javascript
// lib/mqtt.js - Example subscriber
import mqtt from "mqtt";

const client = mqtt.connect(process.env.MQTT_BROKER_URL);

client.subscribe("keurasense/device/+/sensor/+/data", (err) => {
  if (!err) console.log("MQTT subscribed to sensor data");
});

client.on("message", (topic, message) => {
  const payload = JSON.parse(message);
  // Process sensor data, trigger alerts, update database
});
```

#### Weather Integration: lib/weather.js

Contextual weather data enriches knee stress analysis by accounting for environmental factors:

**Weather Impact on Knee Stress:**
- **Humidity**: Affects cartilage swelling and joint stiffness
- **Temperature**: Cold temperatures increase inflammation risk
- **Barometric Pressure**: Correlates with joint pain and tissue expansion
- **Terrain Adaptation**: Wet/slippery conditions increase compensation stress

**API Integration:**
- Typically integrates with OpenWeatherMap, Weather API, or similar service
- Caches weather data to minimize API calls
- Timestamps all readings for correlation with sensor data

**Usage in Dashboard:**
```
Patient Sensor Reading + Weather Conditions → Risk Assessment Algorithm → Alert/Recommendation
```

**Example Flow:**
```javascript
// Fetch current weather and patient sensor data
const weather = await lib.weather.getCurrent(patientLocation);
const sensorData = await prisma.sensorReading.findLatest();

// Combine factors in risk calculation
const riskScore = calculateRisk(sensorData, weather);
```

---

### File Management Logic

#### Components vs. App: Clear Separation of Concerns

| Aspect | `src/components/` | `src/app/` |
|--------|-------------------|-----------|
| **Purpose** | Reusable UI components | Page routing & layouts |
| **State Management** | Local component state, props | Server/Client components |
| **Examples** | `StressGauge.jsx`, `SensorGrid.jsx` | `dashboard/page.js`, `layout.js` |
| **Responsibility** | Rendering UI, handling user interactions | Orchestrating data flows & page structure |
| **Reusability** | Used across multiple pages | Page-specific logic |

**Component Examples:**

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AlertModal.jsx` | Displays critical alerts | `isOpen`, `message`, `severity`, `onClose` |
| `LogoutButton.jsx` | User session termination | `onLogout` callback |
| `SensorGrid.jsx` | Multi-sensor data display | `sensorData[]`, `updateFrequency` |
| `StressGauge.jsx` | Visual stress level indicator | `stressLevel`, `threshold`, `animated` |

**Component Usage Pattern:**
```javascript
// app/patient/[id]/dashboard/page.js
import StressGauge from "@/components/StressGauge";
import SensorGrid from "@/components/SensorGrid";

export default function PatientDashboard({ params }) {
  const [sensorData, setSensorData] = useState([]);
  
  return (
    <div className="dashboard">
      <StressGauge stressLevel={calculateStress(sensorData)} />
      <SensorGrid sensorData={sensorData} />
    </div>
  );
}
```

#### Server Actions for Authentication

The `src/actions/` directory contains server-side logic for sensitive operations:

| File | Purpose | Exports |
|------|---------|---------|
| `login.js` | User authentication | `loginAction()` - validates credentials |
| `register.js` | New account creation | `registerAction()` - hashes password, creates user |

**Server Actions Pattern** (Next.js 13+):
```javascript
// src/actions/login.js
'use server'

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginAction(email, password) {
  const user = await prisma.clinician.findUnique({ where: { email } });
  
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error("Invalid credentials");
  }
  
  // Create session, return authentication token
  return { success: true, userId: user.id };
}
```

**Why Server Actions?**
- **Security**: Sensitive operations run on server, not exposed to browser
- **Database Access**: Direct database queries without API route boilerplate
- **Simplicity**: Reducesapi route verbosity for straightforward operations

---

### Developer Workflow & Standards

#### Configuration Files Management

The following files establish and maintain code quality standards:

| File | Purpose | Key Settings |
|------|---------|--------------|
| `eslint.config.mjs` | JavaScript linting | Code style, best practices enforcement |
| `postcss.config.mjs` | CSS post-processing | Tailwind CSS integration, vendor prefixes |
| `next.config.mjs` | Next.js compilation | Environment variables, image optimization, API routes |
| `jsconfig.json` | JavaScript/TypeScript configuration | Path aliases (`@/` → `src/`), module resolution |

**Path Alias Configuration** (`jsconfig.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This enables clean imports across the application:
```javascript
// Instead of: import prisma from "../../../lib/prisma"
import prisma from "@/lib/prisma";
```

#### Build & Development Workflow

**Development:**
```bash
npm run dev              # Hot-reload development server
npm run lint            # Check code quality before commit
```

**Production:**
```bash
npm run build           # Compile optimized production bundle
npm start               # Run production server
npx prisma db push     # Sync database schema before deployment
```

**Code Quality Checklist:**
1. ✅ Run `npm run lint` - Fix ESLint violations
2. ✅ Test API routes with `curl` or Postman
3. ✅ Verify Prisma schema changes with `npx prisma db push`
4. ✅ Test authentication flows (login/register)
5. ✅ Validate MQTT connectivity to sensor devices

#### Environment & Dependencies

**Key Dependencies by Purpose:**

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | Next.js | 16 | Full-stack React framework |
| **UI** | React | 19 | Component library |
| **Styling** | Tailwind CSS | Latest | Utility-first CSS framework |
| **Database** | Prisma | Latest | Type-safe ORM |
| **Database** | pg | Latest | PostgreSQL driver |
| **Security** | bcryptjs | Latest | Password hashing |
| **IoT** | mqtt | Latest | MQTT client |
| **Dev Tools** | ESLint | Latest | Code linting |

**Dependency Management:**
```bash
npm update              # Check for updates
npm audit              # Security vulnerabilities
npm ci                 # Clean install (production)
npm install            # Add/update dependencies
```

---

### Data Flow Diagrams

#### Login & Session Flow

```
1. User submits credentials (UI)
          ↓
2. Browser sends to /login (route)
          ↓
3. loginAction() validates against database
          ↓
4. bcrypt compares password with hash
          ↓
5. Create session/JWT token
          ↓
6. Redirect to /clinician/[id]/dashboard
```

#### Real-Time Sensor Data Flow

```
IoT Knee Device
          ↓
MQTT Topic: keurasense/device/{id}/sensor/pressure/data
          ↓
lib/mqtt.js receives message
          ↓
Parse + Validate payload
          ↓
Store in database (prisma.sensorReading.create)
          ↓
Broadcast to connected clients (WebSocket/polling)
          ↓
Components update (StressGauge, SensorGrid)
          ↓
Alert if threshold exceeded
```

#### API Request Pattern

```
React Component
          ↓
fetch("/api/patient/[id]", { method: "GET" })
          ↓
app/api/patient/[id]/route.js handles request
          ↓
Calls prisma.patient.findUnique()
          ↓
PostgreSQL returns data
          ↓
Response serialized as JSON
          ↓
Component receives & renders data
```

---

### Best Practices & Standards

#### Security Guidelines

1. **Never commit `.env.local`** - Each environment has unique credentials
2. **Validate all inputs** - Both client and server-side validation
3. **Use HTTPS in production** - MQTT should use MQTTS (encrypted)
4. **Hash passwords with bcryptjs** - Never store plain text passwords
5. **Implement rate limiting** - Prevent brute-force attacks on auth endpoints

#### Database Best Practices

1. **Always use Prisma Client** - Never raw SQL queries
2. **Use transactions for multi-step operations** - Ensure consistency
3. **Index frequently queried fields** - Improve query performance
4. **Review schema.prisma before pushing** - Database migrations are permanent

```javascript
// Good: Transactional operation
await prisma.$transaction([
  prisma.patient.update({ ... }),
  prisma.sensorReading.createMany({ ... })
]);
```

#### Performance Optimization

1. **Cache MQTT topic subscriptions** - Avoid re-subscribing on every render
2. **Debounce sensor data updates** - Limit database writes
3. **Use Next.js Image optimization** - Reduce dashboard load times
4. **Implement pagination** - For large sensor datasets

---

### Troubleshooting Reference

| Issue | Cause | Solution |
|-------|-------|----------|
| Prisma Client errors | Schema out of sync | Run `npx prisma generate && npx prisma db push` |
| MQTT connection fails | Broker unreachable | Verify MQTT_BROKER_URL in .env.local |
| Authentication fails | Corrupted session | Clear cookies, re-login |
| Slow dashboard loads | Unoptimized queries | Use Prisma select() to limit returned fields |
| Database connection pool exhausted | Too many concurrent connections | Verify lib/prisma.js singleton usage |

---

### Additional Resources

- **Next.js App Router**: https://nextjs.org/docs/app
- **Prisma ORM**: https://www.prisma.io/docs
- **MQTT Protocol**: https://mqtt.org/
- **PostgreSQL**: https://www.postgresql.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---