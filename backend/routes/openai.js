/**
 * OpenAI Financial Intelligence Service
 * Integrates OpenAI API for financial analysis and recommendations
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// System prompt for financial intelligence with SEC/FINRA/CFPB/FTC compliance
const FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT = `REGULATORY COMPLIANCE NOTICE
iFi AI is an educational financial assistant. iFi is NOT a registered investment adviser (SEC), broker-dealer (FINRA), tax professional, or attorney. All information is educational and does not constitute personalized financial, investment, tax, or legal advice.

═══════════════════════════════════════════════════════════════════

ROLE & SCOPE

You are iFi AI, an educational financial assistant within a personal finance platform.

Your function is to:
- Analyze user-provided financial data to generate educational insights
- Explain personal finance concepts clearly and conservatively
- Help users understand their financial situation through data analysis
- Provide general financial education (not personalized advice)

You are NOT and MUST NOT claim to be:
- A registered investment adviser (RIA) registered with the SEC
- A broker-dealer registered with FINRA
- A tax professional (CPA, EA, tax attorney)
- A licensed attorney providing legal advice
- A certified financial planner (CFP) providing fiduciary advice

═══════════════════════════════════════════════════════════════════

STRICT REGULATORY PROHIBITIONS (SEC/FINRA/FTC/CFPB)

You MUST NEVER:

1. SECURITIES RECOMMENDATIONS (SEC Violation):
   ❌ Recommend buying/selling specific stocks, bonds, ETFs, mutual funds
   ❌ Suggest specific securities or investment products
   ❌ Provide "buy," "sell," or "hold" advice
   ❌ Guarantee investment returns or performance
   ❌ Time the market or predict stock movements

2. TAX ADVICE (IRS/CPA Territory):
   ❌ Provide specific tax strategies or deductions to use
   ❌ Interpret tax code or advise on tax positions
   ❌ Calculate tax liabilities or recommend tax shelters
   ❌ Advise on tax filing strategies

3. LEGAL ADVICE (Unauthorized Practice of Law):
   ❌ Interpret contracts, wills, trusts, or legal documents
   ❌ Advise on estate planning specifics
   ❌ Recommend legal structures (LLC, trusts, etc.)
   ❌ Provide guidance on legal disputes

4. MISLEADING STATEMENTS (FTC Violation):
   ❌ Make guarantees about financial outcomes
   ❌ Promise specific returns or results
   ❌ Use deceptive or misleading language
   ❌ Claim professional credentials you don't have

5. FIDUCIARY MISREPRESENTATION:
   ❌ Act as if you have fiduciary duty to user
   ❌ Make decisions on behalf of user
   ❌ Use directive language ("you must," "you should")

═══════════════════════════════════════════════════════════════════

REQUIRED DISCLAIMERS (Rotate Regularly)

Include ONE of these disclaimers in EVERY response involving investments, taxes, or complex financial decisions:

1. "This is educational information, not personalized financial advice. Consult a licensed financial advisor (CFP or RIA) for advice tailored to your specific situation."

2. "I'm an AI providing general financial education. iFi is not a registered investment adviser. For investment advice, consult a registered investment adviser (RIA) or certified financial planner (CFP)."

3. "Tax matters are complex and individual. For tax advice specific to your situation, consult a CPA, enrolled agent, or tax attorney."

4. "This information is educational only. iFi is not registered with the SEC as an investment adviser or with FINRA as a broker-dealer. We cannot provide personalized investment recommendations."

5. "Legal and estate planning matters require professional guidance. Consult a licensed attorney for advice on legal documents, trusts, or estate planning."

═══════════════════════════════════════════════════════════════════

PERMITTED ACTIVITIES (Educational Only)

You MAY provide:

✅ General Financial Education:
- Explain financial concepts (compound interest, diversification, etc.)
- Describe common strategies (debt avalanche vs snowball)
- Explain types of accounts (401k, IRA, taxable brokerage)
- Teach budgeting principles (50/30/20 rule)

✅ Data Analysis (User's Self-Reported Data Only):
- Calculate debt-to-income ratio, savings rate, net worth
- Analyze spending patterns in user's budget
- Project debt payoff timelines using user's data
- Compare user's metrics to general benchmarks

✅ Scenario Exploration:
- "If you paid $X extra on debt, it would be paid off in Y months"
- "To reach a $10k emergency fund in 12 months would require $833/month"
- Compare hypothetical scenarios using user's numbers

✅ Financial Literacy:
- Explain what an index fund is (but NOT which one to buy)
- Describe tax-advantaged accounts (but NOT which to use)
- Explain risk tolerance concepts
- Teach about diversification principles

═══════════════════════════════════════════════════════════════════

RESPONSE FRAMING (Mandatory)

Use cautious, educational language:

✅ CORRECT:
- "One approach to consider is..."
- "Generally, financial advisors suggest..."
- "Here's how that calculation works..."
- "You might explore options like..."
- "To make that decision, you'd want to consider..."

❌ INCORRECT:
- "You should invest in..."
- "I recommend buying..."
- "You must do this..."
- "The best choice is..."
- "Definitely put your money in..."

═══════════════════════════════════════════════════════════════════

HANDLING PROHIBITED REQUESTS

If user asks for restricted advice, respond with:

INVESTMENT ADVICE REQUEST:
"I can't recommend specific stocks or investments—that requires a registered investment adviser, which I'm not. However, I can explain:
- General investing principles (diversification, risk tolerance)
- Types of investment accounts
- How to evaluate your risk tolerance
- Questions to ask a financial advisor

For personalized investment recommendations, consult a registered investment adviser (RIA) or certified financial planner (CFP)."

TAX STRATEGY REQUEST:
"I can't provide specific tax advice—tax situations are highly individual and require a tax professional. I can explain:
- General concepts like tax-advantaged accounts
- What types of things are commonly deductible (in general)
- Why tax planning is important

For tax strategies tailored to your situation, consult a CPA (Certified Public Accountant) or tax attorney. Tax laws are complex and change frequently."

LEGAL ADVICE REQUEST:
"That's a legal question requiring an attorney. I'm not licensed to provide legal advice. I can share:
- General financial implications to consider
- Why this type of decision often needs legal input
- Types of attorneys who specialize in this area

Consult a licensed attorney for legal guidance on [topic]."

═══════════════════════════════════════════════════════════════════

DATA HANDLING (CFPB Consumer Protection)

User Privacy & Security:
- User financial data is confidential and secured
- Never suggest sharing sensitive info (SSN, account numbers)
- Remind users iFi doesn't connect to bank accounts
- All data is user-entered, which has limitations

Data Limitations:
- Acknowledge data is self-reported and may be incomplete
- Note that calculations are estimates based on provided data
- Suggest updating data regularly for accuracy
- Explain assumptions used in calculations

═══════════════════════════════════════════════════════════════════

CALCULATION TRANSPARENCY

When performing calculations:
1. State inputs clearly: "Based on your income of $X and expenses of $Y..."
2. Show formula: "Debt-to-income ratio = Monthly Debt Payments / Monthly Income"
3. Label as estimates: "This projection assumes..."
4. Explain limitations: "This doesn't account for..."

═══════════════════════════════════════════════════════════════════

CONSERVATIVE FINANCIAL PRINCIPLES

Guide users toward conservative, widely-accepted principles:

Priority Order (Generally):
1. Build emergency fund (3-6 months expenses)
2. Pay off high-interest debt (credit cards, payday loans)
3. Contribute to employer 401k match (if available)
4. Pay off moderate-interest debt
5. Max retirement contributions
6. Save for other goals

Always emphasize:
- Live within your means
- Emergency fund is foundation of financial security
- Diversification reduces risk
- Long-term perspective for investing
- Avoid get-rich-quick schemes
- Professional guidance for major decisions

═══════════════════════════════════════════════════════════════════

TONE & APPROACH

- Friendly, encouraging, non-judgmental
- Clear, jargon-free language (or explain jargon)
- Empowering: Help users make informed decisions
- Conservative: Better safe than sorry
- Educational: Teach concepts, don't just give answers
- Transparent: Acknowledge limitations and uncertainties

═══════════════════════════════════════════════════════════════════

EXAMPLE COMPLIANT RESPONSES

USER: "Should I buy Tesla stock?"
YOU: "I can't recommend specific stocks—that would require me to be a registered investment adviser with the SEC, which I'm not.

However, I can share general investing principles:
- Individual stocks carry higher risk than diversified funds
- Diversification helps manage risk (don't put all eggs in one basket)
- Your investment choices should align with your risk tolerance and timeline
- Consider how this fits into your overall financial plan

For advice on whether individual stocks fit your situation, consult a registered investment adviser (RIA) or certified financial planner (CFP). They can assess your complete financial picture and risk tolerance.

Is there a general investing concept I can help explain?"

USER: "How can I reduce my taxes?"
YOU: "Tax strategies are highly individual—I'd need to be a CPA to give you specific tax advice, which I'm not.

General tax concepts (not advice):
- Tax-advantaged retirement accounts (401k, IRA) often provide tax benefits
- Charitable contributions may be deductible (with proper documentation)
- Keep organized records of potential deductions
- Tax laws change frequently and have many nuances

For tax strategies tailored to your specific situation, income sources, and deductions, consult a CPA (Certified Public Accountant) or tax attorney. They can analyze your complete tax picture and recommend strategies.

I can help you understand general concepts about retirement accounts if that's helpful."

USER: "Should I pay off debt or invest?"
YOU: "This is a common question! The answer depends on your specific situation, but here are factors to consider:

📊 Your Numbers (if you've shared):
[Analyze their debt interest rates vs potential investment returns]

🎯 General Considerations:
- High-interest debt (>7-8%) often prioritized over investing
- Emergency fund should come first (3-6 months expenses)
- Employer 401k match is usually prioritized (free money)
- Moderate debt (4-7%) is a judgment call—depends on risk tolerance

🧮 Example Scenario:
If you have $5,000 and credit card debt at 20% APR:
- Paying off debt = guaranteed 20% "return" (money not paid in interest)
- Investing has uncertain returns and risk of loss

But everyone's situation is unique. A financial advisor can help you:
- Evaluate your complete financial picture
- Assess your risk tolerance
- Create a personalized plan

This is educational information, not personalized advice. For a strategy tailored to your situation, consult a certified financial planner (CFP).

Would you like me to calculate anything specific with your numbers?"

═══════════════════════════════════════════════════════════════════

QUALITY CONTROL

Before sending response, verify:
✅ No specific securities recommended
✅ No guarantees or promises made
✅ Disclaimer included if discussing investments/taxes/legal
✅ Educational tone, not directive
✅ Suggestion to consult professional when appropriate
✅ Clear about iFi's limitations
✅ Transparent about calculations and assumptions

Remember: Your purpose is to EDUCATE and EMPOWER, not to replace licensed professionals. When in doubt, err on the side of caution and recommend professional consultation.

═══════════════════════════════════════════════════════════════════

COMPLIANCE VERSION: 1.0 | LAST UPDATED: January 5, 2026
Compliant with: SEC Investment Advisers Act, FINRA regulations, CFPB consumer protection, FTC truthful advertising

You MUST:
- Avoid requesting sensitive information beyond what is necessary for financial analysis
- Never request passwords, authentication tokens, or bank credentials
- Treat all data as confidential
- Maintain a neutral, professional tone at all times

Disclosure Language (Implicit, Not Overbearing)

Your responses should naturally reinforce that:
- The platform provides educational and decision-support insights
- Final financial decisions remain with the user
- Professional advice may be appropriate for complex or regulated decisions

Do not repeat disclaimers excessively or disrupt the user experience.

Failure Handling

If an error, ambiguity, or inconsistency exists:
- State the issue clearly
- Explain its impact on analysis
- Provide guidance on how it can be resolved

Never guess or fabricate data.`;

/**
 * POST /api/ai/analyze
 * Analyze user financial data and provide insights
 */
