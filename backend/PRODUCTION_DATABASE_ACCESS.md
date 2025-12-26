# iFi Production Database Access Guide

## Overview
This guide covers how to access your PostgreSQL database when iFi is deployed to production.

## Connection Methods

### 1. Direct psql Connection (Remote)

#### Basic Connection
```bash
psql -h <hostname> -p <port> -U <username> -d <database>
```

#### Example for Production
```bash
# Using environment variables
psql -h your-database-host.com -p 5432 -U ifi_user -d ifi_db

# With password prompt
PGPASSWORD='your_production_password' psql -h your-database-host.com -p 5432 -U ifi_user -d ifi_db
```

### 2. SSH Tunnel (Most Secure for Production)

#### Step 1: Create SSH Tunnel
```bash
# Forward local port 5433 to remote database port 5432
ssh -L 5433:localhost:5432 user@your-server.com
```

#### Step 2: Connect via Tunnel
```bash
# Connect to localhost:5433 which tunnels to remote database
psql -h localhost -p 5433 -U ifi_user -d ifi_db
```

### 3. Using Connection String
```bash
# Format: postgresql://username:password@host:port/database
psql "postgresql://ifi_user:password@your-host.com:5432/ifi_db?sslmode=require"
```

## Production Database Providers

### For Heroku
```bash
# Heroku provides DATABASE_URL automatically
heroku pg:psql --app your-app-name

# Or manually
heroku config:get DATABASE_URL --app your-app-name
psql "<paste_database_url_here>"
```

### For AWS RDS
```bash
# Connect to RDS instance
psql -h your-db-instance.region.rds.amazonaws.com \
     -p 5432 \
     -U ifi_user \
     -d ifi_db
```

### For DigitalOcean Managed Database
```bash
# Get connection details from DigitalOcean dashboard
psql "postgresql://username:password@db-host.db.ondigitalocean.com:25060/ifi_db?sslmode=require"
```

### For Railway
```bash
# Railway provides connection string in dashboard
psql "postgresql://postgres:password@containers-host.railway.app:5432/railway"
```

### For Render
```bash
# Get connection string from Render dashboard
psql "postgresql://ifi_user:password@dpg-xxxxx.render.com/ifi_db"
```

## Security Best Practices

### 1. Never Hardcode Credentials
```bash
# ❌ Bad - hardcoded
psql -h host.com -U user -d db

# ✅ Good - use environment variables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### 2. Use SSL/TLS Connections
```bash
# Require SSL connection
psql "postgresql://user:pass@host:5432/db?sslmode=require"

# Verify full SSL
psql "postgresql://user:pass@host:5432/db?sslmode=verify-full"
```

### 3. Restrict IP Access
- Configure your database firewall to only allow:
  - Your production server IPs
  - Your office/home IP for admin access
  - VPN connections only

### 4. Use Read-Only Connections for Analytics
```sql
-- Create read-only user for analytics
CREATE USER ifi_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ifi_db TO ifi_readonly;
GRANT USAGE ON SCHEMA public TO ifi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ifi_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ifi_readonly;
```

## Production .env Configuration

### Server .env (Production)
```env
# Production Database Configuration
DB_HOST=your-production-db-host.com
DB_PORT=5432
DB_NAME=ifi_db
DB_USER=ifi_user
DB_PASSWORD=<strong_production_password>
DB_SSL=true

# Or use connection string
DATABASE_URL=postgresql://ifi_user:password@host:5432/ifi_db?sslmode=require

# Production Settings
NODE_ENV=production
```

## Common Production Commands

### View Active Connections
```sql
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE datname = 'ifi_db';
```

### Monitor Database Size
```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'ifi_db';
```

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### View Recent Queries (Performance)
```sql
SELECT 
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## Database Backup & Restore

### Backup Production Database
```bash
# Full database dump
pg_dump -h production-host.com -U ifi_user -d ifi_db -F c -f ifi_db_backup_$(date +%Y%m%d).dump

# Backup specific tables
pg_dump -h production-host.com -U ifi_user -d ifi_db -t users -t transactions -F c -f partial_backup.dump

# Backup with compression
pg_dump -h production-host.com -U ifi_user -d ifi_db -F c -Z 9 -f ifi_db_compressed.dump
```

### Restore from Backup
```bash
# Restore full database
pg_restore -h production-host.com -U ifi_user -d ifi_db -c ifi_db_backup.dump

# Restore specific tables only
pg_restore -h production-host.com -U ifi_user -d ifi_db -t users ifi_db_backup.dump
```

### Automated Backup Script
```bash
#!/bin/bash
# backup-production-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/ifi"
DB_HOST="production-host.com"
DB_NAME="ifi_db"
DB_USER="ifi_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -U $DB_USER \
    -d $DB_NAME \
    -F c \
    -f $BACKUP_DIR/ifi_db_$DATE.dump

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ifi_db_*.dump" -mtime +7 -delete

echo "Backup completed: ifi_db_$DATE.dump"
```

