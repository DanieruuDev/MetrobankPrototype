# 🚀 Setup and Installation Guide

## Prerequisites

Before setting up the Metrobank Scholarship Management System, ensure you have the following installed:

### Required Software

- **Node.js** 18.0 or higher
- **PostgreSQL** 14.0 or higher
- **Redis** 6.0 or higher (optional but recommended)
- **Git** for version control
- **npm** or **yarn** package manager

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Network**: Internet connection for package downloads

## 📦 Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/metrobank-prototype.git
cd metrobank-prototype

# Verify the structure
ls -la
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure Environment Variables** (`.env` file):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metrobank_scholarship
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Backblaze B2 Configuration (Alternative to Google Cloud)
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_NAME=your_bucket_name
```

### 3. Database Setup

#### PostgreSQL Installation

**Windows:**

```bash
# Download and install PostgreSQL from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

**macOS:**

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE metrobank_scholarship;

# Create user (optional)
CREATE USER metrobank_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE metrobank_scholarship TO metrobank_user;

# Exit PostgreSQL
\q
```

#### Run Database Migrations

```bash
# Navigate to server directory
cd server

# Run migrations
npm run migrate

# Seed database with sample data (optional)
npm run seed
```

### 4. Redis Setup (Optional but Recommended)

**Windows:**

```bash
# Download Redis from https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey
choco install redis-64
```

**macOS:**

```bash
# Using Homebrew
brew install redis
brew services start redis
```

**Ubuntu/Debian:**

```bash
# Install Redis
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 5. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure Frontend Environment Variables** (`.env` file):

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Metrobank Scholarship System
VITE_APP_VERSION=1.0.0

# Socket.io Configuration
VITE_SOCKET_URL=http://localhost:5000
```

### 6. Google Cloud Setup (For Document Processing)

#### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Document AI API
   - Cloud Storage API
   - Cloud Functions API

#### Create Service Account

1. Navigate to IAM & Admin → Service Accounts
2. Create a new service account
3. Grant the following roles:
   - Document AI API User
   - Storage Object Admin
   - Cloud Functions Developer
4. Download the JSON key file
5. Place it in the `server/config/` directory

#### Configure Document AI

```bash
# Set the path to your service account key
export GOOGLE_APPLICATION_CREDENTIALS="server/config/service-account.json"
```

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend Server

```bash
cd server
npm run dev
```

#### Terminal 2 - Frontend Development Server

```bash
cd client
npm run dev
```

#### Terminal 3 - Redis (Optional)

```bash
redis-server
```

### Production Mode

#### Build Frontend

```bash
cd client
npm run build
```

#### Start Production Server

```bash
cd server
npm start
```

## 🔧 Configuration

### Database Configuration

#### Connection Pool Settings

```javascript
// server/database/dbConnect.js
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Database Indexes

```sql
-- Create performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_renewals_student_id ON renewals(student_id);
CREATE INDEX idx_renewals_status ON renewals(scholarship_status);
```

### Redis Configuration

#### Redis Settings

```javascript
// server/config/redis.js
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
```

### CORS Configuration

```javascript
// server/index.js
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

## 🧪 Testing the Setup

### 1. Backend Health Check

```bash
# Test backend API
curl http://localhost:5000/api/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Database Connection Test

```bash
# Test database connection
cd server
npm run test:db

# Expected output
✅ Database connection successful
✅ Tables created successfully
✅ Indexes created successfully
```

### 3. Frontend Build Test

```bash
# Test frontend build
cd client
npm run build

# Expected output
✅ Build completed successfully
✅ All assets generated
```

### 4. End-to-End Test

```bash
# Run full test suite
npm run test:all

# Expected output
✅ Backend tests passed
✅ Frontend tests passed
✅ Integration tests passed
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l

# Test connection
psql -U postgres -d metrobank_scholarship -c "SELECT 1;"
```

#### 2. Port Already in Use

```bash
# Check what's using the port
lsof -i :5000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

#### 3. Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# Expected response: PONG
```

#### 4. Google Cloud Authentication Failed

```bash
# Check service account key
gcloud auth activate-service-account --key-file=server/config/service-account.json

# Test authentication
gcloud auth list
```

#### 5. Frontend Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run lint
```

### Performance Issues

#### 1. Slow Database Queries

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 2. High Memory Usage

```bash
# Check Node.js memory usage
node --max-old-space-size=4096 server/index.js
```

#### 3. Redis Memory Issues

```bash
# Check Redis memory usage
redis-cli info memory
```

## 📊 Monitoring Setup

### Application Monitoring

#### 1. Health Check Endpoint

```javascript
// server/routes/health.js
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: "connected",
    redis: "connected",
  });
});
```

#### 2. Logging Configuration

```javascript
// server/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
```

### Database Monitoring

#### 1. Connection Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SHOW max_connections;
```

#### 2. Performance Monitoring

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC;
```

## 🔒 Security Configuration

### 1. Environment Security

```bash
# Secure environment files
chmod 600 .env
chmod 600 server/.env
```

### 2. Database Security

```sql
-- Create restricted user
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

### 3. CORS Security

```javascript
// Restrict CORS to specific origins
app.use(
  cors({
    origin: ["http://localhost:5173", "https://yourdomain.com"],
    credentials: true,
  })
);
```

## 📈 Production Deployment

### 1. Environment Variables

```env
# Production environment
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
```

### 2. Database Production Setup

```sql
-- Create production database
CREATE DATABASE metrobank_scholarship_prod;

-- Create production user
CREATE USER prod_user WITH PASSWORD 'secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE metrobank_scholarship_prod TO prod_user;
```

### 3. SSL Configuration

```javascript
// HTTPS configuration
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("path/to/private-key.pem"),
  cert: fs.readFileSync("path/to/certificate.pem"),
};

https.createServer(options, app).listen(443);
```

## 📚 Additional Resources

### Documentation Links

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://reactjs.org/docs/)

### Community Support

- [GitHub Issues](https://github.com/your-username/metrobank-prototype/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/metrobank-scholarship)

---

**Setup Guide Version**: v1.0.0  
**Last Updated**: January 2024  
**Compatible With**: Node.js 18+, PostgreSQL 14+, Redis 6+
