/**
 * AI Advisor Service - OpenAI Integration
 * Provides financial advice powered by GPT-4
 */

const OpenAI = require('openai');

class AIAdvisorService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.systemPrompt = `You are iFi AI, an expert financial advisor assistant. You provide personalized financial advice to help users:
- Create and stick to budgets
- Make informed investment decisions  
- Optimize savings strategies
- Plan for major purchases and life events
- Understand market trends and economic indicators
- Reduce debt and improve credit
- Build emergency funds and retirement savings

Your responses should be:
- Clear, concise, and actionable
- Data-driven when possible
- Tailored to the user's financial situation
- Educational without being condescending
- Encouraging and supportive

You have access to the user's financial data including:
- Current net worth, income, and expenses
- Investment portfolio and performance
- Debt levels and payment history
- Savings goals and progress
- Transaction history and spending patterns

Always consider:
- User's risk tolerance
- Time horizon for goals
- Current market conditions
- Tax implications
- Diversification principles

IMPORTANT: You are an AI assistant, not a licensed financial advisor. For complex situations or large sums, always recommend consulting with a certified financial planner or tax professional.`;
  }
  
  /**
   * Get AI financial advice
   * @param {string} message - User's question
   * @param {Object} userData - User's financial context
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<string>} AI response
   */
  async getAdvice(message, userData, conversationHistory = []) {
    try {
      // Build context from user data
      const userContext = this.buildUserContext(userData);
      
      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `User Financial Context:\n${userContext}` },
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Handle specific errors
      if (error.code === 'insufficient_quota') {
        throw new Error('AI service temporarily unavailable. Please try again later.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }
  
  /**
   * Get streaming AI response
   * @param {string} message - User's question
   * @param {Object} userData - User's financial context
   * @param {Array} conversationHistory - Previous messages
   * @returns {AsyncIterable} Stream of response chunks
   */
  async *getAdviceStream(message, userData, conversationHistory = []) {
    try {
      const userContext = this.buildUserContext(userData);
      
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `User Financial Context:\n${userContext}` },
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        stream: true
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to stream AI response.');
    }
  }
  
  /**
   * Build user context string from financial data
   * @param {Object} userData - User's financial information
   * @returns {string} Formatted context
   */
  buildUserContext(userData) {
    const {
      netWorth = 0,
      income = 0,
      expenses = 0,
      investments = [],
      debts = [],
      goals = [],
      riskTolerance = 'moderate',
      age = null
    } = userData;
    
    let context = `Net Worth: $${netWorth.toLocaleString()}\n`;
    context += `Monthly Income: $${income.toLocaleString()}\n`;
    context += `Monthly Expenses: $${expenses.toLocaleString()}\n`;
    context += `Monthly Savings: $${(income - expenses).toLocaleString()}\n`;
    context += `Risk Tolerance: ${riskTolerance}\n`;
    
    if (age) {
      context += `Age: ${age}\n`;
    }
    
    if (investments.length > 0) {
      context += `\nInvestment Portfolio:\n`;
      investments.forEach(inv => {
        context += `- ${inv.name}: $${inv.value.toLocaleString()} (${inv.type})\n`;
      });
    }
    
    if (debts.length > 0) {
      context += `\nDebts:\n`;
      debts.forEach(debt => {
        context += `- ${debt.name}: $${debt.balance.toLocaleString()} at ${debt.interestRate}% APR\n`;
      });
    }
    
    if (goals.length > 0) {
      context += `\nFinancial Goals:\n`;
      goals.forEach(goal => {
        context += `- ${goal.name}: Target $${goal.targetAmount.toLocaleString()} by ${goal.targetDate}\n`;
      });
    }
    
    return context;
  }
  
  /**
   * Get quick financial tip based on user data
   * @param {Object} userData - User's financial information
   * @returns {Promise<string>} Personalized tip
   */
  async getQuickTip(userData) {
    try {
      const userContext = this.buildUserContext(userData);
      
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `User Financial Context:\n${userContext}` },
        { 
          role: 'user', 
          content: 'Give me one actionable financial tip based on my current situation. Keep it under 2 sentences.' 
        }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 150
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Quick tip error:', error);
      return 'Start small: Track your spending for 30 days to identify patterns and opportunities to save.';
    }
  }
  
  /**
   * Analyze spending patterns and provide insights
   * @param {Array} transactions - Recent transactions
   * @returns {Promise<Object>} Spending analysis
   */
  async analyzeSpending(transactions) {
    try {
      // Calculate category totals
      const categoryTotals = transactions.reduce((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
        return acc;
      }, {});
      
      const totalSpending = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
      
      // Format for AI analysis
      const spendingContext = Object.entries(categoryTotals)
        .map(([category, amount]) => `${category}: $${amount.toFixed(2)} (${((amount/totalSpending)*100).toFixed(1)}%)`)
        .join('\n');
      
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { 
          role: 'user', 
          content: `Analyze this spending breakdown and provide 2-3 specific insights or recommendations:\n\n${spendingContext}\n\nTotal: $${totalSpending.toFixed(2)}` 
        }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 400
      });
      
      return {
        insights: completion.choices[0].message.content,
        categoryTotals,
        totalSpending
      };
    } catch (error) {
      console.error('Spending analysis error:', error);
      throw new Error('Failed to analyze spending patterns.');
    }
  }
  
  /**
   * Get investment portfolio recommendations
   * @param {Object} portfolio - Current portfolio
   * @param {Object} userData - User context
   * @returns {Promise<string>} Portfolio recommendations
   */
  async getPortfolioRecommendations(portfolio, userData) {
    try {
      const userContext = this.buildUserContext(userData);
      
      const portfolioContext = portfolio.holdings.map(holding => 
        `${holding.symbol}: ${holding.shares} shares @ $${holding.currentPrice} = $${holding.totalValue.toFixed(2)}`
      ).join('\n');
      
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `User Financial Context:\n${userContext}` },
        { 
          role: 'user', 
          content: `Review my investment portfolio and provide specific recommendations for rebalancing or improvements:\n\nCurrent Holdings:\n${portfolioContext}\n\nTotal Portfolio Value: $${portfolio.totalValue.toFixed(2)}` 
        }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 600
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Portfolio recommendations error:', error);
      throw new Error('Failed to generate portfolio recommendations.');
    }
  }
}

// Export singleton instance
module.exports = new AIAdvisorService();
