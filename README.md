# 📦 ResourceHub — Enterprise IT Asset Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.1_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Drizzle_ORM-003B57?style=for-the-badge&logo=sqlite)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**ResourceHub** is a modern, enterprise-grade IT Asset Management (ITAM) platform built with Next.js 16 App Router, React 19, TypeScript, and Drizzle ORM. It provides complete asset lifecycle tracking, automated request & multi-step approval workflows, software license management, QR code scanning, and immutable audit logging.

---

## ✨ Features & Functional Matrix

### 🏢 Asset Lifecycle & Inventory Management
- **Complete Asset Lifecycle**: Track physical IT assets across statuses: `available`, `assigned`, `reserved`, `in_repair`, `retired`, `lost`, and `disposed`.
- **Depreciation Calculation**: Automatic straight-line asset depreciation and book value calculation based on purchase price, salvage value, and useful life years.
- **QR Code Engine**: Instant QR code label generation and browser-based QR scanner for physical asset identification.
- **Bulk Import**: CSV asset import with validation and mapping helpers.

### 🔄 Request & Approval State Machine
- **Asset Requests**: Employee self-service for `new_asset`, `replacement`, `temporary_loan`, `return`, and `repair`.
- **Automated Workflow Engine**: Strict state transitions (`draft` ➔ `pending_approval` ➔ `approved` / `rejected` ➔ `in_progress` ➔ `completed` / `cancelled`).
- **High-Value Multi-Step Guard**: Automatic guard requiring Super Admin approval for assets with purchase price $\ge$ Rp 10.000.000.
- **Cascading License Unallocation**: Automatically releases allocated software licenses when asset return requests are completed.
- **Reservation Safeguard**: Automated background expiration cleanup returning stale `reserved` assets (> 7 days) back to `available`.

### 💻 Software License Management
- **Seat Allocation**: Manage perpetual, subscription, volume, and OEM software licenses.
- **Usage Tracking**: Assign license seats to users or assets with real-time seat availability monitoring.

### 🛠️ Maintenance & Service Desk
- **Maintenance Tickets**: Track issue severity (`low`, `medium`, `high`, `critical`), vendor details, technician assignments, cost estimates, and actual costs.
- **Asset Status Synchronization**: Automatic asset status transitions to `in_repair` and return to `available`/`reserved` upon maintenance resolution.

### 🔒 Enterprise Security & Auditability
- **6-Tier Role-Based Access Control (RBAC)**: Fine-grained access control across Super Admin, IT Admin, Manager, Employee, Internal Auditor, and Procurement Officer roles.
- **Immutable Audit Trail**: Automatic `before` and `after` JSON diffing for every mutating action with password hash redaction.
- **Double-Submit Cookie CSRF Protection**: Custom Edge-compatible CSRF validation (`x-csrf-token` header vs `rh_csrf` cookie).

---

## 👥 Role-Based Access Control (RBAC) & Demo Accounts

All demo accounts use the standard password: **`password`**

| Role | Demo Email | Password | Primary Responsibilities & Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@example.com` | `password` | Full system control, User Management, System Configuration, Audit Trail access. |
| **IT Admin** | `admin@example.com` | `password` | IT Asset Custodian: Asset CRUD, Maintenance tickets, Master Data, License management. |
| **Manager** | `manager@example.com` | `password` | Line Manager: Department asset overview, Request approval & rejection. |
| **Employee** | `employee@example.com` | `password` | End-user self-service: Request assets/loans/returns/repairs, view assigned assets. |
| **Internal Auditor** | `auditor@example.com` | `password` | Compliance & Finance: Read-Only access to Audit Logs, Asset Reports, and Financial Depreciation. |
| **Procurement Officer** | `procurement@example.com` | `password` | Purchasing & Inventory Entry: New asset registration and procurement reporting. |

---

## 🛠️ Tech Stack & Architecture

```
                                 ┌───────────────────────────┐
                                 │      Next.js 16 (Turbopack) │
                                 │   App Router & React 19   │
                                 └─────────────┬─────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
           ┌───────────▼───────────┐                       ┌───────────▼───────────┐
           │   Client UI Components│                       │   API Route Handlers  │
           │  (Tailwind v4, Motion)│                       │  (Proxy, RBAC, CSRF) │
           └───────────┬───────────┘                       └───────────┬───────────┘
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                   ┌───────────▼───────────┐
                                   │  Drizzle ORM Engine   │
                                   └───────────┬───────────┘
                                               │
                                   ┌───────────▼───────────┐
                                   │  SQLite Database WAL  │
                                   └───────────────────────┘
