# iFi Complete Database Setup Script
# This script sets up the complete PostgreSQL database for iFi

Write-Host "`n🚀 iFi Complete Database Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "❌ PostgreSQL service not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL is not running. Starting service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}

Write-Host "✓ PostgreSQL is running`n" -ForegroundColor Green

# Set variables
$backendDir = Split-Path -Parent $PSScriptRoot
$scriptsDir = Join-Path $backendDir "scripts"
$envFile = Join-Path $backendDir ".env"

# Step 1: Create .env file
Write-Host "📝 Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ifi_db
DB_USER=ifi_user
DB_PASSWORD=iFi_Secure_Pass_2024!

# JWT Configuration
JWT_SECRET=$(New-Guid)
JWT_REFRESH_SECRET=$(New-Guid)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500"

# Plaid Configuration (Add your credentials)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# OpenAI Configuration (Add your API key)
OPENAI_API_KEY=your_openai_api_key

# Encryption
ENCRYPTION_KEY=$(New-Guid)

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# App Configuration
APP_NAME=iFi
APP_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "✓ .env file created`n" -ForegroundColor Green

# Step 2: Create database and user using psql
Write-Host "🗄️  Setting up database and user..." -ForegroundColor Yellow

# Try to find psql.exe
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if ($null -eq $psqlPath) {
    Write-Host "⚠️  psql.exe not found in standard locations." -ForegroundColor Yellow
    Write-Host "Please run the following command manually as postgres user:" -ForegroundColor Yellow
    Write-Host "psql -U postgres -f scripts\setup-complete-database.sql`n" -ForegroundColor Cyan
    
    # Continue with Node.js setup
    $skipPSQL = $true
} else {
    Write-Host "Found psql at: $psqlPath" -ForegroundColor Gray
    
    # Prompt for postgres password
    Write-Host "`nPlease enter the PostgreSQL 'postgres' user password:" -ForegroundColor Cyan
    $pgPassword = Read-Host -AsSecureString
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))
    
    # Run SQL setup script
    $setupSqlPath = Join-Path $scriptsDir "setup-complete-database.sql"
    
    try {
        & $psqlPath -U postgres -f $setupSqlPath
        Write-Host "✓ Database and user created successfully`n" -ForegroundColor Green
        $skipPSQL = $false
    } catch {
        Write-Host "❌ Error creating database. You may need to run this manually:" -ForegroundColor Red
        Write-Host "psql -U postgres -f scripts\setup-complete-database.sql`n" -ForegroundColor Yellow
        $skipPSQL = $true
    }
    
    # Clear password from environment
    $env:PGPASSWORD = $null
}

