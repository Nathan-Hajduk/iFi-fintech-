// iFi Onboarding Logic
const API_URL = 'http://localhost:3000/api';

// Plaid configuration
let plaidHandler = null;
let plaidPublicToken = null;
let bankConnectionStatus = false;

// Store onboarding data
const onboardingData = {
    purpose: null,
    bankConnected: false,
    plaidAccessToken: null,
    linkedAccounts: [],
    annualIncome: null,
    incomeSource: null,
    expenses: {
        housing: 0,
        utilities: 0,
        food: 0,
        transportation: 0,
        insurance: 0,
        other: 0
    },
    investments: [],
    portfolioValue: null,
    business: {
        assets: {
            cash: 0,
            inventory: 0,
            equipment: 0,
            property: 0,
            other: 0
        },
        liabilities: {
            loan: 0,
            payables: 0,
            credit: 0,
            other: 0
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('ifi_current_user') || 'null');
    if (!currentUser) {
        window.location.href = '../html/Login.html';
        return;
    }

    // Set up event listeners
    setupPurposeListeners();
    setupIncomeListeners();
    setupExpenseListeners();
    setupInvestmentListeners();
    
    // Initialize Plaid Link handler on page load
    createPlaidLinkHandler();
});

// Initialize Plaid Link
function createPlaidLinkHandler() {
    // Fetch link token from backend
    const userId = getCurrentUserId();
    
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    fetch(`${API_URL}/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.link_token) {
            initializePlaidHandler(data.link_token);
        } else {
            throw new Error(data.message || 'Failed to create link token');
        }
    })
    .catch(error => {
        console.error('Error creating Plaid link token:', error);
        showError('Unable to initialize bank connection. Please check that the backend server is running.');
    });
}

function initializePlaidHandler(linkToken) {
    plaidHandler = Plaid.create({
        token: linkToken,
        onSuccess: function(public_token, metadata) {
            // Store the public token
            plaidPublicToken = public_token;
            bankConnectionStatus = true;
            
            // Store account metadata
            onboardingData.bankConnected = true;
            onboardingData.linkedAccounts = metadata.accounts || [];
            
            console.log('Plaid Link Success:', metadata);
            
            // Exchange public_token for access_token on backend
            exchangePublicToken(public_token, metadata);
        },
        onExit: function(err, metadata) {
            if (err != null) {
                console.error('Plaid Link Error:', err);
                showError('Bank connection failed. You can try again or skip for now.');
            } else {
                // User exited without connecting
                console.log('Plaid Link exited:', metadata);
            }
        },
        onEvent: function(eventName, metadata) {
            console.log('Plaid Link Event:', eventName, metadata);
        }
    });
}

// Called when user clicks "Connect Bank Account" button
function initPlaidLink() {
    if (!plaidHandler) {
        showError('Initializing bank connection. Please wait a moment...');
        
        // Try to create handler if it doesn't exist
        createPlaidLinkHandler();
        
        // Retry after 2 seconds
        setTimeout(() => {
            if (plaidHandler) {
                plaidHandler.open();
            } else {
                showError('Bank connection unavailable. Please ensure the backend server is running on port 3000.');
            }
        }, 2000);
        return;
    }
    
    plaidHandler.open();
}

// Exchange public token for access token
async function exchangePublicToken(publicToken, metadata) {
    try {
        // Show loading state
        const linkButton = document.getElementById('link-bank-button');
        if (linkButton) {
            linkButton.disabled = true;
            linkButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        }
        
        const userId = getCurrentUserId();
        
        if (!userId) {
            throw new Error('User ID not found. Please log in again.');
        }
        
        // Call backend to exchange token
        const response = await fetch(`${API_URL}/plaid/exchange_public_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                public_token: publicToken,
                userId: userId,
                accounts: metadata.accounts || [],
                institution: metadata.institution || {}
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to connect bank account');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to exchange token');
        }
        
        // Store item_id (not the actual access token - backend handles that)
        onboardingData.plaidAccessToken = data.item_id;
        onboardingData.bankConnected = true;
        onboardingData.linkedAccounts = metadata.accounts || [];
        
        // Update UI to show success
        showBankConnectionSuccess(metadata);
        
        // Automatically proceed to next step after 2 seconds
        setTimeout(() => {
            nextStep(3);
        }, 2000);
        
    } catch (error) {
        console.error('Token exchange error:', error);
        showError(error.message || 'Failed to complete bank connection. Please try again.');
        
        // Reset button
        const linkButton = document.getElementById('link-bank-button');
        if (linkButton) {
            linkButton.disabled = false;
            linkButton.innerHTML = '<i class="fas fa-building-columns"></i> Connect Bank Account';
        }
    }
}

