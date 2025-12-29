# College API Documentation

A RESTful API providing comprehensive access to Universities and Colleges data in India. Supports search, filtering, pagination, and bulk operations.

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [University Endpoints](#university-endpoints)
7. [College Endpoints](#college-endpoints)
8. [Data Schemas](#data-schemas)
9. [Query Parameters Reference](#query-parameters-reference)
10. [Examples](#examples)

---

## Base URL

```
http://localhost:3000/api
```

Replace with your production URL when deployed.

---

## Authentication

Currently, the API is open and does not require authentication. Rate limiting is applied per IP address.

---

## Rate Limiting

To ensure fair usage and protect against abuse, the API implements rate limits per IP address:

| Category | Limit | Window | Applicable Endpoints |
|----------|-------|--------|---------------------|
| Read (General) | 200 requests | 1 minute | GET list, details, names |
| Search/Filter | 50 requests | 1 minute | GET states, types, search operations |
| Write | 30 requests | 1 minute | POST, PUT operations |
| Bulk Write | 5 requests | 1 minute | POST /bulk operations |
| Delete | 20 requests | 1 minute | DELETE operations |

When rate limit is exceeded, the API returns:
- Status: `429 Too Many Requests`
- Headers include `Retry-After` indicating seconds until reset

---

## Response Format

All API responses follow a consistent JSON structure:

### Success Response (List with Pagination)

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1386,
    "totalPages": 139
  }
}
```

### Success Response (Single Record)

```json
{
  "success": true,
  "data": {
    "id": "clxyz123...",
    "aisheCode": "U-0001",
    "name": "University Name",
    ...
  }
}
```

### Success Response (Names/Lightweight)

```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

### Success Response (Write Operation)

```json
{
  "success": true,
  "data": { ... },
  "message": "Successfully created 10 universities"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters or validation failed |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists (duplicate AISHE code) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side issue |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message string"
}
```

### Validation Error Response Format

```json
{
  "success": false,
  "error": {
    "_errors": [],
    "aisheCode": {
      "_errors": ["AISHE Code is required"]
    },
    "name": {
      "_errors": ["Name is required"]
    }
  }
}
```

---

## University Endpoints

### GET /api/universities

Retrieve a paginated list of universities with optional filtering.

**Rate Limit:** Read (200/min)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 10 | Number of results per page |
| search | string | - | Search by name or AISHE code (case-insensitive) |
| state | string | - | Filter by exact state name (case-insensitive) |
| district | string | - | Filter by exact district name (case-insensitive) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz123abc",
      "aisheCode": "U-0001",
      "name": "University of Mumbai",
      "state": "Maharashtra",
      "district": "Mumbai",
      "website": "https://mu.ac.in",
      "yearOfEstablishment": 1857,
      "location": "Mumbai, Maharashtra",
      "createdAt": "2024-12-30T00:00:00.000Z",
      "updatedAt": "2024-12-30T00:00:00.000Z",
      "_count": {
        "colleges": 789
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1386,
    "totalPages": 139
  }
}
```

**Example Requests:**

```http
GET /api/universities
GET /api/universities?page=2&limit=20
GET /api/universities?search=mumbai
GET /api/universities?state=Maharashtra&district=Pune
```

---

### GET /api/universities/names

Retrieve a lightweight list of university names and IDs. Optimized for dropdowns and autocomplete.

**Rate Limit:** Read (200/min)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search | string | - | Filter by name (case-insensitive, contains match) |
| limit | number | 10 | Maximum number of results |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz123abc",
      "aisheCode": "U-0001",
      "name": "University of Mumbai"
    }
  ],
  "count": 50
}
```

---

### GET /api/universities/states

Retrieve a list of unique states that have universities.

**Rate Limit:** Search (50/min)

**Response:**

```json
{
  "success": true,
  "data": [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    ...
  ]
}
```

---

### GET /api/universities/:id

Retrieve complete details of a university by its internal ID, including all affiliated colleges.

**Rate Limit:** Read (200/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal university ID (CUID format) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxyz123abc",
    "aisheCode": "U-0001",
    "name": "University of Mumbai",
    "state": "Maharashtra",
    "district": "Mumbai",
    "website": "https://mu.ac.in",
    "yearOfEstablishment": 1857,
    "location": "Mumbai, Maharashtra",
    "createdAt": "2024-12-30T00:00:00.000Z",
    "updatedAt": "2024-12-30T00:00:00.000Z",
    "colleges": [
      {
        "id": "clxyz456def",
        "aisheCode": "C-0001",
        "name": "Affiliated College 1",
        ...
      }
    ]
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "University not found"
}
```

---

### GET /api/universities/aishe/:code

Retrieve complete details of a university by its AISHE code.

**Rate Limit:** Read (200/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | AISHE code (e.g., "U-0001") |

**Response:** Same as GET /api/universities/:id

---

### GET /api/universities/search-colleges/:name

Find all colleges affiliated with a university by searching university name.

**Rate Limit:** Search (50/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | University name to search (partial match, case-insensitive) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz456def",
      "aisheCode": "C-0001",
      "name": "Engineering College",
      "state": "Maharashtra",
      "district": "Mumbai",
      "collegeType": "Engineering",
      "universityName": "University of Mumbai"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 789,
    "totalPages": 79
  }
}
```

---

### POST /api/universities

Create a new university record.

**Rate Limit:** Write (30/min)

**Request Body:**

```json
{
  "aisheCode": "U-9999",
  "name": "New University",
  "state": "Karnataka",
  "district": "Bangalore",
  "website": "https://example.edu",
  "yearOfEstablishment": 2024,
  "location": "Bangalore, Karnataka"
}
```

**Required Fields:** aisheCode, name, state, district

**Optional Fields:** website, yearOfEstablishment, location

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxyz789ghi",
    "aisheCode": "U-9999",
    "name": "New University",
    ...
  }
}
```

**Error Response (409 - Duplicate):**

```json
{
  "success": false,
  "error": "University with this AISHE code already exists"
}
```

---

### POST /api/universities/bulk

Create multiple universities in a single request. Duplicates are automatically skipped.

**Rate Limit:** Bulk (5/min)

**Request Body:**

```json
{
  "universities": [
    {
      "aisheCode": "U-9998",
      "name": "University One",
      "state": "State",
      "district": "District"
    },
    {
      "aisheCode": "U-9999",
      "name": "University Two",
      "state": "State",
      "district": "District"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Successfully created 2 universities",
  "count": 2
}
```

---

### PUT /api/universities/:id

Update an existing university record. All fields are optional.

**Rate Limit:** Write (30/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal university ID |

**Request Body:** Any combination of university fields

```json
{
  "website": "https://newwebsite.edu",
  "location": "Updated Address"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /api/universities/:id

Delete a university record.

**Rate Limit:** Delete (20/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal university ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "University deleted successfully"
}
```

---

## College Endpoints

### GET /api/colleges

Retrieve a paginated list of colleges with extensive filtering options.

**Rate Limit:** Read (200/min)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 10 | Number of results per page |
| search | string | - | Search by name or AISHE code (case-insensitive) |
| state | string | - | Filter by exact state name (case-insensitive) |
| district | string | - | Filter by exact district name (case-insensitive) |
| collegeType | string | - | Filter by college type (e.g., "Engineering", "Arts") |
| management | string | - | Filter by management type (e.g., "Private", "Government") |
| universityId | string | - | Filter by parent university ID |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz456def",
      "aisheCode": "C-0001",
      "name": "Engineering College",
      "state": "Maharashtra",
      "district": "Mumbai",
      "website": "https://college.edu",
      "yearOfEstablishment": 1990,
      "location": "Mumbai, Maharashtra",
      "collegeType": "Engineering",
      "management": "Private Unaided",
      "universityAisheCode": "U-0001",
      "universityName": "University of Mumbai",
      "universityType": "State University",
      "universityId": "clxyz123abc",
      "createdAt": "2024-12-30T00:00:00.000Z",
      "updatedAt": "2024-12-30T00:00:00.000Z",
      "university": {
        "id": "clxyz123abc",
        "name": "University of Mumbai",
        "aisheCode": "U-0001"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 53081,
    "totalPages": 5309
  }
}
```

**Example Requests:**

```http
GET /api/colleges
GET /api/colleges?page=5&limit=50
GET /api/colleges?search=IIT
GET /api/colleges?state=Karnataka&collegeType=Engineering
GET /api/colleges?management=Government&state=Tamil%20Nadu
GET /api/colleges?universityId=clxyz123abc
```

---

### GET /api/colleges/names

Retrieve a lightweight list of college names. Optimized for dropdowns and autocomplete.

**Rate Limit:** Read (200/min)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search | string | - | Filter by name (case-insensitive, contains match) |
| universityName | string | - | Filter by university name (case-insensitive, contains match) |
| limit | number | 10 | Maximum number of results |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz456def",
      "aisheCode": "C-0001",
      "name": "Engineering College",
      "state": "Maharashtra",
      "district": "Mumbai"
    }
  ],
  "count": 50
}
```

---

### GET /api/colleges/states

Retrieve a list of unique states that have colleges.

**Rate Limit:** Search (50/min)

**Response:**

```json
{
  "success": true,
  "data": [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    ...
  ]
}
```

---

### GET /api/colleges/types

Retrieve a list of unique college types.

**Rate Limit:** Search (50/min)

**Response:**

```json
{
  "success": true,
  "data": [
    "Arts",
    "Commerce",
    "Education",
    "Engineering",
    "Law",
    "Medical",
    "Science",
    ...
  ]
}
```

---

### GET /api/colleges/management-types

Retrieve a list of unique management types.

**Rate Limit:** Search (50/min)

**Response:**

```json
{
  "success": true,
  "data": [
    "Government",
    "Government Aided",
    "Private Unaided",
    "Private Self-Financing",
    ...
  ]
}
```

---

### GET /api/colleges/:id

Retrieve complete details of a college by its internal ID.

**Rate Limit:** Read (200/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal college ID (CUID format) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxyz456def",
    "aisheCode": "C-0001",
    "name": "Engineering College",
    "state": "Maharashtra",
    "district": "Mumbai",
    "website": "https://college.edu",
    "yearOfEstablishment": 1990,
    "location": "Mumbai, Maharashtra",
    "collegeType": "Engineering",
    "management": "Private Unaided",
    "universityAisheCode": "U-0001",
    "universityName": "University of Mumbai",
    "universityType": "State University",
    "universityId": "clxyz123abc",
    "createdAt": "2024-12-30T00:00:00.000Z",
    "updatedAt": "2024-12-30T00:00:00.000Z",
    "university": {
      "id": "clxyz123abc",
      "aisheCode": "U-0001",
      "name": "University of Mumbai",
      "state": "Maharashtra",
      "district": "Mumbai",
      "website": "https://mu.ac.in",
      "yearOfEstablishment": 1857,
      "location": "Mumbai"
    }
  }
}
```

