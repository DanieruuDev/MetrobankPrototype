# 🏗️ System Architecture Documentation

## Overview

The Metrobank Scholarship Management System follows a modern, scalable architecture pattern with clear separation of concerns, real-time capabilities, and cloud integration.

## 🎯 Architecture Principles

- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **Scalability**: Horizontal scaling capabilities with stateless design
- **Real-time Communication**: WebSocket integration for live updates
- **Cloud-Native**: Integration with Google Cloud services
- **Security-First**: JWT authentication, role-based access control
- **Performance**: Caching, connection pooling, and optimized queries

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Metrobank Scholarship System                 │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Node.js)                │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐   │
│  │   User Interface    │   │  │      API Layer             │   │
│  │   - React Router    │   │  │      - Express.js          │   │
│  │   - Tailwind CSS    │   │  │      - RESTful APIs        │   │
│  │   - TypeScript      │   │  │      - Socket.io           │   │
│  └─────────────────────┘   │  └─────────────────────────────┘   │
│           │               │           │                               │
│           │               │           │                               │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐   │
│  │   State Management  │   │  │    Business Logic          │   │
│  │   - React Context   │   │  │    - Controllers            │   │
│  │   - Local Storage   │   │  │    - Services               │   │
│  │   - Real-time State │   │  │    - Middleware             │   │
│  └─────────────────────┘   │  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
│           │               │           │                               │
│           │               │           │                               │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐   │
│  │   External APIs    │   │  │    Data Layer               │   │
│  │   - Google Cloud   │   │  │    - PostgreSQL             │   │
│  │   - Document AI    │   │  │    - Redis Cache             │   │
│  │   - Cloud Storage  │   │  │    - File Storage            │   │
│  └─────────────────────┘   │  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend Layer

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router for client-side navigation
- **State Management**: React Context API for global state
- **Real-time**: Socket.io client for live updates
- **Notifications**: React Toastify for user feedback

### Backend Layer

- **Runtime**: Node.js with Express.js framework
- **Language**: JavaScript with ES6+ features
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.io for WebSocket connections
- **File Upload**: Multer for multipart form handling
- **Validation**: Custom middleware for request validation

### Data Layer

- **Primary Database**: PostgreSQL 14+ for relational data
- **Cache**: Redis for session storage and job queues
- **File Storage**: Google Cloud Storage / Backblaze B2
- **Document Processing**: Google Cloud Document AI

### Cloud Services

- **Document AI**: Automatic data extraction from PDFs
- **Cloud Storage**: Scalable file storage
- **Authentication**: JWT-based stateless authentication
- **Real-time**: WebSocket connections for live updates

## 📊 System Components

### 1. Frontend Components

#### User Interface Layer

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (buttons, modals)
│   ├── forms/          # Form components
│   └── renewal/        # Renewal-specific components
├── pages/              # Application pages
│   ├── Dashboard/      # Main dashboard
│   ├── Renewal/        # Renewal management
│   └── Workflow/       # Workflow management
├── context/            # React context providers
│   ├── AuthContext.tsx # Authentication state
│   └── RenewalContext.tsx # Renewal data state
└── utils/              # Utility functions
    ├── api.ts          # API client functions
    └── helpers.ts      # Helper functions
```

#### State Management Architecture

```typescript
// Authentication Context
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Renewal Context
interface RenewalContextType {
  renewals: Renewal[];
  loading: boolean;
  error: string | null;
  updateRenewal: (id: number, data: Partial<Renewal>) => void;
  fetchRenewals: () => Promise<void>;
}
```

### 2. Backend Components

#### API Layer Structure

```
server/
├── routes/             # API route definitions
│   ├── auth-router.js      # Authentication routes
│   ├── renewal-router.js   # Renewal management routes
│   ├── workflow-router.js  # Workflow routes
│   └── document-router.js  # Document processing routes
├── controllers/        # Request handlers
│   ├── authController.js   # Authentication logic
│   ├── renewalController.js # Renewal operations
│   └── workflowController.js # Workflow management
├── services/           # Business logic
│   ├── renewalService.js   # Renewal business logic
│   ├── documentService.js  # Document processing
│   └── notificationService.js # Notification logic
├── middlewares/        # Custom middleware
│   ├── auth.js         # Authentication middleware
│   ├── validation.js   # Request validation
│   └── logging.js      # Request logging
└── database/           # Database configuration
    ├── dbConnect.js    # Database connection
    └── schema.sql      # Database schema
```

#### Request Flow Architecture

```
Client Request → Express Router → Middleware → Controller → Service → Database
     ↓              ↓              ↓           ↓          ↓         ↓
  Validation    Authentication   Business    Database   Response
  & Parsing     & Authorization  Logic       Query      Formatting
```

### 3. Database Architecture

#### PostgreSQL Schema Design

```sql
-- Core Tables
users (user_id, email, role_id, campus)
roles (role_id, role_name, permissions)
renewals (renewal_id, student_id, status, gpa, validations)
documents (document_id, file_path, status, renewal_id)
workflows (workflow_id, requester_id, status, due_date)
notifications (notification_id, user_id, message, type)

-- Relationships
users (1) → (many) renewals
users (1) → (many) workflows
renewals (1) → (many) documents
workflows (1) → (many) workflow_approvers
```

#### Redis Usage

```javascript
// Session Storage
redis.set(`session:${userId}`, JSON.stringify(userData), "EX", 3600);

