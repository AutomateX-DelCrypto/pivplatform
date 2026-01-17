# PIVP API Documentation

Base URL: `http://localhost:3000` (development)

## Authentication

Most endpoints require authentication via Clerk. Include the session cookie or use the Clerk SDK for authenticated requests.

---

## Public API (v1)

### Verification

#### `POST /api/v1/verify`
Verify a provably fair game result.

**Authentication:** Optional (results saved to history if authenticated)

**Request Body:**
```json
{
  "serverSeedHash": "string (required) - Hash shown before bet",
  "serverSeed": "string (optional) - Revealed seed after bet",
  "clientSeed": "string (required) - Your client seed",
  "nonce": "number (required) - Bet number",
  "algorithm": "sha256 | sha512 (default: sha256)",
  "scheme": "generic | stake | bc-game (default: generic)",
  "operatorId": "uuid (optional)",
  "gameType": "string (optional) - e.g., dice, crash, slots",
  "betAmountCents": "number (optional)",
  "payoutCents": "number (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "serverSeedValid": true,
    "computedHash": "abc123...",
    "normalizedResult": 0.45678901,
    "gameOutcome": {
      "type": "dice",
      "value": 45.67,
      "description": "Roll: 45.67"
    },
    "verificationId": "uuid",
    "details": {
      "scheme": "generic",
      "algorithm": "sha256",
      "serverSeedProvided": true
    }
  }
}
```