// Show success message after bank connection
function showBankConnectionSuccess(metadata) {
    const linkButton = document.getElementById('link-bank-button');
    if (linkButton) {
        linkButton.innerHTML = '<i class="fas fa-check-circle"></i> Connected Successfully!';
        linkButton.classList.add('btn-success');
    }
    
    const accountCount = metadata.accounts ? metadata.accounts.length : 0;
    const institutionName = metadata.institution ? metadata.institution.name : 'your bank';
    
    showSuccess(`Successfully connected ${accountCount} account(s) from ${institutionName}!`);
}

// Skip bank connection
function skipBankConnection() {
    onboardingData.bankConnected = false;
    nextStep(3);
}

// Get current user ID
function getCurrentUserId() {
    const currentUser = JSON.parse(localStorage.getItem('ifi_current_user') || 'null');
    return currentUser ? currentUser.id : null;
}

// Step 1: Purpose listeners
function setupPurposeListeners() {
    const purposeInputs = document.querySelectorAll('input[name="purpose"]');
    purposeInputs.forEach(input => {
        input.addEventListener('change', function() {
            onboardingData.purpose = this.value;
            localStorage.setItem('ifi_purpose', this.value);
            configureStepsForPurpose(this.value);
        });
    });
}

// Step 2: Income listeners
function setupIncomeListeners() {
    const annualIncomeInput = document.getElementById('annual-income');
    const incomeSourceSelect = document.getElementById('income-source');
    const businessRevenue = document.getElementById('business-revenue');
    const businessType = document.getElementById('business-type');
    const riskRadios = document.querySelectorAll('input[name="riskTolerance"]');
    const investHorizon = document.getElementById('invest-horizon');
    const debtCredit = document.getElementById('debt-credit');
    const debtStudent = document.getElementById('debt-student');
    const debtAuto = document.getElementById('debt-auto');
    const debtOther = document.getElementById('debt-other');

    if (annualIncomeInput) {
        annualIncomeInput.addEventListener('input', function() {
            onboardingData.annualIncome = parseInt(this.value) || 0;
        });
    }

    if (incomeSourceSelect) {
        incomeSourceSelect.addEventListener('change', function() {
            onboardingData.incomeSource = this.value;
            // Immediately revert select styling by removing focus after selection
            setTimeout(() => this.blur(), 0);
        });
    }

    // Investing income fields
    const annualIncomeInvesting = document.getElementById('annual-income-investing');
    const incomeSourceInvesting = document.getElementById('income-source-investing');
    if (annualIncomeInvesting) {
        annualIncomeInvesting.addEventListener('input', function() {
            onboardingData.annualIncome = parseInt(this.value) || 0;
        });
    }
    if (incomeSourceInvesting) {
        incomeSourceInvesting.addEventListener('change', function() {
            onboardingData.incomeSource = this.value;
            setTimeout(() => this.blur(), 0);
        });
    }

    // Debt income fields
    const annualIncomeDebt = document.getElementById('annual-income-debt');
    const incomeSourceDebt = document.getElementById('income-source-debt');
    if (annualIncomeDebt) {
        annualIncomeDebt.addEventListener('input', function() {
            onboardingData.annualIncome = parseInt(this.value) || 0;
        });
    }
    if (incomeSourceDebt) {
        incomeSourceDebt.addEventListener('change', function() {
            onboardingData.incomeSource = this.value;
            setTimeout(() => this.blur(), 0);
        });
    }

    if (businessRevenue) {
        businessRevenue.addEventListener('input', function() {
            onboardingData.business = onboardingData.business || {};
            onboardingData.business.revenue = parseInt(this.value) || 0;
        });
    }
    if (businessType) {
        businessType.addEventListener('change', function() {
            onboardingData.business = onboardingData.business || {};
            onboardingData.business.type = this.value || null;
            setTimeout(() => this.blur(), 0);
        });
    }
    
    // Business Assets
    const assetFields = {
        cash: document.getElementById('asset-cash'),
        inventory: document.getElementById('asset-inventory'),
        equipment: document.getElementById('asset-equipment'),
        property: document.getElementById('asset-property'),
        other: document.getElementById('asset-other')
    };
    
    Object.keys(assetFields).forEach(key => {
        const field = assetFields[key];
        if (field) {
            field.addEventListener('input', function() {
                onboardingData.business = onboardingData.business || { assets: {}, liabilities: {} };
                onboardingData.business.assets = onboardingData.business.assets || {};
                onboardingData.business.assets[key] = parseInt(this.value) || 0;
            });
        }
    });
    
    // Business Liabilities
    const liabilityFields = {
        loan: document.getElementById('liability-loan'),
        payables: document.getElementById('liability-payables'),
        credit: document.getElementById('liability-credit'),
        other: document.getElementById('liability-other')
    };
    
    Object.keys(liabilityFields).forEach(key => {
        const field = liabilityFields[key];
        if (field) {
            field.addEventListener('input', function() {
                onboardingData.business = onboardingData.business || { assets: {}, liabilities: {} };
                onboardingData.business.liabilities = onboardingData.business.liabilities || {};
                onboardingData.business.liabilities[key] = parseInt(this.value) || 0;
            });
        }
    });
    
    if (riskRadios && riskRadios.length) {
        riskRadios.forEach(r => r.addEventListener('change', function() {
            onboardingData.investorProfile = onboardingData.investorProfile || {};
            onboardingData.investorProfile.riskTolerance = this.value;
        }));
    }
    if (investHorizon) {
        investHorizon.addEventListener('change', function() {
            onboardingData.investorProfile = onboardingData.investorProfile || {};
            onboardingData.investorProfile.horizon = this.value || null;
            setTimeout(() => this.blur(), 0);
        });
    }
    // Debts
    const updateDebts = () => {
        onboardingData.debts = {
            credit: parseInt(debtCredit?.value) || 0,
            student: parseInt(debtStudent?.value) || 0,
            auto: parseInt(debtAuto?.value) || 0,
            other: parseInt(debtOther?.value) || 0,
        };
    };
    [debtCredit, debtStudent, debtAuto, debtOther].forEach(el => {
        if (el) el.addEventListener('input', updateDebts);
    });
}