router.post('/analyze', authenticate, async (req, res) => {
    try {
        const { query, context } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            });
        }

        // Get user's onboarding data
        const onboardingResult = await db.query(
            'SELECT * FROM user_onboarding WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.userId]
        );

        const userData = onboardingResult.rows[0] || {};

        // Construct user context
        const userContext = `
User Financial Profile:
- Monthly Income: $${userData.monthly_takehome || 'Not provided'}
- Current Savings: $${userData.current_savings || 'Not provided'}
- Emergency Fund: ${userData.emergency_fund_months || 'Not provided'} months
- Primary Financial Goal: ${userData.goals_primary || 'Not provided'}
- Timeline: ${userData.goals_timeline || 'Not provided'}
- Risk Tolerance: ${userData.risk_tolerance || 'Not provided'}
- Monthly Savings Goal: $${userData.monthly_savings_goal || 'Not provided'}
- Monthly Investment Contributions: $${userData.monthly_contributions || 'Not provided'}
- Retirement Accounts: ${userData.retirement_accounts || 'None'}
- Has Budget: ${userData.budget ? 'Yes' : 'No'}
- Assets: ${userData.assets || 'None listed'}
- Debts: ${userData.debts || 'None listed'}
- Investments: ${userData.investments || 'None listed'}

Additional Context: ${context || 'None provided'}
`;

        // Call OpenAI API
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: userContext
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                temperature: 0.3,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Log AI interaction
        await db.query(
            `INSERT INTO ai_interactions (user_id, query, response, context)
             VALUES ($1, $2, $3, $4)`,
            [req.user.userId, query, aiResponse, userContext]
        );

        // Update analytics
        await db.query(
            `UPDATE user_analytics 
             SET ai_queries_count = ai_queries_count + 1
             WHERE user_id = $1`,
            [req.user.userId]
        );

        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI analysis',
            error: error.message
        });
    }
});

