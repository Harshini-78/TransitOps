# TransitOps – Smart Transport Operations Platform

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232a?style=flat-square&logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007acc?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38b2ac?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-39827B?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)

TransitOps is a centralized fleet, transport, and expense management platform built to digitize and optimize the complete operational lifecycle of logistics and transport companies. 

The application integrates real-time fleet directory controls, driver compliance tracking, automated dispatch checking, maintenance lifecycle cards, and operational expense logs into a single, cohesive, modern workspace.

Built with a performance-first architecture, TransitOps bridges the gap between dispatch coordinators, fleet supervisors, and financial analysts by replacing slow, disconnected spreadsheets with instant data synchronization, transactional safety, and automated business validations.

---

# Problem Statement

Many transport and logistics companies still rely on manual data entry, disconnected local spreadsheets, and disjointed systems to organize their daily operations. This fragmentation results in:
* **Scheduling Overloads & Conflicts:** Double-booking drivers or deploying vehicles that are already on active trips.
* **Compliance Overlooks:** Fleet managers accidentally assigning drivers with expired or revoked licenses, creating liability.
* **Capacity Overloading:** Dispatching cargo loads that exceed a vehicle’s engineered payload limit, leading to vehicle strain and traffic penalties.
* **Invisible Overhead Costs:** Disorganized refueling logs and manual toll sheets that make calculating the true Total Operational Cost of trips difficult.
* **Poor Real-Time Visibility:** Lack of a consolidated visual feed showing active vehicle status distribution and upcoming maintenance requirements.

Organizations need a unified solution that structures fleet records, manages maintenance pipelines, tracks dynamic operational expenses, and programmatically enforces business constraints.

---

# Our Solution

TransitOps is a centralized smart transport platform that structures the complete transport lifecycle into a single web application. Consuming dynamic REST APIs with PostgreSQL persistence, the platform replaces manual verification with immediate, programmatic safety gates.

The platform provides:
* **Role-Based Workspaces:** Restructures view privileges based on roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) to optimize focus.
* **Dynamic Dispatch Validation:** Automatically screens driver eligibility, vehicle capacities, and routes to prevent scheduling errors or overloading.
* **Actionable Maintenance & Expense Loops:** Coordinates service schedules directly with vehicle availability states, ensuring that vehicles in service are removed from dispatch pools.

---

# Features

* **JWT Authentication:** Secure user registration, credential hashing, session management, and login flows.
* **Role-Based Access Control (RBAC):** Configured general settings and privilege matrices indicating Fleet, Driver, Trip, Fuel/Exp, and Analytics scope.
* **Dashboard Analytics:** High-level summary cards (active counts, safety ratings), active vehicle status distributions, and recent registry updates.
* **Vehicle Management:** Registry list featuring search filters, make/model tracking, odometer values, and active condition states (Available, On Trip, In Maintenance, Retired).
* **Driver Management:** Searchable and paginated directory containing compliance flags, safety score records, and license expiry alerts.
* **Trip Management (Dispatcher Board):** Left-side dispatch creation form equipped with live load capacity checks, and a right-side Live Board detailing active dispatches.
* **Maintenance & Service Board:** Left-side log panel detailing service costs and active dates, and a right-side Service Log table monitoring current vehicle workshop status.
* **Fuel & Expense Tracking:** Refueling tables tracking liter quantities and fuel costs, alongside toll/misc logs computing Total Operational Cost (Fuel + Maintenance + Tolls).
* **Reports & Analytics:** Dashboard displaying vertical-line KPI indicators, Monthly Revenue charts, and Top Costliest Vehicles progress charts.
* **Search, Pagination, and Filtering:** Fully implemented server-side and client-side helpers on large directories (Vehicles, Drivers).

---

# Business Rules Implemented