// Job Queues
redis.lpush("document_processing", JSON.stringify(jobData));

// Real-time Data
redis.publish("renewal_updates", JSON.stringify(updateData));
```

## 🔄 Data Flow Architecture

### 1. User Authentication Flow

```
User Login → Frontend Validation → API Request → JWT Generation → Token Storage → Protected Routes
```

### 2. Renewal Management Flow

```
Upload Document → File Validation → Cloud Storage → Document AI → Data Extraction → Database Update → Real-time Notification
```

### 3. Approval Workflow

```
Create Workflow → Assign Approvers → Send Notifications → Approval Process → Status Update → Notification Broadcast
```

### 4. Real-time Updates Flow

```
Database Change → Service Layer → Socket.io Emit → Client Receives → UI Update → User Notification
```

## 🌐 Network Architecture

### Development Environment

```
Frontend (localhost:5173) ←→ Backend (localhost:5000) ←→ Database (localhost:5432)
                                    ↓
                              Redis (localhost:6379)
                                    ↓
                              Google Cloud Services
```

### Production Environment

```
CDN/CloudFront → Load Balancer → Application Servers → Database Cluster
                                      ↓
                              Redis Cluster
                                      ↓
                              Google Cloud Services
```

## 🔒 Security Architecture

### Authentication & Authorization

```
JWT Token → Middleware Validation → Role Check → Permission Verification → Request Processing
```

### Data Security

- **Encryption**: bcrypt for passwords, JWT for tokens
- **HTTPS**: SSL/TLS for all communications
- **CORS**: Restricted cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries

### Access Control Matrix

```
Role          │ Renewals │ Workflows │ Documents │ Users
──────────────┼──────────┼───────────┼───────────┼───────
Super Admin   │    CRUD  │    CRUD   │    CRUD   │  CRUD
Registrar     │    CRUD  │    CRUD   │    CRUD   │   R
Dept Officer  │     RU   │     RU    │     RU    │   R
HR Manager    │     RU   │     RU    │     RU    │   R
Finance       │     R    │     R     │     R     │   R
```

## 📈 Scalability Architecture

### Horizontal Scaling

```
Load Balancer → Multiple App Instances → Shared Database → Redis Cluster
```

### Database Scaling

- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: Efficient connection management
- **Indexing Strategy**: Optimized query performance
- **Caching**: Redis for frequently accessed data

### Performance Optimization

- **CDN**: Static asset delivery
- **Compression**: Gzip compression for responses
- **Caching**: Redis for session and data caching
- **Database Indexes**: Optimized query performance

## 🔄 Deployment Architecture

### Development

```
Git Repository → Local Development → Local Database → Local Testing
```

### Staging

```
Git Repository → CI/CD Pipeline → Staging Environment → Staging Database
```

### Production

```
Git Repository → CI/CD Pipeline → Production Environment → Production Database
                                      ↓
                              Monitoring & Logging
```

## 📊 Monitoring Architecture

### Application Monitoring

```
Application → Logging Service → Monitoring Dashboard → Alert System
```

### Database Monitoring

```
Database → Performance Metrics → Monitoring Service → Alert System
```

### Infrastructure Monitoring

```
Servers → System Metrics → Monitoring Service → Alert System
```

## 🚀 Deployment Strategy

### Containerization (Optional)

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### CI/CD Pipeline

```
Code Push → GitHub Actions → Build → Test → Deploy → Monitor
```

## 🔧 Configuration Management

### Environment Configuration

```javascript
// Development
NODE_ENV = development;
DB_HOST = localhost;
REDIS_HOST = localhost;

// Production
NODE_ENV = production;
DB_HOST = production - db - host;
REDIS_HOST = production - redis - host;
```

### Feature Flags

```javascript
// Feature toggles
const features = {
  documentAI: process.env.ENABLE_DOCUMENT_AI === "true",
  realTimeUpdates: process.env.ENABLE_REALTIME === "true",
  advancedAnalytics: process.env.ENABLE_ANALYTICS === "true",
};
```

## 📚 API Architecture

### RESTful API Design

```
GET    /api/renewals          # List renewals
POST   /api/renewals          # Create renewal
GET    /api/renewals/:id      # Get specific renewal
PUT    /api/renewals/:id      # Update renewal
DELETE /api/renewals/:id      # Delete renewal
```

### WebSocket Events

```javascript
// Real-time events
socket.emit("renewal_updated", data);
socket.emit("workflow_approved", data);
socket.emit("notification_new", data);
```

## 🎯 Performance Targets

### Response Times

- **API Endpoints**: < 200ms average
- **Database Queries**: < 100ms average
- **File Uploads**: < 5 seconds for 10MB files
- **Real-time Updates**: < 50ms latency

### Throughput

- **Concurrent Users**: 1000+ users
- **API Requests**: 10,000+ requests/minute
- **Database Connections**: 100+ concurrent connections
- **File Processing**: 100+ documents/hour

## 🔄 Backup & Recovery

### Backup Strategy

- **Database**: Daily automated backups
- **Files**: Cloud storage with versioning
- **Configuration**: Git repository with tags
- **Recovery**: Point-in-time recovery capability

### Disaster Recovery

- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 1 hour (Recovery Point Objective)
- **Backup Retention**: 30 days for daily, 1 year for weekly

---

**Architecture Version**: v1.0.0  
**Last Updated**: January 2024  
**Compatible With**: Node.js 18+, React 18+, PostgreSQL 14+