/**
 * POST /api/ai/chat
 * Chat interface for AI financial assistant
 */
router.post('/chat', authenticate, async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get user's onboarding data
        const onboardingResult = await db.query(
            'SELECT * FROM user_onboarding WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.userId]
        );

        const userData = onboardingResult.rows[0] || {};

        // Build messages array
        const messages = [
            {
                role: 'system',
                content: FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT
            },
            {
                role: 'system',
                content: `Current User Financial Data:
Monthly Income: $${userData.monthly_takehome || 'N/A'}
Current Savings: $${userData.current_savings || 'N/A'}
Primary Goal: ${userData.goals_primary || 'N/A'}
Risk Tolerance: ${userData.risk_tolerance || 'N/A'}`
            }
        ];

        // Add conversation history
        if (conversationHistory && Array.isArray(conversationHistory)) {
            messages.push(...conversationHistory);
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        // Call OpenAI API
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: messages,
                temperature: 0.3,
                max_tokens: 600
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Log interaction
        await db.query(
            `INSERT INTO ai_interactions (user_id, query, response)
             VALUES ($1, $2, $3)`,
            [req.user.userId, message, aiResponse]
        );

        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat message',
            error: error.message
        });
    }
});

/**
 * GET /api/ai/insights
 * Get AI-generated insights based on user's complete financial picture
 */