* **Vehicle Availability Check:** Vehicles currently set to `ON_TRIP` or `IN_MAINTENANCE` are excluded from the Dispatch vehicle options.
* **Driver Availability Check:** Drivers currently on active dispatches or set to `SUSPENDED` are filtered out of the Dispatch allocation lists.
* **License Expiry Check:** Safety indicators flag licenses expiring within 30 days. Expired license profiles trigger a compliance warning blocker.
* **Cargo Capacity Check:** When selecting a vehicle, its payload capacity is dynamically monitored. If the cargo weight exceeds the vehicle limit, an warning banner displays and blocks the "Dispatch" submission button.
* **Automatic Status Synchronization:**
  * Creating a Dispatch automatically moves the selected Vehicle and Driver to `ON_TRIP` / `ON_TRIP`.
  * Creating an active Maintenance Record automatically marks the Vehicle as `IN_MAINTENANCE` (In Shop) and removes it from the dispatch pool.
* **Fuel Cost Auto-Calculation:** Input liters and prices per liter auto-calculate the total refueling costs.
* **Database Consistency:** Uses Prisma transactions in critical modules to guarantee that related updates (e.g. creating a trip and updating vehicle status) succeed or fail together.

---

# Tech Stack

### Frontend
| Technology | Description | Badge |
| --- | --- | --- |
| Next.js 15 | React framework for App routing and builds | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) |
| TypeScript | Type-safe static analysis | ![TypeScript](https://img.shields.io/badge/TypeScript-007acc?style=flat-square&logo=typescript&logoColor=white) |
| Tailwind CSS | Utility-first responsive design framework | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38b2ac?style=flat-square&logo=tailwind-css&logoColor=white) |
| TanStack Query | Asynchronous backend data-fetching & caching | ![Query](https://img.shields.io/badge/React_Query-FF4154?style=flat-square&logo=react-query&logoColor=white) |
| Recharts | Interactive visual charts and progression loops | ![Charts](https://img.shields.io/badge/Recharts-22b5bf?style=flat-square&logo=recharts&logoColor=white) |
| Zod & Hook Form | Schema validation and client-side form controls | ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) |

### Backend
| Technology | Description | Badge |
| --- | --- | --- |
| Node.js & Express | Server architecture and endpoint routes | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) |
| Prisma ORM | Type-safe SQL query client and schemas | ![Prisma](https://img.shields.io/badge/Prisma-39827B?style=flat-square&logo=prisma&logoColor=white) |
| PostgreSQL | Relational database storage | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) |
| JWT & bcrypt | Authentication tokens and password hashing | ![JWT](https://img.shields.io/badge/JWT-black?style=flat-square&logo=JSON%20web%20tokens) |

---

# System Architecture

TransitOps is built as a decoupled Client-Server architecture. The frontend application is dynamic and consumes REST API endpoints from the backend server.

```
┌───────────────────────────────────────────┐
│         Next.js Client Dashboard          │
└─────────────────────┬─────────────────────┘
                      │  HTTP REST / JSON
                      ▼
┌───────────────────────────────────────────┐
│            Express Server API             │
├───────────────────────────────────────────┤
│            Prisma Query Engine            │
└─────────────────────┬─────────────────────┘
                      │  SQL / TCP Connection
                      ▼
┌───────────────────────────────────────────┐
│            PostgreSQL Database            │
└───────────────────────────────────────────┘
```

---

# Dynamic Dashboard Data

The dashboard is powered entirely by live data from the PostgreSQL database through the backend APIs. No dashboard statistics, charts, or tables are hardcoded.

### Backend

Whenever the `GET /dashboard` endpoint is requested, the backend computes all metrics in real time using Prisma ORM.

The dashboard service performs:

- Vehicle and driver counts using Prisma aggregation and grouping queries.
- Active trips and maintenance statistics directly from the database.
- Fuel, maintenance, and expense cost aggregation using Prisma aggregate queries.
- Fleet utilization calculation using:

`Fleet Utilization = (Vehicles On Trip / Total Vehicles) × 100`

Every dashboard metric is generated dynamically from the latest database records.

### Frontend

The frontend uses TanStack Query together with Axios to fetch dashboard data.

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const res = await api.get("/dashboard");
    return res.data;
  },
});
```

---

# Folder Structure

```
TransitOps/
├── frontend/             # Next.js Application
│   ├── src/
│   │   ├── app/          # App router view paths (dashboard, vehicles, drivers, trips, maintenance, fuel-expenses, analytics, settings)
│   │   ├── components/   # UI elements (buttons, inputs, spinner loaders, models)
│   │   ├── hooks/        # Authentication and authorization hooks
│   │   ├── services/     # API request structures (Axios backend instance)
│   │   └── types/        # TypeScript interface definitions
│   ├── package.json
│   └── tailwind.config.ts
└── backend/              # Express Server Application
    ├── prisma/           # Database models, migrations, and seed scripts
    ├── src/
    │   ├── controllers/  # API business logic handlers (auth, dashboard, vehicles, drivers, trips, maintenance, fuel, expenses)
    │   ├── middleware/   # Request auth validation checkpoints
    │   ├── routes/       # Express route registries
    │   └── server.ts     # Server boot script
    ├── package.json
    └── tsconfig.json
