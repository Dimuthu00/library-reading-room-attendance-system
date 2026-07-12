# 📚 Library Reading Room - 24/7 QR Attendance Gateway

A fully automated, self-service QR-based attendance monitoring system designed for 24/7 unmanned library reading rooms. Built as a comprehensive full-stack software project, this system replaces unreliable manual logbooks with secure, real-time tracking, Role-Based Access Control (RBAC), and automated reporting.

## ✨ Key Features

### 📸 The Kiosk (Student Edge Interface)
* **Self-Service Kiosk Mode:** A dark-themed, distraction-free UI designed to run continuously on a dedicated tablet at the reading room entrance.
* **Smart State Machine:** Automatically determines whether a scan is a "Check-In" or "Check-Out" based on the student's active session history.
* **Visual & Audio Feedback:** Provides instant on-screen layout changes (Emerald for Check-In, Blue for Check-Out, Red for Error) and scanner beeps.

### 🛡️ Administrative Dashboard & RBAC
* **Secure Authentication:** Next.js Middleware acts as a security guard, verifying server-side cookies before allowing access to the dashboard.
* **Role-Based Access Control (RBAC):** Custom database triggers assign `ADMIN` or `STAFF` roles, dynamically restricting UI components based on user privileges.
* **Real-Time Live Tracking:** WebSockets (Supabase Channels) instantly push new attendance logs to the admin dashboard without requiring a page refresh.
* **QR Pass Generator:** Integrated utility for `ADMIN` users to generate secure student QR passes directly from the dashboard.
* **Staff Management:** `ADMIN` accounts can securely provision and permanently delete other staff/admin accounts using secure Server Actions and Service Role keys.
* **Automated Reporting:** One-click CSV data export for data analysis and record-keeping.

## 💻 Tech Stack

**Frontend / UI:**
* [Next.js (App Router)](https://nextjs.org/) - React Framework
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
* `@yudiel/react-qr-scanner` - Hardware camera integration
* `qrcode.react` - SVG QR Code generation

**Backend / Database:**
* [Supabase](https://supabase.com/) - Open source Firebase alternative
* **PostgreSQL** - Relational database
* **Supabase Auth & SSR** - Secure cookie-based session management
* **Supabase Realtime** - WebSocket broadcasting

## 🗄️ Database Schema Overview

The system utilizes three primary tables secured via Row Level Security (RLS):
1. `students`: Stores student index numbers (`student_id`) and names.
2. `attendance_logs`: Tracks `check_in_time`, `check_out_time`, and current `status` (IN/OUT), linked to the student via foreign key.
3. `profiles`: A custom table automatically populated via PostgreSQL triggers upon Auth user creation to securely store `ADMIN` and `STAFF` roles.

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Dimuthu00/library-reading-room-attendance-system.git
cd library-reading-room-attendance-system

Test01