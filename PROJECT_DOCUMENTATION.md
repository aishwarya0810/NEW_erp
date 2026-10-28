# StockPilot ERP — Complete Project Master Documentation

---

## 1. Project Overview & Business Value

### What is this project?
**StockPilot ERP** ek modern, production-grade **Inventory, Multi-Warehouse aur Supply Chain Management ERP platform** hai. Iska main aim businesses ke products, stock levels, warehouse locations, suppliers, purchase orders (PO), customer sales orders (SO) aur users ko ek single centralized system me efficiently manage karna hai.

### Yeh project kyu banaya gaya? (Why was it built?)
Traditional trading, retail aur manufacturing businesses me regular manual operations ke dauraan bohot saari critical problems aati hain:
1. **Stock Inaccuracy & Discrepancies**: Physical warehouse me kitna actual item bacha hai aur register me kitna likha hai, isme mismatch hona.
2. **Stockouts & Overstocking**: Time pe stock reorder na hone se customer order cancel ho jana, ya zarurat se zyada saman khareed lene se capital block ho jana.
3. **Multi-Warehouse Isolation**: Alag-alag godowns/warehouses ka stock ek sath visible na hona.
4. **Lack of Role-Based Security (RBAC)**: Sabhi employees ko pura data dikhna jisse price tampering aur unauthorized data leaks ka risk rehta hai.
5. **No Audit Trail**: Kisi product ka price ya quantity kisne kab badli, iska koi clear record na milna.

**StockPilot ERP** in sabhi pain points ko solve karne ke liye banaya gaya hai jisme automatic inventory sync, transactional safety, multi-warehouse support aur enterprise RBAC security milti hai.

---

## 2. Key Modules & Business Utility (Yeh Kya Kaam Aata Hai?)

| Module | Business Functionality (Kaam kya karta hai) |
|---|---|
| **Multi-Warehouse Management** | Multiple cities/locations ke warehouses create karna, har warehouse ki capacity monitor karna aur active warehouse context switch karna. |
| **Catalog & Inventory** | Products ko SKU codes, barcodes, unit prices, aur categories ke sath manage karna. Minimum threshold set karke low-stock alerts dekhna. |
| **Purchasing & Suppliers** | Suppliers/Vendors ka record maintain karna, Purchase Orders (PO) raise karna. Jab stock warehouse me deliver ho tab single-click pe automatic inventory update karna. |
| **Sales & Customers** | Clients/Customers ke sales orders create karna. Order dispatch hote hi selected warehouse se accurate inventory auto-deduct hona. |
| **User Management & RBAC** | 5 distinct roles (`ADMIN`, `MANAGER`, `INVENTORY_STAFF`, `SALES_STAFF`, `WAREHOUSE_MANAGER`) ke sath role permissions aur user assignment manage karna. |
| **Audit Logs & Dashboard** | Har sensitive operation (login, create, update, role change) ka IP address aur timestamp ke sath audit trail maintain karna aur revenue/inventory metrics dekhna. |

---

## 3. Technology Stack & Implementation Details (Technologies Kaise Use Hui?)

### Backend Architecture
- **Node.js & Express.js (v5)**:
  - High-performance asynchronous REST API server create karne ke liye use hua hai. Express 5 modern routing aur robust error handling provide karta hai.
- **TypeScript**:
  - Full codebase me strict type safety ke liye. Isse compilation stage pe hi maximum runtime bugs aur schema mismatches pakad me aa jaate hain.
- **PostgreSQL**:
  - Relational database jo ACID transactions provide karta hai. Inventory aur order processing me financial aur stock accuracy maintain karne ke liye PostgreSQL ideal choice hai.
- **Prisma ORM (v7)**:
  - Database schema modeling (`prisma/schema.prisma`), automated migrations aur `@prisma/adapter-pg` ke through ultra-fast connection pooling aur type-safe queries execute karta hai.
- **JWT (JSON Web Tokens) & HTTP-Only Cookies**:
  - Secure stateless authentication ke liye short-lived access tokens (15m) aur long-lived refresh tokens (7d) database me track aur rotate kiye jaate hain.
