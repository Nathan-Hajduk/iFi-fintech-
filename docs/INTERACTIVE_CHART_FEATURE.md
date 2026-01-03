# Interactive Income vs Expenses Chart Feature

## Overview
This feature allows users to manually adjust their income and expenses for specific months and years, enabling accurate historical tracking and dynamic chart visualization with trajectory updates.

## Features

### ✨ User Capabilities
- **Edit Monthly Data**: Click "Edit Data" button to open the interactive modal
- **Select Month & Year**: Choose any month/year to view or edit financial data
- **Adjust Income & Expenses**: Manually set income and expense amounts for specific periods
- **Add Notes**: Include contextual notes for each month (e.g., "Bonus included", "Extra holiday spending")
- **View Net Cash Flow**: Real-time calculation of net cash flow (Income - Expenses)
- **Historical Tracking**: View all previously adjusted months in the "Your Adjustments" list
- **Delete Adjustments**: Remove specific monthly adjustments to revert to base calculations
- **Real-time Chart Updates**: Chart automatically refreshes after saving changes

### 📊 Chart Visualization
- **12-Month View**: Displays last 12 months of income vs expenses
- **Dynamic Trajectory**: Chart line updates based on custom monthly data
- **Adjusted Month Indicator**: Tooltips show "(Adjusted)" suffix for manually modified months
- **Color-Coded Lines**: 
  - Green line for income (#4ade80)
  - Red line for expenses (#ef4444)
- **Interactive Tooltips**: Hover to see exact dollar amounts

## Technical Implementation

### Backend API Endpoints

#### 1. GET `/api/user/monthly-financials`
Retrieves user's monthly financial adjustments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "month": 12,
      "year": 2024,
      "income": 5500.00,
      "expenses": 3200.00,
      "notes": "Holiday bonus included",
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

#### 2. POST `/api/user/monthly-financials`
Saves or updates monthly financial data.

**Request Body:**
```json
{
  "month": 12,
  "year": 2024,
  "income": 5500.00,
  "expenses": 3200.00,
  "notes": "Holiday bonus included"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...saved record... },
  "message": "Monthly financial data saved successfully"
}
```

#### 3. DELETE `/api/user/monthly-financials/:month/:year`
Deletes specific monthly data.

**Response:**
```json
{
  "success": true,
  "message": "Monthly financial data deleted successfully"
}
```

### Database Schema

```sql
CREATE TABLE user_monthly_financials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    income DECIMAL(12, 2) NOT NULL DEFAULT 0,
    expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

CREATE INDEX idx_monthly_financials_user_date 
ON user_monthly_financials(user_id, year DESC, month DESC);
```

### Frontend Components

#### Files Modified
1. **`js/dashboard-visualizations.js`**
   - `renderIncomeVsExpensesChart()` - Main chart rendering with edit controls
   - `openMonthEditModal()` - Opens the edit modal
   - `saveMonthlyData()` - Saves user adjustments
   - `deleteCurrentMonth()` - Removes specific month data
   - `loadMonthlyFinancials()` - Fetches data from backend
   - `generateChartData()` - Merges base data with custom adjustments
   - `refreshIncomeVsExpensesChart()` - Reloads chart after changes

2. **`css/dashboard-animated.css`**
   - `.chart-controls` - Header with edit button
   - `.month-edit-modal` - Full-screen modal overlay
   - `.modal-content` - Modal styling with glassmorphism
   - `.adjustment-item` - List items for existing adjustments
   - `.success-notification` - Save confirmation toast

3. **`backend/routes/user.js`**
   - Added 3 new API endpoints for monthly financials CRUD operations

## Setup Instructions

### 1. Database Setup
Run the SQL setup script:
```bash
cd backend
psql -U your_username -d ifi_database -f scripts/setup-monthly-financials.sql
```

Or using the Node.js script:
```bash
node scripts/create-monthly-financials-table.js
```

### 2. Backend Verification
Ensure the backend server is running with the new endpoints:
```bash
cd backend
npm start
```

Endpoints should be available at:
- `GET http://localhost:5000/api/user/monthly-financials`
- `POST http://localhost:5000/api/user/monthly-financials`
- `DELETE http://localhost:5000/api/user/monthly-financials/:month/:year`

### 3. Frontend Testing
1. Navigate to the dashboard
2. Scroll to "Income vs Expenses Trend" chart
3. Click "Edit Data" button
4. Select a month/year and enter financial data
5. Click "Save Changes"
6. Verify chart updates with new data points

## Usage Workflow

### Adding/Editing Monthly Data
1. **Open Modal**: Click "Edit Data" button on the chart
2. **Select Period**: Choose month and year from dropdowns
3. **Load Existing**: Click "Load Data for This Month" to populate existing data
4. **Enter Values**: 
   - Input income amount
   - Input expenses amount
   - Add optional notes
5. **Review Net Flow**: Check the calculated net cash flow preview
6. **Save**: Click "Save Changes" to store data
7. **Verify**: Chart automatically refreshes with updated trajectory

### Viewing Historical Adjustments
- Scroll to "Your Adjustments" section in modal
- See all months with custom data
- Click any adjustment to load it into the edit form
- Color-coded values: Green for income, Red for expenses

### Deleting Adjustments
1. Load the month you want to delete
2. Click the red "Delete" button
3. Confirm deletion
4. Chart reverts to base calculations for that month

## Data Flow

```
User Action (Edit Data) 
    ↓
Modal Opens with Current Month
    ↓
User Selects Month/Year → Loads Existing Data (if any)
    ↓
User Edits Income/Expenses/Notes
    ↓
Real-time Net Flow Calculation
    ↓
User Clicks Save
    ↓
POST /api/user/monthly-financials
    ↓
Database Upsert (Insert or Update)
    ↓
Success Response
    ↓
Reload monthlyFinancialData array
    ↓
Refresh Chart (destroy + recreate)
    ↓
Chart Shows Updated Trajectory
    ↓
Success Notification Toast
```

## Chart Data Merging Logic

```javascript
// For each of last 12 months:
1. Check if month exists in monthlyFinancialData array
2. If YES: Use custom income/expenses from database
3. If NO: Use base values from onboarding data
4. Generate month label (e.g., "Dec 24")
5. Add to chart datasets
```

## Responsive Design
- **Desktop**: Full-width modal (max 600px)
- **Tablet**: 90% width modal
- **Mobile**: 95% width, stacked form fields, vertical adjustment list

## Security
- All endpoints protected with JWT authentication
- User can only access/modify their own data
- SQL injection prevention via parameterized queries
- Input validation for month (1-12) and year (2000-2100)

## Performance Considerations
- Chart destroyed and recreated on data updates (Chart.js best practice)
- Database index on `(user_id, year, month)` for fast lookups
- UNIQUE constraint prevents duplicate entries
- Limit of 12 months displayed (performance optimization)

## Future Enhancements
- [ ] Export monthly data to CSV/Excel
- [ ] Bulk import from bank statements
- [ ] Monthly comparison view (year-over-year)
- [ ] Budget vs actual variance highlighting
- [ ] Predictive analytics using ML
- [ ] Mobile app integration
- [ ] Real-time collaboration features
- [ ] Automated expense categorization

## Troubleshooting

### Chart Not Updating
- Check browser console for JavaScript errors
- Verify backend is running (`npm start` in backend folder)
- Confirm JWT token is valid (check localStorage)
- Hard refresh: Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)

### Modal Not Opening
- Ensure `openMonthEditModal()` is globally accessible
- Check for CSS conflicts hiding the modal
- Verify modal HTML is injected into DOM

### Database Errors
- Confirm `user_monthly_financials` table exists
- Check database connection in `config/database.js`
- Verify user_id foreign key constraint is satisfied

### Data Not Persisting
- Check network tab for failed POST requests
- Verify authentication token is included in headers
- Confirm user has permission to write data

## Support
For issues or feature requests, contact the development team or create an issue in the project repository.

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Author**: iFi Development Team
