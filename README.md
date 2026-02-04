# KneuraSense

KneuraSense is an affordable IoT-based wearable knee device that monitors joint stress and predicts overuse risk for Filipinos at risk of knee osteoarthritis. Using multiple sensors and edge AI, it analyzes movement, load, terrain, and weather, then provides real-time alerts and a web dashboard to help prevent pain flare-ups and injury.

##  Project Overview

This project is built with:
- **Frontend/Backend**: Next.js 16 (React 19)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: bcryptjs for secure password hashing
- **IoT Integration**: MQTT support for sensor data
- **Styling**: Tailwind CSS with PostCSS

---

## Getting Started

Follow these step-by-step instructions to set up **KneuraSense** on your local machine.

---

## Prerequisites

Before you begin, make sure you have the following installed:

* **Node.js** (v18 or later) – [https://nodejs.org/](https://nodejs.org/)
* **npm** (comes with Node.js) or **yarn**
* **PostgreSQL** (v14 or later) – [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
* **Git** – [https://git-scm.com/](https://git-scm.com/)

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd KneuraSense
```

---

## Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This installs all dependencies listed in `package.json`, including:

* Next.js
* Prisma ORM (PostgreSQL adapter)
* React & React DOM
* Tailwind CSS & PostCSS
* ESLint

---

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root. This file stores sensitive configuration and **must not** be committed to Git.

```bash
# Create the file in the project root
.env.local
```

Add the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/keurasense"

# Add any other environment variables your app needs here
```

**Important:** Replace `username` and `password` with your PostgreSQL credentials, and make sure the database name is `keurasense`.

---

## Step 4: Set Up the PostgreSQL Database

### On Windows (Using pgAdmin)

1. **Start PostgreSQL Service**

   * PostgreSQL usually starts automatically after installation
   * If not, press **Win + R** → type `services.msc` → Enter
   * Ensure **PostgreSQL Database Server** is running

2. **Create the Database**

   * Open **pgAdmin**
   * Log in using your PostgreSQL superuser credentials
   * Open the Query Tool and run:

```sql
CREATE DATABASE keurasense;
```

3. **Update `.env.local`** with your actual PostgreSQL username and password

---

### Alternative: Using Command Line (psql)

```bash
psql -U postgres -c "CREATE DATABASE keurasense;"
```

Replace `postgres` if your PostgreSQL username is different.

---

## Step 5: Initialize the Database Schema

Use Prisma to generate the client and apply the schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to the database (creates tables)
npx prisma db push
```

**What this does:**

* `prisma generate` – creates the Prisma client
* `prisma db push` – syncs your schema and creates tables in PostgreSQL

---

## Step 6: Run the Development Server

Start the Next.js dev server:

```bash
npm run dev
```

Expected output:

```text
> keurasense@0.1.0 dev
> next dev

Next.js 16.1.6
- Local:        http://localhost:3000
- Environments: .env.local
```

Open your browser and go to **[http://localhost:3000](http://localhost:3000)**.

---

## Available Commands

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Project Structure

```text
src/
  actions/        # Server actions (login, register)
  app/            # Next.js app directory
  components/     # Reusable UI components
  generated/      # Prisma-generated client
  lib/            # Utilities (MQTT, Prisma, Weather)

prisma/
  schema.prisma   # Database schema
```

---

## Database Management

### Prisma Studio

```bash
npx prisma studio
```

Opens a web UI to view and edit your database.

### Reset Database (Use with caution)

```bash
npx prisma db push --force-reset
```

⚠️ **Warning:** This deletes all data in the database.

---

## Troubleshooting

### Connection refused

* Ensure PostgreSQL is running
* Check `DATABASE_URL` in `.env.local`
* Confirm the `keurasense` database exists

### Module not found

* Run `npm install`
* Delete `node_modules` and `.next`, then reinstall

### Port 3000 already in use

```bash
npm run dev -- -p 3001
```

### Prisma issues

```bash
npx prisma generate
rm -rf node_modules/.prisma
npm install
```

---

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

Happy coding! 🚀