---

### GET /api/colleges/aishe/:code

Retrieve complete details of a college by its AISHE code.

**Rate Limit:** Read (200/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | AISHE code (e.g., "C-0001") |

**Response:** Same as GET /api/colleges/:id

---

### POST /api/colleges

Create a new college record.

**Rate Limit:** Write (30/min)

**Request Body:**

```json
{
  "aisheCode": "C-9999",
  "name": "New College",
  "state": "Karnataka",
  "district": "Bangalore",
  "website": "https://newcollege.edu",
  "yearOfEstablishment": 2024,
  "location": "Bangalore, Karnataka",
  "collegeType": "Engineering",
  "management": "Private Unaided",
  "universityAisheCode": "U-0001",
  "universityName": "Parent University",
  "universityType": "State University",
  "universityId": "clxyz123abc"
}
```

**Required Fields:** aisheCode, name, state, district

**Optional Fields:** website, yearOfEstablishment, location, collegeType, management, universityAisheCode, universityName, universityType, universityId

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxyz999jkl",
    "aisheCode": "C-9999",
    ...
  }
}
```

---

### POST /api/colleges/bulk

Create multiple colleges in a single request. Duplicates are automatically skipped.

**Rate Limit:** Bulk (5/min)

**Request Body:**

```json
{
  "colleges": [
    {
      "aisheCode": "C-9998",
      "name": "College One",
      "state": "State",
      "district": "District",
      "collegeType": "Arts"
    },
    {
      "aisheCode": "C-9999",
      "name": "College Two",
      "state": "State",
      "district": "District",
      "collegeType": "Science"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Successfully created 2 colleges",
  "count": 2
}
```

---

### PUT /api/colleges/:id

Update an existing college record. All fields are optional.

**Rate Limit:** Write (30/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal college ID |

**Request Body:** Any combination of college fields

```json
{
  "website": "https://updated-website.edu",
  "management": "Government Aided"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /api/colleges/:id

Delete a college record.

**Rate Limit:** Delete (20/min)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Internal college ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "College deleted successfully"
}
```

---

## Data Schemas

### University Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Internal ID (CUID format) |
| aisheCode | string | Yes | Unique AISHE code (e.g., "U-0001") |
| name | string | Yes | University name |
| state | string | Yes | State name |
| district | string | Yes | District name |
| website | string | No | Website URL |
| yearOfEstablishment | number | No | Year founded |
| location | string | No | Full address/location |
| createdAt | datetime | Auto | Record creation timestamp |
| updatedAt | datetime | Auto | Last update timestamp |
| colleges | array | Auto | Affiliated colleges (when included) |
| _count.colleges | number | Auto | Count of affiliated colleges |

### College Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Internal ID (CUID format) |
| aisheCode | string | Yes | Unique AISHE code (e.g., "C-0001") |
| name | string | Yes | College name |
| state | string | Yes | State name |
| district | string | Yes | District name |
| website | string | No | Website URL |
| yearOfEstablishment | number | No | Year founded |
| location | string | No | Full address/location |
| collegeType | string | No | Type (Engineering, Arts, Medical, etc.) |
| management | string | No | Management type (Government, Private, etc.) |
| universityAisheCode | string | No | Affiliated university AISHE code |
| universityName | string | No | Affiliated university name |
| universityType | string | No | Affiliated university type |
| universityId | string | No | Internal ID of linked university |
| createdAt | datetime | Auto | Record creation timestamp |
| updatedAt | datetime | Auto | Last update timestamp |
| university | object | Auto | Linked university object (when included) |

---

## Query Parameters Reference

### Pagination Parameters

| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| page | number | 1 | 1 | - | Page number (1-indexed) |
| limit | number | 10 | 1 | 100 | Results per page |

### Common Filter Parameters

| Parameter | Type | Match Type | Description |
|-----------|------|------------|-------------|
| search | string | Contains (case-insensitive) | Search name and AISHE code |
| state | string | Exact (case-insensitive) | Filter by state |
| district | string | Exact (case-insensitive) | Filter by district |

### College-Specific Parameters

| Parameter | Type | Match Type | Description |
|-----------|------|------------|-------------|
| collegeType | string | Exact (case-insensitive) | Filter by college type |
| management | string | Exact (case-insensitive) | Filter by management type |
| universityId | string | Exact | Filter by linked university ID |
| universityName | string | Contains (case-insensitive) | Filter by university name |

---

## Examples

### Search for Engineering Colleges in Karnataka

```http
GET /api/colleges?state=Karnataka&collegeType=Engineering&limit=20
```

### Get All Colleges Under a Specific University

```http
GET /api/colleges?universityId=clxyz123abc&limit=100
```

### Search Universities by Name

```http
GET /api/universities?search=technology&limit=10
```

### Autocomplete for College Dropdown

```http
GET /api/colleges/names?search=IIT&limit=5
```

### Get Filter Options for Building a Search Form

```http
GET /api/colleges/states
GET /api/colleges/types
GET /api/colleges/management-types
```

### Create a New College with University Link

```http
POST /api/colleges
Content-Type: application/json

{
  "aisheCode": "C-NEW-001",
  "name": "Institute of Technology",
  "state": "Maharashtra",
  "district": "Pune",
  "collegeType": "Engineering",
  "management": "Private Unaided",
  "universityName": "Savitribai Phule Pune University",
  "yearOfEstablishment": 2024
}
```

### Bulk Import Colleges

```http
POST /api/colleges/bulk
Content-Type: application/json

{
  "colleges": [
    {
      "aisheCode": "C-BULK-001",
      "name": "College A",
      "state": "State",
      "district": "District"
    },
    {
      "aisheCode": "C-BULK-002",
      "name": "College B",
      "state": "State",
      "district": "District"
    }
  ]
}
```

---

## Database Statistics

- Total Universities: 1,386
- Total Colleges: 53,081
- Data Source: AISHE (All India Survey on Higher Education)