```

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database & ORM**: [SQLite](https://www.sqlite.org/) via `better-sqlite3` & [Drizzle ORM](https://orm.drizzle.team/)
- **Animation**: [Motion (Framer Motion)](https://motion.dev/)
- **Validation**: [Zod 4](https://zod.dev/)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/andrieanugrah/Resource-Hub.git
   cd Resource-Hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize & Seed the Database**:
   ```bash
   npm run seed
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser. Log in with any of the demo accounts listed above (e.g., `admin@example.com` / `password`).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack. |
| `npm run build` | Builds production bundle. |
| `npm run seed` | Resets SQLite database, executes migrations, and seeds demo data. |
| `npm run lint` | Runs ESLint code quality checks. |
| `npm run typecheck` | Runs TypeScript compiler verification (`tsc --noEmit`). |
| `npm run db:generate` | Generates Drizzle migration files. |
| `npm run db:migrate` | Runs pending database migrations. |
| `npm run db:push` | Pushes schema changes directly to SQLite. |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Application Base URL
APP_URL="http://localhost:3000"

# Optional: Email Notifications (Resend API)
RESEND_API_KEY=""
EMAIL_FROM="ResourceHub <noreply@resourcehub.local>"
```

---

## 📁 Project Structure

```
Resource-Hub/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Authenticated Shell Routes
│   │   ├── assets/             # Asset Management & Split-View
│   │   ├── requests/           # Request Portal & Approvals
│   │   ├── maintenance/        # Maintenance Tickets & Vendor Desk
│   │   ├── licenses/           # License Management
│   │   ├── users/              # User Administration (RBAC)
│   │   ├── audit-logs/         # System Audit Trail
│   │   ├── reports/            # Financial & Depreciation Reports
│   │   └── scan/               # QR Code Camera Scanner
│   ├── api/                    # API Route Handlers (CSRF & Auth)
│   └── login/                  # Authentication Page
├── components/                 # Reusable UI & Layout Components
│   └── ui/                     # Base Primitives (Card, Dialog, Table, etc.)
├── drizzle/                    # Database Schema & Migration Files
├── lib/                        # Core Utilities
│   ├── audit.ts                # Audit Log Diff Engine
│   ├── auth.ts                 # Custom Session & Password Scrypt
│   ├── db.ts                   # Database Abstraction & SQL Helpers
│   ├── permissions.ts          # RBAC Matrix & Role Labels
│   ├── request-transitions.ts  # Centralized Request State Machine
│   └── validate.ts             # Zod Validation Schemas
├── scripts/                    # Database Seed & Migration Scripts
├── stores/                     # Zustand State Stores
└── proxy.ts                    # Edge Routing & Session Guard
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes adhering to conventional commits: `git commit -m 'feat: add amazing feature'`.
4. Ensure CI gates pass cleanly: `npm run lint && npm run typecheck`.
5. Push to your branch: `git push origin feature/amazing-feature`.
6. Open a Pull Request.

---

## ⚖️ License & Ethical Standards

Distributed under the **MIT License**. See `LICENSE` for more information.

This project strictly adheres to open-source software ethics: no tracking, no hidden analytics, privacy-first local storage, and secure scrypt password hashing.
