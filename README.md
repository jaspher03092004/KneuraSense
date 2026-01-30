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

##  Getting Started

Follow these step-by-step instructions to set up KneuraSense on your local machine.

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v14 or later) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Step 1: Clone the Repository

\\\ash
git clone <repository-url>
cd KneuraSense
\\\

### Step 2: Install Dependencies

Install all required npm packages:

\\\ash
npm install
\\\

This will install all dependencies listed in \package.json\, including:
- Next.js framework
- Prisma ORM and PostgreSQL adapter
- React and React DOM
- Tailwind CSS and PostCSS
- ESLint for code quality

### Step 3: Set Up Environment Variables

Create a \.env.local\ file in the root directory. This file stores sensitive configuration data that should **never** be committed to Git.

\\\ash
# In the project root, create the file:
.env.local
\\\

Add the following content to \.env.local\:

\\\
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/keurasense"

# Add any other environment variables your app needs here
\\\

**Important**: Replace \username\ and \password\ with your PostgreSQL credentials, and ensure the database name is \keurasense\.

### Step 4: Set Up the PostgreSQL Database

#### On Windows (Using PostgreSQL)

1. **Start PostgreSQL Service**:
   - PostgreSQL should start automatically when you install it
   - If not, open **Services** (press \Win + R\, type \services.msc\, press Enter)
   - Find "PostgreSQL Database Server" and ensure it's running

2. **Create the Database**:
   - Open **pgAdmin** (usually found in your Start Menu) or use **psql** command line
   - Log in with your PostgreSQL superuser credentials
   - Create a new database:
     \\\sql
     CREATE DATABASE keurasense;
     \\\

3. **Update \.env.local\** with your actual PostgreSQL credentials

#### Alternative: Using Command Line (psql)

If you have PostgreSQL command-line tools installed, you can run:

\\\ash
psql -U postgres -c "CREATE DATABASE keurasense;"
\\\

(Replace \postgres\ with your PostgreSQL username if different)

### Step 5: Initialize the Database Schema

Now that the database exists, use Prisma to apply the schema and create tables:

\\\ash
# Generate Prisma client
npx prisma generate

# Push the database schema (creates tables and structure)
npx prisma db push
\\\

What this does:
- \prisma generate\: Creates the Prisma client code needed for database operations
- \prisma db push\: Applies your schema to the PostgreSQL database and creates all required tables

### Step 6: Run the Development Server

Start the Next.js development server:

\\\ash
npm run dev
\\\

You should see output similar to:
\\\
> keurasense@0.1.0 dev
> next dev

   Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local
\\\

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to see the application running!

---

##  Available Commands

After setup, you can use these npm commands:

\\\ash
# Start development server (with hot reload)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter to check code quality
npm run lint
\\\

---

##  Project Structure

\\\
src/
 actions/          # Server-side actions (login, register)
 app/              # Next.js app directory (pages and layouts)
 components/       # Reusable React components
 generated/        # Auto-generated Prisma client code
 lib/              # Utility modules (MQTT, Prisma, Weather)

prisma/
 schema.prisma     # Database schema definition
\\\

---

##  Database Management

### View Your Database

To view and manage your data, use pgAdmin or the Prisma Studio:

\\\ash
# Open Prisma Studio (web interface for your database)
npx prisma studio
\\\

This opens a browser interface where you can view, create, and edit data in your database.

### Reset Database ( Use with caution!)

If you need to reset your database during development:

\\\ash
npx prisma db push --force-reset
\\\

** Warning**: This will delete all data in your database!

---

##  Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check your \DATABASE_URL\ in \.env.local\ has the correct credentials
- Verify the database \keurasense\ exists

### "Module not found" error
- Run \
pm install\ again
- Delete \
ode_modules\ folder and \.next\ folder, then run \
pm install\

### Port 3000 already in use
- Run with a different port: \
pm run dev -- -p 3001\

### Prisma client issues
- Regenerate the client: \
px prisma generate\
- Clear cache: \m -r node_modules/.prisma\ then \
pm install\

---

##  Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

##  Contributing

When working with this codebase:
1. Create a new branch for your feature
2. Make your changes and test locally
3. Run \
pm run lint\ before committing
4. Push to your branch and create a pull request

---

##  Notes for Team Members

- **Never commit \.env.local\** - Each team member should have their own copy
- **Always run \
pm install\** after pulling new changes
- **Database migrations**: Use \
px prisma db push\ to sync schema changes
- **Keep dependencies updated**: Run \
pm update\ periodically (with caution)

---

Happy coding!  If you have questions or run into issues, reach out to the team.
