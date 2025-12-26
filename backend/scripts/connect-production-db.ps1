# iFi Production Database Connection PowerShell Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  iFi Production Database Access" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check for environment variables
$prodHost = $env:PROD_DB_HOST
$prodPort = $env:PROD_DB_PORT
$prodName = $env:PROD_DB_NAME
$prodUser = $env:PROD_DB_USER
$prodPass = $env:PROD_DB_PASSWORD

if (-not $prodHost) {
    Write-Host "Production database environment variables not set!`n" -ForegroundColor Yellow
    Write-Host "Would you like to:" -ForegroundColor Yellow
    Write-Host "1. Enter credentials now (temporary)" -ForegroundColor White
    Write-Host "2. Set up environment variables (permanent)" -ForegroundColor White
    Write-Host "3. Exit" -ForegroundColor White
    $choice = Read-Host "`nEnter your choice (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host "`nEnter production database credentials:" -ForegroundColor Cyan
            $prodHost = Read-Host "Database host (e.g., db.your-app.com)"
            $prodPort = Read-Host "Database port (default: 5432)"
            if ([string]::IsNullOrWhiteSpace($prodPort)) { $prodPort = "5432" }
            $prodName = Read-Host "Database name (default: ifi_db)"
            if ([string]::IsNullOrWhiteSpace($prodName)) { $prodName = "ifi_db" }
            $prodUser = Read-Host "Database user (default: ifi_user)"
            if ([string]::IsNullOrWhiteSpace($prodUser)) { $prodUser = "ifi_user" }
            $prodPassSecure = Read-Host "Database password" -AsSecureString
            $prodPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($prodPassSecure))
        }
        "2" {
            Write-Host "`nTo set environment variables permanently:" -ForegroundColor Cyan
            Write-Host "1. Search for 'Environment Variables' in Windows" -ForegroundColor White
            Write-Host "2. Click 'Edit the system environment variables'" -ForegroundColor White
            Write-Host "3. Click 'Environment Variables'" -ForegroundColor White
            Write-Host "4. Under 'User variables', click 'New' and add:" -ForegroundColor White
            Write-Host "   - Variable: PROD_DB_HOST     Value: your-db-host.com" -ForegroundColor Gray
            Write-Host "   - Variable: PROD_DB_PORT     Value: 5432" -ForegroundColor Gray
            Write-Host "   - Variable: PROD_DB_NAME     Value: ifi_db" -ForegroundColor Gray
            Write-Host "   - Variable: PROD_DB_USER     Value: ifi_user" -ForegroundColor Gray
            Write-Host "   - Variable: PROD_DB_PASSWORD Value: your_password`n" -ForegroundColor Gray
            Write-Host "After setting variables, restart PowerShell and run this script again.`n" -ForegroundColor Yellow
            pause
            exit
        }
        default {
            exit
        }
    }
}

Write-Host "`nConnecting to production database..." -ForegroundColor Yellow
Write-Host "Host: $prodHost" -ForegroundColor Gray
Write-Host "Port: $prodPort" -ForegroundColor Gray
Write-Host "Database: $prodName" -ForegroundColor Gray
Write-Host "User: $prodUser`n" -ForegroundColor Gray

# Find psql executable
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if ($null -eq $psqlPath) {
    Write-Host "ERROR: PostgreSQL psql not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add psql to your PATH`n" -ForegroundColor Yellow
    pause
    exit 1
}

# Set password environment variable
$env:PGPASSWORD = $prodPass

# Connection string with SSL
$connectionString = "postgresql://${prodUser}:${prodPass}@${prodHost}:${prodPort}/${prodName}?sslmode=require&application_name=iFi-Admin"

Write-Host "Attempting secure connection with SSL...`n" -ForegroundColor Green

try {
    & $psqlPath $connectionString
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nConnection failed!" -ForegroundColor Red
        Write-Host "`nPossible issues:" -ForegroundColor Yellow
        Write-Host "  - Wrong credentials" -ForegroundColor Gray
        Write-Host "  - Firewall blocking connection" -ForegroundColor Gray
        Write-Host "  - Database not accessible from your IP" -ForegroundColor Gray
        Write-Host "  - SSL certificate issues" -ForegroundColor Gray
        Write-Host "  - Database service is down`n" -ForegroundColor Gray
        
        Write-Host "Troubleshooting steps:" -ForegroundColor Cyan
        Write-Host "1. Check your database provider dashboard" -ForegroundColor White
        Write-Host "2. Verify your IP is whitelisted in database firewall" -ForegroundColor White
        Write-Host "3. Test connection: pg_isready -h $prodHost -p $prodPort`n" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    # Clear password
    $env:PGPASSWORD = $null
}

Write-Host ""
pause