// Step 3: Expense listeners
function setupExpenseListeners() {
    const expenseInputs = {
        housing: document.getElementById('housing'),
        utilities: document.getElementById('utilities'),
        food: document.getElementById('food'),
        transportation: document.getElementById('transportation'),
        insurance: document.getElementById('insurance'),
        other: document.getElementById('other-expenses')
    };

    Object.keys(expenseInputs).forEach(key => {
        const input = expenseInputs[key];
        if (input) {
            input.addEventListener('input', function() {
                onboardingData.expenses[key] = parseInt(this.value) || 0;
                updateTotalExpenses();
            });
        }
    });

    // Investing expense inputs
    const expenseInputsInvesting = {
        housing: document.getElementById('housing-investing'),
        utilities: document.getElementById('utilities-investing'),
        food: document.getElementById('food-investing'),
        transportation: document.getElementById('transportation-investing'),
        insurance: document.getElementById('insurance-investing'),
        other: document.getElementById('other-expenses-investing')
    };

    Object.keys(expenseInputsInvesting).forEach(key => {
        const input = expenseInputsInvesting[key];
        if (input) {
            input.addEventListener('input', function() {
                onboardingData.expenses[key] = parseInt(this.value) || 0;
                updateTotalExpensesInvesting();
            });
        }
    });

    // Debt expense inputs
    const expenseInputsDebt = {
        housing: document.getElementById('housing-debt'),
        utilities: document.getElementById('utilities-debt'),
        food: document.getElementById('food-debt'),
        transportation: document.getElementById('transportation-debt'),
        insurance: document.getElementById('insurance-debt'),
        other: document.getElementById('other-expenses-debt')
    };

    Object.keys(expenseInputsDebt).forEach(key => {
        const input = expenseInputsDebt[key];
        if (input) {
            input.addEventListener('input', function() {
                onboardingData.expenses[key] = parseInt(this.value) || 0;
                updateTotalExpensesDebt();
            });
        }
    });
}

// Update total expenses display
function updateTotalExpenses() {
    const total = Object.values(onboardingData.expenses).reduce((sum, val) => sum + val, 0);
    const totalElement = document.getElementById('total-expenses');
    if (totalElement) {
        totalElement.textContent = `$${total.toLocaleString()}`;
    }
}

function updateTotalExpensesInvesting() {
    const total = Object.values(onboardingData.expenses).reduce((sum, val) => sum + val, 0);
    const totalElement = document.getElementById('total-expenses-investing');
    if (totalElement) {
        totalElement.textContent = `$${total.toLocaleString()}`;
    }
}