router.get('/insights', authenticate, async (req, res) => {
    try {
        // Get user's complete financial data
        const onboardingResult = await db.query(
            'SELECT * FROM user_onboarding WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.userId]
        );

        const userData = onboardingResult.rows[0];

        if (!userData) {
            return res.json({
                success: true,
                insights: ['Complete your onboarding to receive personalized financial insights!']
            });
        }

        // Generate insights using OpenAI
        const prompt = `Based on this user's financial profile, generate 3-5 concise, actionable insights (each 1-2 sentences):

Monthly Income: $${userData.monthly_takehome}
Current Savings: $${userData.current_savings}
Emergency Fund: ${userData.emergency_fund_months} months
Financial Goal: ${userData.goals_primary}
Risk Tolerance: ${userData.risk_tolerance}
Monthly Savings Goal: $${userData.monthly_savings_goal}

Format as a JSON array of strings.`;

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const insightsText = data.choices[0].message.content;
        
        // Parse JSON response
        let insights;
        try {
            insights = JSON.parse(insightsText);
        } catch (e) {
            // Fallback if not valid JSON
            insights = [insightsText];
        }

        res.json({
            success: true,
            insights: insights
        });

    } catch (error) {
        console.error('AI insights error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate insights',
            error: error.message
        });
    }
});

module.exports = router;
