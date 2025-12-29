# College API

A RESTful API built with Express.js, Prisma, and Neon DB to manage university and college data.

## Features

- **University Endpoints**: CRUD operations for universities
- **College Endpoints**: CRUD operations for colleges
- **Pagination**: All list endpoints support pagination
- **Search & Filtering**: Search by name, AISHE code, and filter by state, district, college type, management
- **Bulk Import**: Import data from Excel files
- **Relationships**: Colleges are linked to their parent universities
- **Rate Limiting**: Per-endpoint rate limiting to prevent abuse
- **MVC Architecture**: Clean separation of controllers, routes, and middleware

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── controllers/            # Business logic
│   │   ├── index.ts
│   │   ├── university.controller.ts
│   │   └── college.controller.ts
│   ├── middleware/             # Express middleware
│   │   ├── index.ts
│   │   └── rateLimiter.ts
│   ├── routes/                 # Route definitions
│   │   ├── universities.ts
│   │   └── colleges.ts
│   ├── lib/
│   │   └── prisma.ts           # Prisma client
│   ├── scripts/
│   │   └── import-excel.ts     # Excel import script
│   └── index.ts                # Entry point
├── data/                       # Put Excel files here
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+ 
- A [Neon DB](https://neon.tech) account (free tier available)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

1. Create a Neon DB database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Create a `.env` file in the `backend` folder:

```env
DATABASE_URL="postgresql://username:password@your-host.neon.tech/your-database?sslmode=require"
PORT=3000
```

### 3. Setup Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## Rate Limiting

The API implements per-endpoint rate limiting to prevent abuse:

| Operation Type | Limit | Endpoints |
|---------------|-------|-----------|
| **Read** | 200 req/min | GET by ID, GET by AISHE code |
| **Search** | 50 req/min | GET states, GET types, GET management-types |
| **Write** | 30 req/min | POST create, PUT update |
| **Bulk** | 5 req/min | POST bulk create |
| **Delete** | 20 req/min | DELETE endpoints |
| **General** | 100 req/min | Fallback for all other routes |

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when the limit resets

## API Endpoints

### Universities

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/universities` | 200/min | Get all universities (paginated) |
| GET | `/api/universities/:id` | 200/min | Get university by ID |
| GET | `/api/universities/aishe/:code` | 200/min | Get university by AISHE code |
| GET | `/api/universities/states` | 50/min | Get list of unique states |
| POST | `/api/universities` | 30/min | Create new university |
| POST | `/api/universities/bulk` | 5/min | Bulk create universities |
| PUT | `/api/universities/:id` | 30/min | Update university |
| DELETE | `/api/universities/:id` | 20/min | Delete university |

### Colleges

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/colleges` | 200/min | Get all colleges (paginated) |
| GET | `/api/colleges/:id` | 200/min | Get college by ID |
| GET | `/api/colleges/aishe/:code` | 200/min | Get college by AISHE code |
| GET | `/api/colleges/states` | 50/min | Get list of unique states |
| GET | `/api/colleges/types` | 50/min | Get list of college types |
| GET | `/api/colleges/management-types` | 50/min | Get list of management types |
| POST | `/api/colleges` | 30/min | Create new college |
| POST | `/api/colleges/bulk` | 5/min | Bulk create colleges |
| PUT | `/api/colleges/:id` | 30/min | Update college |
| DELETE | `/api/colleges/:id` | 20/min | Delete college |

### Query Parameters

All list endpoints support:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name or AISHE code
- `state` - Filter by state
- `district` - Filter by district

Colleges also support:
- `collegeType` - Filter by college type
- `management` - Filter by management type
- `universityId` - Filter by university ID

### Example Requests

```bash
# Get all universities with pagination
GET /api/universities?page=1&limit=20

# Search universities
GET /api/universities?search=Delhi

# Filter colleges by state and type
GET /api/colleges?state=Maharashtra&collegeType=Engineering

# Get university with all its colleges
GET /api/universities/aishe/U-0001

# Bulk import colleges
POST /api/colleges/bulk
Content-Type: application/json
{
  "colleges": [
    {
      "aisheCode": "C-0001",
      "name": "Example College",
      "state": "Maharashtra",
      "district": "Mumbai",
      "collegeType": "Engineering"
    }
  ]
}
```

### Response Format

All responses follow this format:

```json
// Success
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Error
{
  "success": false,
  "error": "Error message"
}

// Rate Limit Exceeded
{
  "success": false,
  "error": "Too many requests, please try again after a minute"
}
```

## Importing Excel Data

Place your Excel files in the `data` folder and run:

```bash
# Import universities
npm run import:universities -- --file=./data/universities.xlsx

# Import colleges
npm run import:colleges -- --file=./data/colleges.xlsx
```

### Expected Excel Column Headers

**Universities:**
- Aishe Code (required)
- Name (required)
- State (required)
- District (required)
- Website
- Year Of Establishment
- Location

**Colleges:**
- Aishe Code (required)
- Name (required)
- State (required)
- District (required)
- Website
- Year Of Establishment
- Location
- College Type
- Management
- University
- University Type
- Image

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run import:universities` | Import universities from Excel |
| `npm run import:colleges` | Import colleges from Excel |

## License

MIT