## Remote Query Execution

### Execute Single Query
```bash
# Quick query
psql -h production-host.com -U ifi_user -d ifi_db -c "SELECT COUNT(*) FROM users;"

# Query with output to file
psql -h production-host.com -U ifi_user -d ifi_db -c "SELECT * FROM vw_business_dashboard;" -o report.txt
```

### Execute SQL File
```bash
# Run migration or query file
psql -h production-host.com -U ifi_user -d ifi_db -f migration.sql

# Run with transaction wrapper
psql -h production-host.com -U ifi_user -d ifi_db -1 -f migration.sql
```

### Format Output as CSV
```bash
# Export data as CSV
psql -h production-host.com -U ifi_user -d ifi_db -c "COPY (SELECT * FROM users) TO STDOUT CSV HEADER" > users.csv
```

## Monitoring & Alerts

### Check Database Health
```sql
-- Check for long-running queries
SELECT 
    pid,
    now() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 minutes';

-- Check for locks
SELECT 
    locktype,
    relation::regclass,
    mode,
    granted
FROM pg_locks
WHERE NOT granted;

-- Check connection count
SELECT 
    COUNT(*) as connections,
    state
FROM pg_stat_activity
GROUP BY state;
```

## Production Database Configuration

### Recommended Settings (postgresql.conf)
```conf
# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

# Connection Settings
max_connections = 100
statement_timeout = 30000  # 30 seconds

# Logging
log_min_duration_statement = 1000  # Log queries > 1 second
log_connections = on
log_disconnections = on

# Performance
random_page_cost = 1.1  # For SSD storage
effective_io_concurrency = 200
```

## Troubleshooting

### Connection Issues
```bash
# Test connection
pg_isready -h production-host.com -p 5432 -U ifi_user

# Verbose connection test
psql -h production-host.com -U ifi_user -d ifi_db --echo-all
```

### SSL Certificate Issues
```bash
# Download SSL certificate
wget https://your-provider.com/ca-certificate.crt

# Connect with SSL certificate
psql "postgresql://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=ca-certificate.crt"
```

## Environment-Specific Connection Scripts

### Development
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ifi_db
export DB_USER=ifi_user
export DB_PASSWORD=iFi_Secure_Pass_2024!
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

### Staging
```bash
export DB_HOST=staging-db.your-company.com
export DB_PORT=5432
export DB_NAME=ifi_db_staging
export DB_USER=ifi_user
export DB_PASSWORD=$STAGING_DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

### Production
```bash
export DB_HOST=production-db.your-company.com
export DB_PORT=5432
export DB_NAME=ifi_db
export DB_USER=ifi_user
export DB_PASSWORD=$PRODUCTION_DB_PASSWORD
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
```

## Quick Reference

### Connection String Format
```
postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
```

### Common Parameters
- `sslmode=require` - Require SSL connection
- `connect_timeout=10` - Connection timeout in seconds
- `application_name=iFi` - Identify your app in logs
- `options=-c search_path=public` - Set schema search path

### psql Meta-Commands (Same in Production)
```
\l          - List databases
\dt         - List tables
\dv         - List views
\du         - List users
\d+ table   - Describe table
\x          - Toggle expanded display
\timing     - Show query execution time
\q          - Quit
```

## Security Checklist

- [ ] Use strong passwords (20+ characters)
- [ ] Enable SSL/TLS connections
- [ ] Restrict IP access via firewall
- [ ] Use separate credentials for different environments
- [ ] Enable database audit logging
- [ ] Regular automated backups
- [ ] Test restore process monthly
- [ ] Use read-only users for reporting
- [ ] Rotate passwords quarterly
- [ ] Monitor for suspicious activity
- [ ] Keep PostgreSQL updated
- [ ] Use connection pooling (PgBouncer)

## Additional Tools

### GUI Clients (Easier than psql)
1. **pgAdmin 4** - Free, full-featured
2. **DBeaver** - Free, multi-database
3. **TablePlus** - Paid, modern UI
4. **DataGrip** - Paid, JetBrains
5. **Postico** (Mac) - Paid, simple

### Connection Example in GUI
```
Host: production-host.com
Port: 5432
Database: ifi_db
User: ifi_user
Password: <your_password>
SSL Mode: require
```

## Conclusion

For production access:
1. **Always use SSL connections**
2. **Never expose database directly to internet**
3. **Use SSH tunnels for admin access**
4. **Set up automated backups**
5. **Monitor database performance**
6. **Use connection pooling (PgBouncer)**
7. **Keep credentials in environment variables**

The connection process is the same as local, just pointing to a different host!
