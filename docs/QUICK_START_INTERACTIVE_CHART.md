# 🚀 Quick Start - Interactive Chart Feature

## Step 1: Setup Database Table (Choose ONE method)

### Option A: Automated Node.js Script (Recommended)
```bash
cd backend
node scripts/setup-interactive-chart.js
```

### Option B: SQL Script
```bash
cd backend
psql -U postgres -d ifi_database -f scripts/setup-monthly-financials.sql
```

### Option C: Manual via Node.js (if database password issues)
```bash
cd backend
node -p "const db = require('./config/database'); (async () => { try { await db.query(\`CREATE TABLE IF NOT EXISTS user_monthly_financials (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12), year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100), income DECIMAL(12, 2) NOT NULL DEFAULT 0, expenses DECIMAL(12, 2) NOT NULL DEFAULT 0, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, month, year))\`); await db.query('CREATE INDEX IF NOT EXISTS idx_monthly_financials_user_date ON user_monthly_financials(user_id, year DESC, month DESC)'); console.log('✅ Setup complete!'); } catch(e) { console.error('❌ Error:', e.message); } process.exit(0); })();"
```

## Step 2: Start Backend Server
```bash
cd backend
npm start
```

You should see:
```
✅ Server running on port 5000
✅ Database connected
```

## Step 3: Open Dashboard
1. Open your browser
2. Navigate to your dashboard (typically `http://localhost:5000/html/dashboard.html`)
3. Log in with your credentials

## Step 4: Test the Feature

### 4.1 Locate the Chart
- Scroll down to find "Income vs Expenses Trend" widget
- You should see a line chart with green (income) and red (expenses) lines

### 4.2 Click "Edit Data"
- Find the blue "Edit Data" button in the chart header
- Click it to open the interactive modal

### 4.3 Add Monthly Data
1. **Select Month**: Choose any month from dropdown (e.g., December)
2. **Select Year**: Choose year (e.g., 2024)
3. **Click "Load Data for This Month"**: This loads your base income/expenses
4. **Edit Values**: 
   - Income: Change to any amount (e.g., 6500)
   - Expenses: Change to any amount (e.g., 3800)
   - Notes: Add context like "Holiday bonus included"
5. **Watch Net Flow**: It updates in real-time
6. **Click "Save Changes"**: Green button at bottom

### 4.4 Verify Chart Updates
- Modal closes automatically (or click Cancel)
- Chart refreshes with new data
- Green success notification appears top-right
- Chart line now reflects your custom data for that month

### 4.5 Edit More Months
1. Click "Edit Data" again
2. Choose a different month/year
3. Add different income/expenses
4. Save and watch the chart trajectory change!

### 4.6 View Your Adjustments
- In the modal, scroll to "Your Adjustments" section
- See all months you've edited
- Click any adjustment to load it into the form
- Can edit or delete from there

### 4.7 Delete an Adjustment
1. Load the month you want to delete
2. Click the red "Delete" button
3. Confirm deletion
4. Chart reverts to base calculation for that month

## ✅ Success Indicators

You'll know it's working when:
- [ ] "Edit Data" button appears on chart
- [ ] Modal opens with month/year selectors
- [ ] Income/expenses inputs accept numbers
- [ ] Net flow shows calculated result in green or red
- [ ] Save button stores data (check "Your Adjustments")
- [ ] Chart automatically refreshes after save
- [ ] Green success notification appears
- [ ] Chart line changes based on your data
- [ ] Hovering shows "(Adjusted)" in tooltip for edited months

## 🐛 Troubleshooting

### Issue: Database table creation fails
**Solution**: 
- Ensure PostgreSQL is running
- Check database credentials in `backend/config/database.js`
- Verify you have CREATE TABLE permissions
- Make sure `users` table exists (foreign key dependency)

### Issue: "Edit Data" button doesn't appear
**Solution**:
- Hard refresh: Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)
- Check browser console for JavaScript errors
- Verify `dashboard-visualizations.js` is loaded
- Check if chart container exists: `document.getElementById('incomeVsExpensesChart')`

### Issue: Modal doesn't open
**Solution**:
- Check console for `openMonthEditModal is not defined` error
- Verify function is globally accessible (not inside another function)
- Check if CSS is hiding modal (`display: none` without `display: flex` on show)

### Issue: Save doesn't persist
**Solution**:
- Check Network tab for 401 Unauthorized (re-login)
- Verify backend is running on port 5000
- Check `/api/user/monthly-financials` endpoint responds
- Ensure JWT token in localStorage: `localStorage.getItem('ifi_access_token')`

### Issue: Chart doesn't update
**Solution**:
- Verify `refreshIncomeVsExpensesChart()` is called after save
- Check if `incomeExpensesChartInstance.destroy()` runs before recreate
- Look for Chart.js errors in console
- Ensure onboarding data exists in localStorage

## 📸 Expected Behavior

### Before Edits:
- Chart shows 12 months of data
- All months use base income/expenses from onboarding
- Tooltips show: "Income: $5,000" (no adjustment indicator)

### After Editing November:
- November data point moves to custom values
- Tooltip shows: "Income: $6,500 (Adjusted)"
- Chart trajectory changes reflecting new data
- "Your Adjustments" list shows "Nov 2024"

### After Editing Multiple Months:
- Chart becomes highly customized
- Each edited month uses custom data
- Unedited months still use base data
- Clear visual representation of financial changes over time

## 🎯 Usage Tips

1. **Start with Current Month**: Edit current month first to see immediate impact
2. **Add Context Notes**: Use notes field to remember why that month was different
3. **Review Trajectory**: After editing 3+ months, see how your finances trend
4. **Compare Year-over-Year**: Edit same month in different years to compare
5. **Track Bonuses**: Note months with extra income (bonuses, tax returns)
6. **Holiday Spending**: Track seasonal expense spikes
7. **Budget Adjustments**: Update as your financial situation changes

## 📊 Sample Data to Try

**Test Scenario: Career Progression**
- Jan 2024: Income $5,000, Expenses $3,200 (base salary)
- Apr 2024: Income $5,500, Expenses $3,200 (raise received)
- Jul 2024: Income $5,500, Expenses $3,500 (moved to bigger apartment)
- Oct 2024: Income $6,200, Expenses $3,500 (promotion)
- Dec 2024: Income $8,000, Expenses $4,500 (year-end bonus + holiday spending)

Watch the chart show your financial growth trajectory!

## 📚 Additional Resources

- **Full Documentation**: See `INTERACTIVE_CHART_FEATURE.md`
- **Implementation Details**: See `INTERACTIVE_CHART_IMPLEMENTATION.md`
- **API Endpoints**: Check `backend/routes/user.js` lines 640-730
- **Frontend Code**: Check `js/dashboard-visualizations.js` lines 300-600

## 💡 Next Steps

After testing:
1. Add data for last 6-12 months to see full trajectory
2. Share with team for feedback
3. Consider adding export feature (CSV download)
4. Explore predictive analytics based on historical trends
5. Add mobile responsiveness testing

---

**Setup Time**: 5 minutes  
**Testing Time**: 10 minutes  
**Status**: Ready for Production 🚀

Enjoy your interactive financial insights!