function updateTotalExpensesDebt() {
    const total = Object.values(onboardingData.expenses).reduce((sum, val) => sum + val, 0);
    const totalElement = document.getElementById('total-expenses-debt');
    if (totalElement) {
        totalElement.textContent = `$${total.toLocaleString()}`;
    }
}

// Step 4: Investment listeners
function setupInvestmentListeners() {
    const investmentCheckboxes = document.querySelectorAll('input[name="investments"]');
    const portfolioValueInput = document.getElementById('portfolio-value');
    const debtStrategyRadios = document.querySelectorAll('input[name="debtStrategy"]');
    const investGoalCheckboxes = document.querySelectorAll('input[name="investGoals"]');

    investmentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!onboardingData.investments.includes(this.value)) {
                    onboardingData.investments.push(this.value);
                }
            } else {
                onboardingData.investments = onboardingData.investments.filter(inv => inv !== this.value);
            }
        });
    });

    if (portfolioValueInput) {
        portfolioValueInput.addEventListener('input', function() {
            onboardingData.portfolioValue = parseInt(this.value) || null;
        });
    }

    if (debtStrategyRadios && debtStrategyRadios.length) {
        debtStrategyRadios.forEach(r => r.addEventListener('change', function() {
            onboardingData.debtStrategy = this.value;
        }));
    }
    if (investGoalCheckboxes && investGoalCheckboxes.length) {
        investGoalCheckboxes.forEach(cb => cb.addEventListener('change', function() {
            onboardingData.investGoals = onboardingData.investGoals || [];
            if (this.checked) {
                if (!onboardingData.investGoals.includes(this.value)) onboardingData.investGoals.push(this.value);
            } else {
                onboardingData.investGoals = onboardingData.investGoals.filter(v => v !== this.value);
            }
        }));
    }
}

// Navigation functions
function nextStep(stepNumber) {
    // Validate current step before proceeding
    const currentStep = stepNumber - 1;
    
    if (currentStep === 1) {
        if (!onboardingData.purpose) {
            showError('Please select your primary reason for using iFi');
            return;
        }
    }
    
    if (currentStep === 2) {
        const p = onboardingData.purpose;
        // Validate income for all purposes except business
        if (p === 'personal' || p === 'investing' || p === 'debt') {
            if (onboardingData.annualIncome === null || onboardingData.annualIncome === undefined) {
                showError('Please enter your annual income');
                return;
            }
            if (!onboardingData.incomeSource) {
                showError('Please select your primary income source');
                return;
            }
        }
        if (p === 'personal') {
            if (onboardingData.annualIncome === null || onboardingData.annualIncome === undefined) { showError('Please enter your annual income'); return; }
            if (!onboardingData.incomeSource) { showError('Please select your income source'); return; }
        } else if (p === 'business') {
            if (!onboardingData.business || onboardingData.business.revenue === null || onboardingData.business.revenue === undefined) { 
                showError('Please enter your monthly business revenue'); 
                return; 
            }
            if (!onboardingData.business.type) { 
                showError('Please select your business type'); 
                return; 
            }
            // Validate at least some asset or liability data is entered
            const assets = onboardingData.business.assets || {};
            const liabilities = onboardingData.business.liabilities || {};
            const hasAssetData = Object.values(assets).some(val => val !== null && val !== undefined);
            const hasLiabilityData = Object.values(liabilities).some(val => val !== null && val !== undefined);
            if (!hasAssetData && !hasLiabilityData) { 
                showError('Please enter at least one asset or liability amount'); 
                return; 
            }
        } else if (p === 'investing') {
            if (!onboardingData.investorProfile || !onboardingData.investorProfile.riskTolerance) { showError('Please choose a risk tolerance'); return; }
        } else if (p === 'debt') {
            const d = onboardingData.debts || {};
            const hasDebtData = Object.values(d).some(val => val !== null && val !== undefined && val !== 0);
            if (!hasDebtData) { showError('Please enter at least one debt amount'); return; }
        }
    }
    
    // Move to next step
    const currentContent = document.querySelector('.step-content.active');
    const nextContent = document.getElementById(`step-${stepNumber}`);
    
    if (currentContent) currentContent.classList.remove('active');
    if (nextContent) nextContent.classList.add('active');
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(stepNumber) {
    const currentContent = document.querySelector('.step-content.active');
    const prevContent = document.getElementById(`step-${stepNumber}`);
    
    if (currentContent) currentContent.classList.remove('active');
    if (prevContent) prevContent.classList.add('active');
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar(activeStep) {
    const steps = document.querySelectorAll('.progress-step');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum === activeStep) {
            step.classList.add('active');
        } else if (stepNum < activeStep) {
            step.classList.add('completed');
            // Change circle content to checkmark for completed steps
            const circle = step.querySelector('.step-circle');
            if (circle && !circle.querySelector('i')) {
                circle.innerHTML = '<i class="fas fa-check"></i>';
            }
        } else {
            // Reset future steps
            const circle = step.querySelector('.step-circle');
            if (circle) {
                circle.textContent = stepNum;
            }
        }
    });
}

