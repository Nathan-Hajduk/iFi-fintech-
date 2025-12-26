/**
 * Enhanced Database Initialization Script for iFi
 * Creates comprehensive tracking and analytics tables for business intelligence
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ifi_db',
  user: process.env.DB_USER || 'ifi_user',
  password: process.env.DB_PASSWORD,
});

async function initializeEnhancedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Initializing Enhanced iFi Database...\n');
    
    await client.query('BEGIN');
    
    // 1. Enhanced user_time_tracking table - Detailed time tracking per feature
    console.log('Creating user_time_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_time_tracking (
        time_tracking_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        page_name VARCHAR(100) NOT NULL,
        feature_name VARCHAR(100),
        time_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        time_end TIMESTAMP,
        duration_seconds INTEGER,
        session_id INTEGER,
        interactions_count INTEGER DEFAULT 0,
        device_type VARCHAR(50),
        browser VARCHAR(100),
        screen_resolution VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User time tracking table created');
    
    // 2. User activity heatmap - Track when users are most active
    console.log('Creating user_activity_heatmap table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_heatmap (
        heatmap_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
        activity_count INTEGER DEFAULT 1,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User activity heatmap table created');
    
    // 3. Subscription conversion tracking - Track free to premium conversions
    console.log('Creating subscription_conversion_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_conversion_tracking (
        conversion_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        conversion_source VARCHAR(100),
        days_as_free_user INTEGER,
        total_sessions_before_conversion INTEGER,
        total_time_spent_before_conversion INTEGER,
        features_used_before_conversion TEXT[],
        ai_queries_before_conversion INTEGER,
        trigger_feature VARCHAR(100),
        pricing_page_visits INTEGER DEFAULT 0,
        converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        conversion_value DECIMAL(10, 2),
        discount_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Subscription conversion tracking table created');
    
    // 4. Onboarding analytics - Track onboarding completion rates
    console.log('Creating onboarding_analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_analytics (
        onboarding_analytics_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        time_spent_seconds INTEGER,
        skipped BOOLEAN DEFAULT FALSE,
        drop_off BOOLEAN DEFAULT FALSE,
        form_data JSONB DEFAULT '{}'::jsonb,
        error_encountered TEXT,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Onboarding analytics table created');
    
    // 5. Feature adoption tracking - Track which features users adopt
    console.log('Creating feature_adoption_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_adoption_tracking (
        adoption_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        feature_name VARCHAR(100) NOT NULL,
        first_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total_uses INTEGER DEFAULT 1,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        days_to_adoption INTEGER,
        adopted_from VARCHAR(100),
        user_subscription_type VARCHAR(50),
        stickiness_score DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, feature_name)
      );
    `);
    console.log('✓ Feature adoption tracking table created');
    
    // 6. User retention metrics - Track retention cohorts
    console.log('Creating user_retention_metrics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_retention_metrics (
        retention_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        cohort_month DATE NOT NULL,
        days_since_signup INTEGER,
        is_active_day_1 BOOLEAN DEFAULT FALSE,
        is_active_day_7 BOOLEAN DEFAULT FALSE,
        is_active_day_30 BOOLEAN DEFAULT FALSE,
        is_active_day_90 BOOLEAN DEFAULT FALSE,
        total_logins INTEGER DEFAULT 0,
        avg_session_duration INTEGER,
        churn_risk_score DECIMAL(5, 2),
        last_activity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User retention metrics table created');
    
    // 7. User engagement scoring - Calculate engagement scores
    console.log('Creating user_engagement_scores table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_engagement_scores (
        engagement_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        login_frequency_score INTEGER DEFAULT 0,
        feature_usage_score INTEGER DEFAULT 0,
        time_spent_score INTEGER DEFAULT 0,
        transaction_tracking_score INTEGER DEFAULT 0,
        ai_interaction_score INTEGER DEFAULT 0,
        goal_setting_score INTEGER DEFAULT 0,
        overall_engagement_score INTEGER DEFAULT 0,
        engagement_tier VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start)
      );
    `);
    console.log('✓ User engagement scores table created');
    
    // 8. Revenue analytics - Track revenue metrics per user
    console.log('Creating revenue_analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_analytics (
        revenue_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        lifetime_value DECIMAL(12, 2) DEFAULT 0,
        total_revenue DECIMAL(12, 2) DEFAULT 0,
        monthly_recurring_revenue DECIMAL(10, 2) DEFAULT 0,
        annual_recurring_revenue DECIMAL(12, 2) DEFAULT 0,
        payment_count INTEGER DEFAULT 0,
        refund_count INTEGER DEFAULT 0,
        refund_amount DECIMAL(10, 2) DEFAULT 0,
        churn_date DATE,
        acquisition_cost DECIMAL(10, 2),
        acquisition_channel VARCHAR(100),
        customer_segment VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Revenue analytics table created');
    
    // 9. Daily active users snapshot - For DAU/MAU calculations
    console.log('Creating daily_active_users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_active_users (
        dau_id SERIAL PRIMARY KEY,
        activity_date DATE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        subscription_type VARCHAR(50) NOT NULL,
        session_count INTEGER DEFAULT 1,
        total_time_seconds INTEGER DEFAULT 0,
        features_used TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_date, user_id)
      );
    `);
    console.log('✓ Daily active users table created');
    
    // 10. Referral tracking - Track user referrals
    console.log('Creating referral_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_tracking (
        referral_id SERIAL PRIMARY KEY,
        referrer_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        referred_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        referral_link TEXT,
        referred_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        reward_type VARCHAR(50),
        reward_amount DECIMAL(10, 2),
        reward_given BOOLEAN DEFAULT FALSE,
        converted_to_paid BOOLEAN DEFAULT FALSE,
        clicked_at TIMESTAMP,
        signed_up_at TIMESTAMP,
        converted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT referral_status_check CHECK (status IN ('pending', 'clicked', 'signed_up', 'converted', 'expired'))
      );
    `);
    console.log('✓ Referral tracking table created');
    
    // 11. Support tickets - Track customer support
    console.log('Creating support_tickets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        assigned_to VARCHAR(100),
        resolution TEXT,
        first_response_time INTEGER,
        resolution_time INTEGER,
        satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        CONSTRAINT ticket_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        CONSTRAINT ticket_status_check CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed'))
      );
    `);
    console.log('✓ Support tickets table created');
    
    // 12. User feedback - Collect user feedback
    console.log('Creating user_feedback table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        feedback_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        feedback_type VARCHAR(50) NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        feature_name VARCHAR(100),
        page_url VARCHAR(500),
        sentiment VARCHAR(20),
        action_taken VARCHAR(100),
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT feedback_type_check CHECK (feedback_type IN ('bug', 'feature_request', 'complaint', 'praise', 'general'))
      );
    `);
    console.log('✓ User feedback table created');
    
    // 13. A/B test tracking - For feature testing
    console.log('Creating ab_test_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ab_test_tracking (
        test_id SERIAL PRIMARY KEY,
        test_name VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        variant VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        converted BOOLEAN DEFAULT FALSE,
        converted_at TIMESTAMP,
        conversion_value DECIMAL(10, 2),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(test_name, user_id)
      );
    `);
    console.log('✓ A/B test tracking table created');
    
    // 14. Error logs - Track application errors
    console.log('Creating error_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        error_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        page_url VARCHAR(500),
        user_action VARCHAR(255),
        browser VARCHAR(100),
        device_type VARCHAR(50),
        ip_address VARCHAR(45),
        severity VARCHAR(20) DEFAULT 'error',
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT error_severity_check CHECK (severity IN ('warning', 'error', 'critical'))
      );
    `);
    console.log('✓ Error logs table created');
    
    // 15. Business metrics snapshot - Daily aggregated metrics
    console.log('Creating business_metrics_snapshot table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_metrics_snapshot (
        snapshot_id SERIAL PRIMARY KEY,
        snapshot_date DATE NOT NULL UNIQUE,
        total_users INTEGER DEFAULT 0,
        free_users INTEGER DEFAULT 0,
        ifi_plus_users INTEGER DEFAULT 0,
        daily_active_users INTEGER DEFAULT 0,
        new_signups INTEGER DEFAULT 0,
        churned_users INTEGER DEFAULT 0,
        total_revenue DECIMAL(12, 2) DEFAULT 0,
        new_revenue DECIMAL(12, 2) DEFAULT 0,
        avg_session_duration INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        ai_queries_count INTEGER DEFAULT 0,
        support_tickets_opened INTEGER DEFAULT 0,
        support_tickets_resolved INTEGER DEFAULT 0,
        avg_engagement_score DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Business metrics snapshot table created');
    
    // Create comprehensive indexes for analytics queries
    console.log('\nCreating enhanced indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_time_tracking_user_id ON user_time_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_time_tracking_page ON user_time_tracking(page_name);
      CREATE INDEX IF NOT EXISTS idx_time_tracking_start ON user_time_tracking(time_start DESC);
      
      CREATE INDEX IF NOT EXISTS idx_activity_heatmap_user_id ON user_activity_heatmap(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_heatmap_day_hour ON user_activity_heatmap(day_of_week, hour_of_day);
      
      CREATE INDEX IF NOT EXISTS idx_conversion_user_id ON subscription_conversion_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversion_date ON subscription_conversion_tracking(converted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversion_source ON subscription_conversion_tracking(conversion_source);
      
      CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step ON onboarding_analytics(step_number);
      CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_drop_off ON onboarding_analytics(drop_off);
      
      CREATE INDEX IF NOT EXISTS idx_feature_adoption_user_id ON feature_adoption_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_adoption_feature ON feature_adoption_tracking(feature_name);
      CREATE INDEX IF NOT EXISTS idx_feature_adoption_first_used ON feature_adoption_tracking(first_used_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_retention_user_id ON user_retention_metrics(user_id);
      CREATE INDEX IF NOT EXISTS idx_retention_cohort ON user_retention_metrics(cohort_month);
      CREATE INDEX IF NOT EXISTS idx_retention_churn_risk ON user_retention_metrics(churn_risk_score DESC);
      
      CREATE INDEX IF NOT EXISTS idx_engagement_user_id ON user_engagement_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_engagement_week ON user_engagement_scores(week_start DESC);
      CREATE INDEX IF NOT EXISTS idx_engagement_score ON user_engagement_scores(overall_engagement_score DESC);
      
      CREATE INDEX IF NOT EXISTS idx_revenue_user_id ON revenue_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_ltv ON revenue_analytics(lifetime_value DESC);
      CREATE INDEX IF NOT EXISTS idx_revenue_channel ON revenue_analytics(acquisition_channel);
      
      CREATE INDEX IF NOT EXISTS idx_dau_date ON daily_active_users(activity_date DESC);
      CREATE INDEX IF NOT EXISTS idx_dau_user_id ON daily_active_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_dau_subscription ON daily_active_users(subscription_type);
      
      CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_tracking(referrer_user_id);
      CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_tracking(referral_code);
      CREATE INDEX IF NOT EXISTS idx_referral_status ON referral_tracking(status);
      
      CREATE INDEX IF NOT EXISTS idx_support_user_id ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_support_created ON support_tickets(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(feedback_type);
      CREATE INDEX IF NOT EXISTS idx_feedback_created ON user_feedback(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_ab_test_name ON ab_test_tracking(test_name);
      CREATE INDEX IF NOT EXISTS idx_ab_test_user_id ON ab_test_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_ab_test_converted ON ab_test_tracking(converted);
      
      CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
      CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
      
      CREATE INDEX IF NOT EXISTS idx_business_snapshot_date ON business_metrics_snapshot(snapshot_date DESC);
    `);
    console.log('✓ All enhanced indexes created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Enhanced Database initialization complete!\n');
    console.log('Enhanced Analytics Tables created:');
    console.log('  ✓ user_time_tracking - Detailed time tracking per feature');
    console.log('  ✓ user_activity_heatmap - Activity patterns by day/hour');
    console.log('  ✓ subscription_conversion_tracking - Free to paid conversion analytics');
    console.log('  ✓ onboarding_analytics - Onboarding funnel tracking');
    console.log('  ✓ feature_adoption_tracking - Feature usage adoption rates');
    console.log('  ✓ user_retention_metrics - Retention cohort analysis');
    console.log('  ✓ user_engagement_scores - Weekly engagement scoring');
    console.log('  ✓ revenue_analytics - Revenue and LTV tracking');
    console.log('  ✓ daily_active_users - DAU/MAU metrics');
    console.log('  ✓ referral_tracking - Referral program tracking');
    console.log('  ✓ support_tickets - Customer support tracking');
    console.log('  ✓ user_feedback - User feedback collection');
    console.log('  ✓ ab_test_tracking - A/B test tracking');
    console.log('  ✓ error_logs - Application error tracking');
    console.log('  ✓ business_metrics_snapshot - Daily business metrics\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Enhanced database initialization failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization if executed directly
if (require.main === module) {
  initializeEnhancedDatabase()
    .then(() => {
      console.log('Enhanced database ready for use!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeEnhancedDatabase };
