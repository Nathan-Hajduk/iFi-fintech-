-- Test Query: Check if onboarding data exists
-- Run this in pgAdmin4 to verify data is saved

-- 1. Check if there's any onboarding data at all
SELECT COUNT(*) as total_onboarding_records FROM user_onboarding;

-- 2. Check your specific user's onboarding data (replace USER_ID with your actual user_id)
-- First, find your user_id:
SELECT user_id, email, username, first_name, onboarding_completed 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- 3. Then check your onboarding data (replace USER_ID)
SELECT 
    user_id,
    purpose,
    income_source,
    monthly_takehome,
    expenses,
    subscriptions,
    total_assets_value,
    total_debt_amount,
    created_at,
    updated_at
FROM user_onboarding
WHERE user_id = YOUR_USER_ID_HERE;  -- Replace with your user_id

-- 4. Check if expenses field is properly formatted (should be JSON)
SELECT 
    user_id,
    expenses::text as expenses_text,
    pg_typeof(expenses) as expenses_type
FROM user_onboarding
WHERE user_id = YOUR_USER_ID_HERE;

-- 5. Full data dump for debugging
SELECT * FROM user_onboarding WHERE user_id = YOUR_USER_ID_HERE;