# Step 3: Initialize base tables
if (-not $skipPSQL) {
    Write-Host "📋 Creating base database tables..." -ForegroundColor Yellow
    
    try {
        Push-Location $backendDir
        node scripts/init-database.js
        Write-Host "✓ Base tables created successfully`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Error creating base tables: $_" -ForegroundColor Yellow
        Write-Host "You may need to run: node scripts/init-database.js`n" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    
    # Step 4: Initialize enhanced analytics tables
    Write-Host "📊 Creating enhanced analytics tables..." -ForegroundColor Yellow
    
    try {
        Push-Location $backendDir
        node scripts/init-database-enhanced.js
        Write-Host "✓ Enhanced analytics tables created successfully`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Error creating enhanced tables: $_" -ForegroundColor Yellow
        Write-Host "You may need to run: node scripts/init-database-enhanced.js`n" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    
    # Step 5: Create analytics views
    Write-Host "📈 Creating analytics views..." -ForegroundColor Yellow
    
    $viewsSqlPath = Join-Path $scriptsDir "create-analytics-views.sql"
    
    if ($null -ne $psqlPath) {
        try {
            $env:PGPASSWORD = "iFi_Secure_Pass_2024!"
            & $psqlPath -U ifi_user -d ifi_db -f $viewsSqlPath
            Write-Host "✓ Analytics views created successfully`n" -ForegroundColor Green
            $env:PGPASSWORD = $null
        } catch {
            Write-Host "⚠️  Error creating views: $_" -ForegroundColor Yellow
            Write-Host "You may need to run: psql -U ifi_user -d ifi_db -f scripts/create-analytics-views.sql`n" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n✅ Database Setup Complete!" -ForegroundColor Green
Write-Host "========================`n" -ForegroundColor Green

Write-Host "Database Information:" -ForegroundColor Cyan
Write-Host "  Database: ifi_db" -ForegroundColor White
Write-Host "  User: ifi_user" -ForegroundColor White
Write-Host "  Password: iFi_Secure_Pass_2024!" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432`n" -ForegroundColor White

Write-Host "Tables Created:" -ForegroundColor Cyan
Write-Host "  Core Tables (14):" -ForegroundColor White
Write-Host "    ✓ users, session_tokens, password_reset_tokens" -ForegroundColor Gray
Write-Host "    ✓ email_verification_tokens, audit_log" -ForegroundColor Gray
Write-Host "    ✓ ai_conversations, plaid_items, accounts, transactions" -ForegroundColor Gray
Write-Host "    ✓ user_onboarding, user_sessions, feature_usage" -ForegroundColor Gray
Write-Host "    ✓ subscription_history, user_analytics`n" -ForegroundColor Gray

Write-Host "  Enhanced Analytics Tables (15):" -ForegroundColor White
Write-Host "    ✓ user_time_tracking - Detailed time per feature" -ForegroundColor Gray
Write-Host "    ✓ user_activity_heatmap - Activity patterns" -ForegroundColor Gray
Write-Host "    ✓ subscription_conversion_tracking - Conversion analytics" -ForegroundColor Gray
Write-Host "    ✓ onboarding_analytics - Funnel tracking" -ForegroundColor Gray
Write-Host "    ✓ feature_adoption_tracking - Feature adoption" -ForegroundColor Gray
Write-Host "    ✓ user_retention_metrics - Retention analysis" -ForegroundColor Gray
Write-Host "    ✓ user_engagement_scores - Engagement scoring" -ForegroundColor Gray
Write-Host "    ✓ revenue_analytics - Revenue & LTV" -ForegroundColor Gray
Write-Host "    ✓ daily_active_users - DAU/MAU metrics" -ForegroundColor Gray
Write-Host "    ✓ referral_tracking - Referral program" -ForegroundColor Gray
Write-Host "    ✓ support_tickets - Customer support" -ForegroundColor Gray
Write-Host "    ✓ user_feedback - Feedback collection" -ForegroundColor Gray
Write-Host "    ✓ ab_test_tracking - A/B testing" -ForegroundColor Gray
Write-Host "    ✓ error_logs - Error tracking" -ForegroundColor Gray
Write-Host "    ✓ business_metrics_snapshot - Daily metrics`n" -ForegroundColor Gray

Write-Host "  Analytics Views (17):" -ForegroundColor White
Write-Host "    ✓ User overview, subscription comparison, DAU/MAU" -ForegroundColor Gray
Write-Host "    ✓ Feature usage, onboarding funnel, conversions" -ForegroundColor Gray
Write-Host "    ✓ Retention cohorts, engagement, revenue summary" -ForegroundColor Gray
Write-Host "    ✓ Time tracking, activity heatmap, referrals" -ForegroundColor Gray
Write-Host "    ✓ Support metrics, error rates, business dashboard`n" -ForegroundColor Gray

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env file with your Plaid and OpenAI credentials" -ForegroundColor White
Write-Host "  2. Start the backend server: npm start" -ForegroundColor White
Write-Host "  3. Create test user: node scripts/create-test-user.js" -ForegroundColor White
Write-Host "  4. Test the API endpoints`n" -ForegroundColor White

Write-Host "View Analytics:" -ForegroundColor Cyan
Write-Host "  Connect to database: psql -U ifi_user -d ifi_db" -ForegroundColor White
Write-Host "  View metrics: SELECT * FROM vw_business_dashboard;" -ForegroundColor White
Write-Host "  View users: SELECT * FROM vw_user_overview;`n" -ForegroundColor White

Write-Host "🎉 iFi database is ready to track your success!" -ForegroundColor Green