```

---

# Installation

### 1. Backend Server Setup
Navigate into the server directory, install resources, and execute database syncs:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 2. Frontend Client Setup
Navigate into the client directory, install assets, and start the development server:
```bash
cd ../frontend
npm install
npm run dev
```

---

# Environment Variables

Create `.env` config variables in your project directories:

### Backend `.env`
```env
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database>?schema=public"
JWT_SECRET="your_jwt_secret_token_key"
PORT=5000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

---

# API Overview

| Module | Route | Methods | Description |
| --- | --- | --- | --- |
| **Authentication** | `/auth` | POST | Login, Register, Profile info checks |
| **Dashboard** | `/dashboard` | GET | Active fleet KPI totals, fuel logs |
| **Vehicles** | `/vehicles` | GET, POST, DELETE | Vehicle registry records and states |
| **Drivers** | `/drivers` | GET, POST, DELETE | Compliance metrics and directories |
| **Trips** | `/trips` | GET, POST | Dispatch listings and scheduler validations |
| **Maintenance** | `/maintenance`| GET, POST, PATCH, DELETE | Active service cards and history tables |
| **Fuel Logs** | `/fuel-logs` | GET, POST | Refueling log listings and registration |
| **Expenses** | `/expenses` | GET, POST | Toll and operations expense records |

---

# Screenshots

### Login Page
`[ Placeholder for Login Page Screenshot ]`

### Dashboard Fleet Summary
`[ Placeholder for Dashboard Fleet Summary Screenshot ]`

### Vehicle Directory
`[ Placeholder for Vehicle Registry Directory Screenshot ]`

### Driver Compliance Matrix
`[ Placeholder for Driver Compliance Screenshot ]`

### Trip Dispatcher Board
`[ Placeholder for Trip Dispatcher Board Screenshot ]`

### Maintenance Service Board
`[ Placeholder for Maintenance Service Board Screenshot ]`

### Fuel & Expense Records
`[ Placeholder for Fuel & Expense Records Screenshot ]`

### Reports & Performance Analytics
`[ Placeholder for Reports & Performance Analytics Screenshot ]`

---

# Future Improvements

* **Automatic Notifications:** Integrated email alerts warning fleet operators about expiring licenses or service thresholds.
* **PDF Reports Export:** One-click downloads of operational expense audit reports.
* **GPS Tracking:** Interactive map previews showcasing real-time coordinate updates of dispatched trucks.
* **AI Predictive Maintenance:** Service frequency logs feeding forecasting models to flag vehicles needing preventative parts replacement.

---

# Team

| Name | Role | GitHub |
| --- | --- | --- |
| **Harshini** | Full Stack Developer | [@Harshini-78](https://github.com/Harshini-78) |
| **[Partner Name]** | [Partner Role] | [@username](https://github.com/username) |

---

# License

This project is licensed under the MIT License - see the LICENSE details for info.