- **Zod**:
  - Runtime request validation middleware. Har endpoint pe aane wala payload (`body`, `params`, `query`) strictly validate hota hai.
- **Security Middlewares (Helmet, CORS, Bcryptjs, Compression)**:
  - Password hashing ke liye Bcrypt, HTTP security headers ke liye Helmet, cross-origin security ke liye CORS aur response payload compression ke liye compression package use kiya gaya hai.

### Frontend Architecture
- **Next.js (v16 App Router) & React 19**:
  - Turbopack-powered fast compilation, server-side layout management aur client-side interactive dashboards provide karta hai.
- **TailwindCSS (v4)**:
  - Modern, responsive aur clean enterprise ERP interface design ke liye.
- **TanStack React Query (v5)**:
  - Server state caching, asynchronous API data fetching, optimistic UI updates aur auto cache invalidation handle karta hai.
- **Zustand**:
  - Client-side lightweight state management. Current logged-in user profile aur currently selected warehouse ka global state track karta hai.
- **Lucide React**:
  - Clean, high-quality consistent iconography ke liye.

---

## 4. Software Architecture & Flow (Project Kaise Banaya Gaya Hai?)

Project ko **Clean Layered Architecture (Controller-Service-Repository Pattern)** par structure kiya gaya hai:

```
[ Next.js Frontend (React Query + Zustand) ]
                     │  (HTTP / Axios with Cookies)
                     ▼
[ Express API Router & Middlewares (Auth, Roles, Zod Validation) ]
                     │
                     ▼
[ Controllers ]  --> Handles HTTP Req & Res format
                     │
                     ▼
[ Services ]     --> Core Business Logic, Stock Validation & Calculations
                     │
                     ▼
[ Repositories ] --> Database Layer (Prisma ORM Queries)
                     │
                     ▼
[ PostgreSQL Database ]
```

### Complete Workflow Example:
1. **Sales Order Process**:
   - Sales staff frontend me customer aur products select karke order place karta hai.
   - Request `src/routes/sales.routes.ts` me aati hai jaha `protect` middleware JWT token verify karta hai.
   - `sales.service.ts` database me check karti hai ki selected warehouse me required product quantity available hai ya nahi.
   - Agar stock available hai, to PostgreSQL **Prisma Transaction** execute hoti hai: Sales order save hota hai, warehouse stock se items minus hote hain, aur `audit.repository.ts` me entry create ho jaati hai.

---

## 5. How to Run the Project (Step-by-Step Guide)

### Prerequisites
- **Node.js** (v18 ya latest)
- **PostgreSQL** running hona chahiye

---

### Step 1: Database Setup
Make sure PostgreSQL service active ho aur database present ho:
```bash
# Terminal me PostgreSQL DB create karein (agar pehle se nahi bana hai)
createdb stockpilot_erp
```

---

### Step 2: Backend Setup & Execution
1. Terminal open karein aur backend directory me navigate karein:
   ```bash
   cd backend
   ```
2. Packages install karein (agar required ho):
   ```bash
   npm install
   ```
3. Database migrations run karein aur initial seed data daalein:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```
4. Backend server start karein:
   ```bash
   npm run dev
   ```
   *Backend ab port `5001` par running hoga: `http://localhost:5001/health`*

---

### Step 3: Frontend Setup & Execution
1. Ek dusre terminal tab me frontend directory me navigate karein:
   ```bash
   cd frontend
   ```
2. Packages install karein:
   ```bash
   npm install
   ```
3. Frontend development server start karein:
   ```bash
   npm run dev
   ```
   *Frontend ab port `3000` par running hoga: `http://localhost:3000`*

---

### Step 4: Login & Access Credentials
Browser me URL open karein: **[http://localhost:3000/login](http://localhost:3000/login)**

Default Seed Admin Credentials:
- **Email**: `admin@stockpilot.com`
- **Password**: `Admin@123`

Login karte hi aapko central dashboard dikhega jaha se aap **Warehouses, Inventory, Purchasing, Sales, Users** aur **Role Permissions** ko seamlessly operate kar sakte hain.