// Configure which sections are shown based on purpose
function configureStepsForPurpose(purpose) {
    // Step 2
    const step2Title = document.getElementById('step2-title');
    const step2Subtitle = document.getElementById('step2-subtitle');
    const show = (id, vis) => { const el = document.getElementById(id); if (el) el.style.display = vis ? '' : 'none'; };
    show('step2-personal', purpose === 'personal' || !purpose);
    show('step2-business', purpose === 'business');
    show('step2-investing', purpose === 'investing');
    show('step2-debt', purpose === 'debt');
    if (purpose === 'personal' || !purpose) { step2Title.textContent = 'Annual Income'; step2Subtitle.textContent = 'Help us understand your financial situation'; }
    if (purpose === 'business') { step2Title.textContent = 'Business Income'; step2Subtitle.textContent = 'Tell us about your business revenue'; }
    if (purpose === 'investing') { step2Title.textContent = 'Investment Profile'; step2Subtitle.textContent = 'We’ll tailor insights to your style'; }
    if (purpose === 'debt') { step2Title.textContent = 'Your Debts'; step2Subtitle.textContent = 'We’ll help you plan a payoff path'; }

    // Step 3
    const step3Title = document.getElementById('step3-title');
    const step3Subtitle = document.getElementById('step3-subtitle');
    show('step3-expenses', purpose === 'personal' || purpose === 'business' || !purpose);
    show('step3-investing-goals', purpose === 'investing');
    show('step3-debt-strategy', purpose === 'debt');
    if (purpose === 'investing') { step3Title.textContent = 'Investing Goals'; step3Subtitle.textContent = 'Priorities to guide recommendations'; }
    else if (purpose === 'debt') { step3Title.textContent = 'Payoff Strategy'; step3Subtitle.textContent = 'Choose your preferred method'; }
    else if (purpose === 'business') { step3Title.textContent = 'Monthly Business Expenses'; step3Subtitle.textContent = 'Map out your typical spending'; document.getElementById('step3-expenses-title').textContent = 'What are your average monthly business expenses?'; document.getElementById('step3-expenses-hint').textContent = 'Break down your typical monthly business costs'; }
    else { step3Title.textContent = 'Monthly Expenses'; step3Subtitle.textContent = 'Let\'s map out your spending'; document.getElementById('step3-expenses-title').textContent = 'What are your average monthly expenses?'; document.getElementById('step3-expenses-hint').textContent = 'Break down your typical monthly spending'; }
}

// Complete onboarding
async function completeOnboarding() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('ifi_current_user'));
        
        if (!currentUser || !currentUser.id) {
            showError('User session not found. Please log in again.');
            setTimeout(() => window.location.href = '../html/Login.html', 2000);
            return;
        }

        // Prepare data for submission
        const submissionData = {
            userId: currentUser.id,
            ...onboardingData,
            completedAt: new Date().toISOString()
        };

        // Save to localStorage for now (will also send to backend)
        localStorage.setItem('ifi_onboarding_data', JSON.stringify(submissionData));
        
        // TODO: Send to backend API
        // const response = await fetch(`${API_URL}/onboarding`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(submissionData)
        // });

        // Mark onboarding as complete
        localStorage.setItem('ifi_onboarding_complete', 'true');
        
        // Show success message
        showSuccess('Setup complete! Redirecting to your personalized dashboard...');
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            window.location.href = '../html/dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Onboarding error:', error);
        showError('Failed to save your preferences. Please try again.');
    }
}

// Error and success messages
function showError(message) {
    // Remove existing messages
    const existing = document.querySelector('.message-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'message-banner error';
    banner.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(231,76,60,0.4);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
        banner.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => banner.remove(), 300);
    }, 3000);
}

function showSuccess(message) {
    const existing = document.querySelector('.message-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'message-banner success';
    banner.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(46,204,113,0.4);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(banner);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