#### `GET /api/v1/verify`
List user's verification history.

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...verifications],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "hasMore": true
  }
}
```

---

### RNG Analysis

#### `POST /api/v1/rng-analysis`
Analyze RNG patterns for fairness.

**Authentication:** Optional (results saved if authenticated)

**Request Body:**
```json
{
  "results": [0.123, 0.456, 0.789, ...],
  "analysisType": "comprehensive | quick | distribution | sequence",
  "operatorId": "uuid (optional)",
  "gameType": "string (optional)",
  "timestamps": [1234567890, ...] (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sampleSize": 100,
    "analysisType": "comprehensive",
    "overallScore": 85.5,
    "verdict": "Fair",
    "summary": "RNG appears to be functioning normally...",
    "tests": [
      {
        "testName": "Chi-Square Test",
        "statistic": 9.234,
        "pValue": 0.4567,
        "passed": true
      }
    ],
    "anomalies": [
      {
        "type": "clustering",
        "confidence": 0.65,
        "description": "Mild clustering detected..."
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### Evidence

#### `POST /api/v1/evidence`
Create a new evidence record.

**Authentication:** Required

**Request Body:** `multipart/form-data`
- `title` (required) - Evidence title
- `description` (optional) - Description text
- `files` (optional) - File uploads (images, PDFs, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Disputed payout",
    "description": "...",
    "status": "draft",
    "contentHash": "sha256...",
    "files": [
      {
        "url": "...",
        "filename": "screenshot.png",
        "mimeType": "image/png",
        "size": 12345,
        "hash": "sha256..."
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### `GET /api/v1/evidence`
List user's evidence records.

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20)

#### `POST /api/v1/evidence/{id}/anchor`
Anchor evidence to blockchain.

**Authentication:** Required

**Request Body:**
```json
{
  "chain": "algorand | ethereum | polygon | base | arbitrum"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "anchored",
    "chainType": "algorand",
    "txHash": "0x...",
    "blockNumber": 12345678,
    "anchoredAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### Operators

#### `GET /api/v1/operators`
List gambling operators.

**Authentication:** Not required

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `search` (optional) - Search by name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Stake",
      "slug": "stake",
      "website": "https://stake.com",
      "trustScore": 85,
      "pfScheme": "stake",
      "supportedChains": ["ethereum", "polygon"],
      "supportedGames": ["dice", "crash", "slots"],
      "totalVerifications": 1000,
      "successfulVerifications": 980
    }
  ]
}
```

#### `POST /api/v1/operators`
Create a new operator.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (required)",
  "slug": "string (required) - URL-safe identifier",
  "website": "url (optional)",
  "pfScheme": "generic | stake | bc-game",
  "pfDocumentation": "url (optional)",
  "supportedChains": ["algorand", "ethereum", ...],
  "supportedGames": ["dice", "crash", ...]
}
```

---

## Internal API

These endpoints are for frontend use and require authentication.

### User Settings

#### `GET /api/internal/user`
Get current user's settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John",
    "dailyLimitCents": 10000,
    "weeklyLimitCents": 50000,
    "monthlyLimitCents": 200000,
    "cooldownEnabled": true,
    "alertsEnabled": true,
    "wallets": [
      {
        "id": "uuid",
        "chain": "ethereum",
        "address": "0x...",
        "isPrimary": true
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/internal/user`
Update user settings.

**Request Body:**
```json
{
  "displayName": "string (optional)",
  "dailyLimitCents": "number | null (optional)",
  "weeklyLimitCents": "number | null (optional)",
  "monthlyLimitCents": "number | null (optional)",
  "cooldownEnabled": "boolean (optional)",
  "alertsEnabled": "boolean (optional)"
}
```

---

### User Wallets

#### `GET /api/internal/user/wallets`
Get user's connected wallets.

#### `POST /api/internal/user/wallets`
Add a wallet.

**Request Body:**
```json
{
  "chain": "algorand | ethereum | polygon | bsc | arbitrum | base",
  "address": "string",
  "isPrimary": "boolean (default: false)"
}
```

#### `DELETE /api/internal/user/wallets`
Remove a wallet.

**Request Body:**
```json
{
  "walletId": "uuid"
}
```

---

### Analytics

#### `GET /api/internal/analytics`
Get user's analytics data.

**Query Parameters:**
- `period`: `day | week | month | year` (default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSessions": 25,
      "totalWageredCents": 150000,
      "netProfitLossCents": -5000,
      "totalVerifications": 100,
      "winRate": 48.5
    },
    "profitLossData": [
      { "date": "2024-01-01", "cumulative": 0 },
      { "date": "2024-01-02", "cumulative": -1000 }
    ],
    "gameTypeBreakdown": [
      { "gameType": "dice", "count": 50, "wageredCents": 50000 }
    ],
    "operatorBreakdown": [
      { "operatorId": "uuid", "operatorName": "Stake", "count": 30 }
    ]
  }
}
```

---

### Evidence (Internal)

#### `GET /api/internal/evidence`
Get user's evidence with stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 10,
      "anchored": 5,
      "pending": 5
    },
    "evidence": [...]
  }
}
```

---

### RNG Analysis (Internal)

#### `GET /api/internal/rng-analysis`
Get user's RNG analysis history with stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalAnalyses": 15,
      "anomaliesDetected": 2,
      "averageScore": 82.5
    },
    "analyses": [...]
  }
}
```

---

### Verify (Internal)

#### `GET /api/internal/verify`
Get user's verification history with stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalVerifications": 100,
      "verified": 95,
      "failed": 5,
      "successRate": 95
    },
    "verifications": [...]
  }
}
```

---

### Sessions

#### `GET /api/internal/sessions`
Get current session info.

#### `POST /api/internal/sessions`
Start a new gambling session.

#### `DELETE /api/internal/sessions`
End the current session.

---

### Alerts

#### `GET /api/internal/alerts`
Get responsible gambling alerts.

#### `POST /api/internal/alerts`
Acknowledge an alert.

**Request Body:**
```json
{
  "alertId": "string"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - Authentication required
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `CHAIN_UNAVAILABLE` (400) - Blockchain not configured
- `ALREADY_ANCHORED` (400) - Evidence already anchored
- `INTERNAL_ERROR` (500) - Server error

---

## Webhooks

#### `POST /api/webhooks/clerk`
Clerk webhook for user sync. Handles `user.created` and `user.updated` events.
