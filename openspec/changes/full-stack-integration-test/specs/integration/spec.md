# Full Stack Integration Specification

## ADDED Requirements

### Requirement: Backend API Authentication

The system MUST implement JWT-based authentication API endpoints.

#### Scenario: User login success

**Given** a registered user with phone "13800138000" and password "password123"  
**When** POST /api/auth/login with correct credentials  
**Then** response code MUST be 200  
**And** response MUST contain a valid JWT token  
**And** response MUST contain user information

#### Scenario: User login failure

**Given** a user with phone "13800138000"  
**When** POST /api/auth/login with incorrect password  
**Then** response code MUST be 400  
**And** response message MUST be "Password incorrect"

---

### Requirement: Backend Test API

The system MUST provide test API endpoints for connectivity testing.

#### Scenario: Ping test

**Given** backend service is running  
**When** GET /api/test/ping  
**Then** response code MUST be 200  
**And** response MUST contain server information  
**And** response MUST contain timestamp

---

### Requirement: Frontend Request Utility

All frontend applications MUST implement unified request utility.

#### Scenario: Automatic token attachment

**Given** user is logged in with valid token  
**When** making any API request  
**Then** request header MUST include "Authorization: Bearer {token}"

#### Scenario: 401 error handling

**Given** token is expired  
**When** API returns 401 status  
**Then** frontend MUST clear local token  
**And** frontend MUST redirect to login page  
**And** frontend MUST show error message

---

### Requirement: User State Management

All frontend applications MUST use Pinia for user state management.

#### Scenario: Login action

**Given** user provides valid credentials  
**When** userStore.login() is called  
**Then** it MUST call login API  
**And** it MUST save token to local storage  
**And** it MUST save user info to state

---

### Requirement: API Test Page

C-side miniprogram and mobile admin MUST provide API test page.

#### Scenario: Ping test button

**Given** user is on test page  
**When** user clicks "Ping Test" button  
**Then** it MUST call /api/test/ping  
**And** it MUST display response result  
**And** it MUST display response time

---

### Requirement: CORS Configuration

The backend MUST configure CORS to allow frontend cross-origin requests.

#### Scenario: Development environment CORS

**Given** request is from http://localhost:3001  
**When** any API request is made  
**Then** response MUST include CORS headers  
**And** Access-Control-Allow-Origin MUST be http://localhost:3001  
**And** Access-Control-Allow-Methods MUST include GET, POST, PUT, DELETE

---

### Requirement: Unified Response Format

All API responses MUST follow unified JSON format.

#### Scenario: Success response

**Given** API request succeeds  
**When** response is returned  
**Then** response MUST have structure:
```json
{
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": "ISO 8601 format"
}
```

#### Scenario: Error response

**Given** API request fails  
**When** error response is returned  
**Then** response MUST have structure:
```json
{
  "code": <error_code>,
  "message": "<error_message>",
  "data": null,
  "timestamp": "ISO 8601 format"
}
```

---

### Requirement: Token Persistence

All frontend applications MUST correctly persist authentication tokens.

#### Scenario: Miniprogram token storage

**Given** user logs in successfully  
**When** token is saved  
**Then** it MUST use Taro.setStorageSync('token', token)  
**And** token MUST be retrievable on next app launch

#### Scenario: PC admin token storage

**Given** user logs in successfully  
**When** token is saved  
**Then** it MUST use localStorage.setItem('token', token)  
**And** token MUST persist after page refresh

---

### Requirement: Error Message Display

All frontend applications MUST provide user-friendly error messages.

#### Scenario: Miniprogram error toast

**Given** API request fails  
**When** error occurs  
**Then** it MUST show Taro.showToast with error message  
**And** toast duration MUST be 2 seconds

#### Scenario: PC admin error message

**Given** API request fails  
**When** error occurs  
**Then** it MUST show ElMessage.error with error message  
**And** message MUST auto-dismiss

---

### Requirement: Environment Variable Configuration

All frontend applications MUST correctly configure environment variables.

#### Scenario: Development environment API URL

**Given** running in development mode  
**When** reading API base URL  
**Then** it MUST use http://localhost:3000

#### Scenario: Production environment API URL

**Given** running in production mode  
**When** reading API base URL  
**Then** it MUST use production domain

---

### Requirement: Database Connection

The backend MUST successfully connect to MySQL and Redis.

#### Scenario: MySQL connection

**Given** MySQL container is running on port 3307  
**When** backend starts  
**Then** it MUST connect to MySQL successfully  
**And** it MUST log connection success

#### Scenario: Redis connection

**Given** Redis container is running on port 6379  
**When** backend starts  
**Then** it MUST connect to Redis successfully

---

### Requirement: Integration Test Coverage

The system MUST pass all integration tests.

#### Scenario: End-to-end login flow

**Given** all services are running  
**When** user logs in from C-side miniprogram  
**Then** login request MUST reach backend  
**And** backend MUST validate credentials  
**And** backend MUST return token  
**And** miniprogram MUST save token  
**And** miniprogram MUST display user info

#### Scenario: Cross-platform data consistency

**Given** user logs in from PC admin  
**When** user fetches vehicle list  
**Then** data MUST match database records  
**And** same data MUST be returned to miniprogram  
**And** data format MUST be consistent across platforms

