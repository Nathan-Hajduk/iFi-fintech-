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
    incomeSource: null,
    monthlyTakehome: null,
    annualIncome: null,
    additionalIncome: [],
    expenses: {
        housing: 0,
        utilities: 0,
        food: 0,
        transportation: 0,
        insurance: 0,
        other: 0
    },
    expenseCategories: [],
    subscriptions: [],
    assets: [],
    investments: [],
    portfolioValue: null,
    debts: [],
    selectedPlan: null,
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
    console.log('Onboarding: DOMContentLoaded fired');
    
    try {
        // Wait a moment for authManager to fully initialize from localStorage
        setTimeout(() => {
            console.log('Onboarding: Checking authentication...');
            console.log('authManager exists:', !!authManager);
            console.log('authManager.isAuthenticated():', authManager ? authManager.isAuthenticated() : 'N/A');
            console.log('authManager.user:', authManager ? authManager.user : 'N/A');
            console.log('authManager.accessToken:', authManager ? (authManager.accessToken ? 'EXISTS' : 'MISSING') : 'N/A');
            
            // Check if user is logged in using authManager
            if (!authManager || !authManager.isAuthenticated()) {
                console.log('User not authenticated, redirecting to login');
                window.location.href = '../html/Login.html';
                return;
            }
            
            const currentUser = authManager.user;
            if (!currentUser) {
                console.log('No user data found, redirecting to login');
                window.location.href = '../html/Login.html';
                return;
            }

            console.log('Authentication successful! User:', currentUser.email || currentUser.username);

            // Set up event listeners
            console.log('About to call setupPurposeListeners...');
            setupPurposeListeners();
            console.log('setupPurposeListeners called successfully');
            setupIncomeListeners();
            setupExpenseListeners();
            setupInvestmentListeners();
            
            // Initialize Plaid Link handler on page load
            createPlaidLinkHandler();
        }, 100); // Small delay to ensure authManager is fully loaded
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        // Still set up listeners even if auth fails for testing
        setTimeout(() => {
            console.log('Setting up listeners despite auth error...');
            setupPurposeListeners();
            setupIncomeListeners();
            setupExpenseListeners();
            setupInvestmentListeners();
        }, 200);
    }
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
    if (!authManager || !authManager.user) {
        console.error('authManager or user not available');
        return null;
    }
    // Use user_id from authManager's user object
    return authManager.user.user_id || authManager.user.userId || null;
}

// Step 1: Purpose listeners
function setupPurposeListeners() {
    const purposeInputs = document.querySelectorAll('input[name="purpose"]');
    const optionCards = document.querySelectorAll('.option-card');
    
    console.log('Setting up purpose listeners. Found:', purposeInputs.length, 'inputs and', optionCards.length, 'cards');
    
    purposeInputs.forEach(input => {
        input.addEventListener('change', function() {
            console.log('Purpose selected:', this.value);
            // Remove selected class from all cards
            optionCards.forEach(card => card.classList.remove('selected'));
            
            // Add selected class to the parent card
            const parentCard = this.closest('.option-card');
            if (parentCard) {
                parentCard.classList.add('selected');
                console.log('Added selected class to card');
            }
            
            // Store the purpose
            onboardingData.purpose = this.value;
            localStorage.setItem('ifi_purpose', this.value);
            configureStepsForPurpose(this.value);
        });
    });
    
    // Also add click listeners directly to the cards
    optionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            console.log('Card clicked');
            const input = this.querySelector('input[name="purpose"]');
            if (input && !input.checked) {
                input.checked = true;
                input.dispatchEvent(new Event('change'));
            }
        });
    });
}

// Direct selection function for onclick handlers
function selectPurpose(value, cardElement) {
    console.log('selectPurpose called with value:', value);
    
    // Remove selected class from all cards
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    cardElement.classList.add('selected');
    
    // Find and check the radio input
    const input = cardElement.querySelector('input[name="purpose"]');
    if (input) {
        input.checked = true;
        console.log('Radio input checked:', input.value);
    }
    
    // Store the purpose
    onboardingData.purpose = value;
    localStorage.setItem('ifi_purpose', value);
    
    console.log('Purpose stored:', onboardingData.purpose);
    configureStepsForPurpose(value);
}

// Investment type multi-select function
function toggleInvestmentType(value, cardElement) {
    const checkbox = cardElement.querySelector('input[type="checkbox"]');
    
    // Toggle checkbox state
    checkbox.checked = !checkbox.checked;
    
    // Toggle selected class on card
    if (checkbox.checked) {
        cardElement.classList.add('selected');
    } else {
        cardElement.classList.remove('selected');
    }
    
    console.log('Investment type toggled:', value, 'checked:', checkbox.checked);
}

// Plan selection function for Step 5
function selectPlan(planType, cardElement) {
    console.log('selectPlan called with planType:', planType);
    
    // Remove selected class from all pricing cards
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    cardElement.classList.add('selected');
    
    // Find and check the radio input
    const input = cardElement.querySelector('input[name="plan"]');
    if (input) {
        input.checked = true;
        console.log('Plan radio input checked:', input.value);
    }
    
    // Store the selected plan
    onboardingData.selectedPlan = planType;
    localStorage.setItem('ifi_selected_plan', planType);
    
    console.log('Selected plan stored:', onboardingData.selectedPlan);
    
    // If paid plan selected, show payment modal
    if (planType === 'monthly' || planType === 'annual') {
        const planNames = {
            monthly: 'iFi+ Monthly',
            annual: 'iFi+ Annual'
        };
        const amounts = {
            monthly: '9.99',
            annual: '95.88'
        };
        
        // Initialize payment
        if (typeof initializePayment === 'function') {
            initializePayment(planType, planNames[planType], amounts[planType]);
        } else {
            console.error('Payment module not loaded');
            showError('Payment system not available. Please refresh the page.');
        }
    }
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
    
    // Step 2 is now just the Plaid "coming soon" informational page - no validation needed
    
    // If leaving step 3, save all debt data
    if (currentStep === 3) {
        // Save debt data
        const debts = [];
        const debtEntries = document.querySelectorAll('.debt-entry');
        debtEntries.forEach(entry => {
            const type = entry.querySelector('.debt-type')?.value;
            const amount = parseFloat(entry.querySelector('.debt-amount')?.value || 0);
            const rate = parseFloat(entry.querySelector('.debt-rate')?.value || 0);
            const payment = parseFloat(entry.querySelector('.debt-payment')?.value || 0);
            
            if (type && amount > 0) {
                debts.push({ type, amount, rate, payment });
            }
        });
        onboardingData.debts = debts;
        console.log('Debt data saved:', onboardingData.debts);
    }
    
    // Move to next step
    const currentContent = document.querySelector('.step-content.active');
    const nextContent = document.getElementById(`step-${stepNumber}`);
    
    if (currentContent) currentContent.classList.remove('active');
    if (nextContent) nextContent.classList.add('active');
    
    // Initialize Step 3 when entering
    if (stepNumber === 3 && typeof initializeStep3 === 'function') {
        initializeStep3();
    }
    
    // Initialize Step 4 when entering - show purpose-specific questions
    if (stepNumber === 4 && onboardingData.purpose) {
        showPurposeSpecificQuestions(onboardingData.purpose);
    }
    
    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
    // Get current active step
    const currentContent = document.querySelector('.step-content.active');
    if (!currentContent) return;
    
    // Extract current step number from id (e.g., "step-3" -> 3)
    const currentStepId = currentContent.id;
    const currentStepNum = parseInt(currentStepId.split('-')[1]);
    
    // If leaving step 3, reset the form
    if (currentStepNum === 3) {
        resetStep3Form();
    }
    
    // Calculate previous step
    const prevStepNum = currentStepNum - 1;
    
    // Don't go back if we're on the first step
    if (prevStepNum < 1) return;
    
    const prevContent = document.getElementById(`step-${prevStepNum}`);
    
    if (currentContent) currentContent.classList.remove('active');
    if (prevContent) prevContent.classList.add('active');
    
    // Update progress bar
    updateProgressBar(prevStepNum);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset Step 3 form to original state
function resetStep3Form() {
    // Reset income section
    cancelAdditionalIncome();
    document.getElementById('income-source').value = '';
    document.getElementById('monthly-takehome').value = '';
    
    // Reset expenses section
    cancelExpenses();
    
    // Hide all sections except income
    const sections = ['expenses-section', 'assets-section', 'debt-section', 'investments-section', 'additional-details-section'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('revealed', 'completed', 'active-subsection');
            section.style.display = 'none';
        }
    });
    
    // Reset income section state and show it
    const incomeSection = document.getElementById('income-section');
    if (incomeSection) {
        incomeSection.classList.remove('completed');
        incomeSection.classList.add('active-subsection');
        incomeSection.style.display = 'block';
    }
    
    // Reset step 3 header
    const titleElement = document.getElementById('step3-title');
    const subtitleElement = document.getElementById('step3-subtitle');
    if (titleElement) titleElement.textContent = 'Income';
    if (subtitleElement) subtitleElement.textContent = 'Tell us about your income sources';
}

// Navigate between sections within Step 3
function navigateToSection(sectionName) {
    // Hide all sections
    const allSections = document.querySelectorAll('.financial-section');
    allSections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-subsection');
    });
    
    // Show the target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active-subsection');
        
        // Scroll to top of section
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update header based on section
        updateStep3Header(sectionName);
    }
}

// Update Step 3 header based on current section
function updateStep3Header(sectionName) {
    const titleElement = document.getElementById('step3-title');
    const subtitleElement = document.getElementById('step3-subtitle');
    
    const headers = {
        'income': { title: 'Income', subtitle: 'Tell us about your income sources' },
        'expenses': { title: 'Expenses', subtitle: 'Track your monthly spending' },
        'assets': { title: 'Assets', subtitle: 'What assets and savings do you have?' },
        'debt': { title: 'Debt', subtitle: 'Tell us about any outstanding debts' },
        'investments': { title: 'Investments', subtitle: 'Track your investment portfolio' },
        'additional': { title: 'Additional Details', subtitle: 'Help us understand your spending patterns better' }
    };
    
    if (headers[sectionName]) {
        if (titleElement) titleElement.textContent = headers[sectionName].title;
        if (subtitleElement) subtitleElement.textContent = headers[sectionName].subtitle;
    }
}

// Complete Step 3 and move to Step 4
function completeStep3() {
    nextStep(4);
}

// Complete Step 3 and proceed to Step 4 with purpose-specific questions
function completeStep3AndProceed() {
    console.log('Completing Step 3 and moving to Step 4');
    
    // Hide step 3
    const step3 = document.getElementById('step-3');
    if (step3) step3.classList.remove('active');
    
    // Show step 4
    const step4 = document.getElementById('step-4');
    if (step4) step4.classList.add('active');
    
    // Update progress bar
    updateProgressBar(4);
    
    // Show the appropriate questions based on purpose
    const purpose = onboardingData.purpose || localStorage.getItem('ifi_purpose');
    console.log('Loading Step 4 questions for purpose:', purpose);
    showStep4Questions(purpose);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show Step 4 questions based on selected purpose
function showStep4Questions(purpose) {
    // Hide all purpose sections
    const allPurposeSections = document.querySelectorAll('.purpose-section');
    allPurposeSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Update header based on purpose
    const titleElement = document.getElementById('step4-title');
    const subtitleElement = document.getElementById('step4-subtitle');
    
    let sectionToShow = '';
    
    switch(purpose) {
        case 'personal':
            sectionToShow = 'step4-personal';
            if (titleElement) titleElement.textContent = 'Personal Finance Insights';
            if (subtitleElement) subtitleElement.textContent = 'Help us understand your financial priorities';
            break;
        case 'goals':
            sectionToShow = 'step4-goals';
            if (titleElement) titleElement.textContent = 'Your Financial Goals';
            if (subtitleElement) subtitleElement.textContent = 'Tell us about your long-term objectives';
            break;
        case 'investing':
            sectionToShow = 'step4-investing';
            if (titleElement) titleElement.textContent = 'Investment Strategy';
            if (subtitleElement) subtitleElement.textContent = 'Help us tailor investment recommendations';
            break;
        case 'debt':
            sectionToShow = 'step4-debt';
            if (titleElement) titleElement.textContent = 'Debt Payoff Strategy';
            if (subtitleElement) subtitleElement.textContent = 'Let\'s create a plan to tackle your debt';
            break;
        default:
            sectionToShow = 'step4-personal';
            if (titleElement) titleElement.textContent = 'Tell Us More';
            if (subtitleElement) subtitleElement.textContent = 'Answer a few questions to personalize your experience';
    }
    
    // Show the appropriate section
    const targetSection = document.getElementById(sectionToShow);
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log('Showing section:', sectionToShow);
    } else {
        console.error('Could not find section:', sectionToShow);
    }
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

// Navigate to a specific step from progress bar (only completed or active steps)
function navigateToStep(targetStep) {
    const targetStepElement = document.querySelector(`.progress-step[data-step="${targetStep}"]`);
    
    // Only allow navigation to completed steps or the current active step
    if (!targetStepElement) {
        console.log('Target step element not found');
        return;
    }
    
    const isCompleted = targetStepElement.classList.contains('completed');
    const isActive = targetStepElement.classList.contains('active');
    
    if (!isCompleted && !isActive) {
        console.log('Cannot navigate to incomplete step');
        return;
    }
    
    // Hide current step content
    const currentContent = document.querySelector('.step-content.active');
    if (currentContent) currentContent.classList.remove('active');
    
    // Show target step content
    const targetContent = document.getElementById(`step-${targetStep}`);
    if (targetContent) targetContent.classList.add('active');
    
    // Re-initialize Step 3 if navigating to it
    if (targetStep === 3 && typeof initializeStep3 === 'function') {
        initializeStep3();
    }
    
    // Re-initialize Step 4 if navigating to it
    if (targetStep === 4 && onboardingData.purpose) {
        showPurposeSpecificQuestions(onboardingData.purpose);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`Navigated to step ${targetStep}`);
}

// Configure which sections are shown based on purpose
function configureStepsForPurpose(purpose) {
    // Helper to show/hide sections
    const show = (id, vis) => { 
        const el = document.getElementById(id); 
        if (el) el.style.display = vis ? '' : 'none'; 
    };

    // Step 3 - General
    const step3Title = document.getElementById('step3-title');
    const step3Subtitle = document.getElementById('step3-subtitle');
    show('step3-personal', purpose === 'personal' || !purpose);
    show('step3-goals', purpose === 'goals');
    show('step3-investing', purpose === 'investing');
    show('step3-debt', purpose === 'debt');
    
    if (purpose === 'personal' || !purpose) { 
        step3Title.textContent = 'General'; 
        step3Subtitle.textContent = 'Help us understand your current situation'; 
    }
    if (purpose === 'goals') { 
        step3Title.textContent = 'General'; 
        step3Subtitle.textContent = 'Financial metrics to track your goals'; 
    }
    if (purpose === 'investing') { 
        step3Title.textContent = 'General'; 
        step3Subtitle.textContent = 'Your portfolio and retirement planning'; 
    }
    if (purpose === 'debt') { 
        step3Title.textContent = 'General'; 
        step3Subtitle.textContent = 'We\'ll help you plan a payoff path'; 
    }

    // Step 4 - Additional
    const step4Title = document.getElementById('step4-title');
    const step4Subtitle = document.getElementById('step4-subtitle');
    show('step4-personal', purpose === 'personal' || !purpose);
    show('step4-goals', purpose === 'goals');
    show('step4-investing', purpose === 'investing');
    show('step4-debt', purpose === 'debt');
    
    if (purpose === 'personal' || !purpose) { 
        step4Title.textContent = 'Additional'; 
        step4Subtitle.textContent = 'Understanding your spending helps us create better recommendations'; 
    }
    if (purpose === 'goals') { 
        step4Title.textContent = 'Additional'; 
        step4Subtitle.textContent = 'Your monthly financial activities'; 
    }
    if (purpose === 'investing') { 
        step4Title.textContent = 'Additional'; 
        step4Subtitle.textContent = 'How your investments are distributed'; 
    }
    if (purpose === 'debt') { 
        step4Title.textContent = 'Additional'; 
        step4Subtitle.textContent = 'Understanding your baseline for debt payoff planning'; 
    }
}

// Collect all Step 4 data based on purpose
function collectStep4Data() {
    const purpose = onboardingData.purpose;
    const step4Data = {};
    
    // Helper function to safely get value
    const getValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value : null;
    };
    
    // Helper function to get checkbox values
    const getCheckboxValues = (name) => {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    };
    
    // Collect based on purpose
    if (purpose === 'personal') {
        step4Data.spendingHabit = getValue('spending-habit');
        step4Data.emergencyFund = getValue('emergency-fund');
        step4Data.savingsPriority = getValue('savings-priority');
        step4Data.financialConcern = getValue('financial-concern');
        step4Data.trackingMethod = getValue('tracking-method');
        step4Data.budgetAdjustFrequency = getValue('budget-adjust-frequency');
    }
    
    if (purpose === 'goals') {
        step4Data.primaryGoal = getValue('primary-goal');
        step4Data.goalTimeline = getValue('goal-timeline');
        step4Data.goalAmount = getValue('goal-amount');
        step4Data.currentProgress = getValue('current-progress');
        step4Data.monthlyContribution = getValue('monthly-contribution');
        step4Data.goalPriority = getValue('goal-priority');
    }
    
    if (purpose === 'investing') {
        step4Data.investExperience = getValue('invest-experience');
        step4Data.investObjective = getValue('invest-objective');
        step4Data.investmentTypes = getCheckboxValues('investmentTypes');
        step4Data.riskTolerance = getValue('risk-tolerance');
        step4Data.investHorizon = getValue('invest-horizon');
        step4Data.portfolioReview = getValue('portfolio-review');
    }
    
    if (purpose === 'debt') {
        step4Data.debtStress = getValue('debt-stress');
        step4Data.payoffStrategy = getValue('payoff-strategy');
        step4Data.additionalPayments = getValue('additional-payments');
        step4Data.debtConsolidation = getValue('debt-consolidation');
        step4Data.debtAutoPrioritize = getValue('debt-auto-prioritize');
        step4Data.debtMissedPayments = getValue('debt-missed-payments');
    }
    
    return step4Data;
}

// Complete onboarding
async function completeOnboarding() {
    try {
        // Check if a plan has been selected
        if (!onboardingData.selectedPlan) {
            showError('Please select a plan to continue.');
            return;
        }
        
        const currentUser = authManager.user;
        const accessToken = authManager.accessToken;
        
        console.log('=== AUTH CHECK ===');
        console.log('Has User:', !!currentUser);
        console.log('Has Token:', !!accessToken);
        console.log('Token Preview:', accessToken ? accessToken.substring(0, 30) + '...' : 'null');
        console.log('User Object:', currentUser);
        
        if (!currentUser || !accessToken) {
            showError('User session not found. Please log in again.');
            setTimeout(() => window.location.href = '../html/Login.html', 2000);
            return;
        }

        // Collect Step 4 responses (purpose-specific questions)
        const step4Responses = collectStep4Data();

        // Calculate totals
        const totalExpenses = Object.values(onboardingData.expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const totalDebts = (onboardingData.debts || []).reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
        const totalAssets = (onboardingData.assets || []).reduce((sum, asset) => sum + (parseFloat(asset.amount) || 0), 0);

        // Prepare comprehensive data for submission
        const submissionData = {
            // Legacy fields for backward compatibility
            employment_status: onboardingData.incomeSource || 'employed',
            annual_income: onboardingData.annualIncome || onboardingData.monthlyTakehome * 12,
            monthly_expenses: totalExpenses,
            debt_amount: totalDebts,
            savings_goal: 10000,
            investment_experience: step4Responses.investExperience || 'beginner',
            risk_tolerance: step4Responses.riskTolerance || 'moderate',
            financial_goals: onboardingData.purpose || 'personal',
            
            // New comprehensive fields
            purpose: onboardingData.purpose,
            income_source: onboardingData.incomeSource,
            monthly_takehome: onboardingData.monthlyTakehome,
            additional_income: onboardingData.additionalIncome || [],
            expenses: onboardingData.expenses,
            expense_categories: onboardingData.expenseCategories || [],
            subscriptions: onboardingData.subscriptions || [],
            assets: onboardingData.assets || [],
            total_assets_value: totalAssets,
            investments: onboardingData.investments || [],
            portfolio_value: onboardingData.portfolioValue,
            debts: onboardingData.debts || [],
            total_debt_amount: totalDebts,
            selected_plan: onboardingData.selectedPlan,
            step4_responses: step4Responses,
            bank_connected: onboardingData.bankConnected || false,
            plaid_item_id: onboardingData.plaidAccessToken,
            linked_accounts: onboardingData.linkedAccounts || []
        };

        console.log('Submitting onboarding data:', submissionData);

        // Send to backend API
        const response = await fetch(`${API_URL}/user/onboarding`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(submissionData)
        });

        console.log('=== RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        let errorData;
        try {
            errorData = await response.json();
            console.log('Response Body:', JSON.stringify(errorData, null, 2));
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error('Server returned invalid response');
        }

        if (!response.ok) {
            throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        }

        const result = errorData;
        console.log('Onboarding saved successfully:', result);
        
        // Save to localStorage as backup
        localStorage.setItem('ifi_onboarding_data', JSON.stringify(submissionData));
        localStorage.setItem('ifi_onboarding_complete', 'true');
        
        // Show vault loading screen
        showVaultLoadingScreen();
        
        // Redirect to dashboard after animation completes (8 seconds)
        setTimeout(() => {
            window.location.href = '../html/dashboard.html';
        }, 8000);
        
    } catch (error) {
        console.error('Onboarding error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Failed to save your preferences. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Cannot connect to server. Please make sure the backend is running on port 3000.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage += 'Your session has expired. Please log in again.';
            setTimeout(() => window.location.href = '../html/Login.html', 2000);
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Please try again or contact support.';
        }
        
        showError(errorMessage);
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

// Vault Loading Screen
function showVaultLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'vault-loading-screen';
    loadingScreen.innerHTML = `
        <div class="vault-container">
            <div class="vault-lock">
                <svg width="120" height="120" viewBox="0 0 120 120" class="lock-svg">
                    <!-- Lock body -->
                    <rect x="35" y="60" width="50" height="45" rx="5" fill="none" stroke="#00d4ff" stroke-width="3" class="lock-body"/>
                    
                    <!-- Lock shackle -->
                    <path d="M 45 60 L 45 40 Q 45 25, 60 25 Q 75 25, 75 40 L 75 60" 
                          fill="none" stroke="#00d4ff" stroke-width="3" class="lock-shackle"/>
                    
                    <!-- Keyhole -->
                    <circle cx="60" cy="80" r="6" fill="#00d4ff" opacity="0.5" class="keyhole"/>
                    <rect x="57" y="80" width="6" height="12" fill="#00d4ff" opacity="0.5" class="keyhole"/>
                    
                    <!-- Animated connection lines -->
                    <line x1="60" y1="15" x2="60" y2="5" class="vault-line line-1" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="85" y1="25" x2="95" y2="15" class="vault-line line-2" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="95" y1="60" x2="105" y2="60" class="vault-line line-3" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="85" y1="95" x2="95" y2="105" class="vault-line line-4" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="60" y1="105" x2="60" y2="115" class="vault-line line-5" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="35" y1="95" x2="25" y2="105" class="vault-line line-6" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="25" y1="60" x2="15" y2="60" class="vault-line line-7" stroke="#00d4ff" stroke-width="2"/>
                    <line x1="35" y1="25" x2="25" y2="15" class="vault-line line-8" stroke="#00d4ff" stroke-width="2"/>
                    
                    <!-- Connection dots -->
                    <circle cx="60" cy="5" r="3" class="vault-dot dot-1" fill="#00d4ff"/>
                    <circle cx="95" cy="15" r="3" class="vault-dot dot-2" fill="#00d4ff"/>
                    <circle cx="105" cy="60" r="3" class="vault-dot dot-3" fill="#00d4ff"/>
                    <circle cx="95" cy="105" r="3" class="vault-dot dot-4" fill="#00d4ff"/>
                    <circle cx="60" cy="115" r="3" class="vault-dot dot-5" fill="#00d4ff"/>
                    <circle cx="25" cy="105" r="3" class="vault-dot dot-6" fill="#00d4ff"/>
                    <circle cx="15" cy="60" r="3" class="vault-dot dot-7" fill="#00d4ff"/>
                    <circle cx="25" cy="15" r="3" class="vault-dot dot-8" fill="#00d4ff"/>
                </svg>
            </div>
            <div class="vault-text">
                <h2 id="vaultStatusText">Securing your data...</h2>
                <p id="vaultSubText">Analyzing your financial profile</p>
                <div class="vault-progress">
                    <div class="vault-progress-bar"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Animate text changes
    const statusTexts = [
        { status: 'Securing your data...', sub: 'Analyzing your financial profile' },
        { status: 'Calculating metrics...', sub: 'Processing income and expenses' },
        { status: 'Generating insights...', sub: 'Creating personalized recommendations' },
        { status: 'Building dashboard...', sub: 'Preparing visualizations' },
        { status: 'Almost ready...', sub: 'Get ready to be amazed!' }
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
        textIndex++;
        if (textIndex < statusTexts.length) {
            document.getElementById('vaultStatusText').textContent = statusTexts[textIndex].status;
            document.getElementById('vaultSubText').textContent = statusTexts[textIndex].sub;
        } else {
            clearInterval(textInterval);
        }
    }, 1600);
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

// ============================================
// STEP 4: PURPOSE-SPECIFIC QUESTIONS
// ============================================
function showPurposeSpecificQuestions(purpose) {
    // Hide all purpose sections first
    const allSections = document.querySelectorAll('#step-4 .purpose-section');
    allSections.forEach(section => section.style.display = 'none');
    
    // Map purpose to section ID
    let sectionId = '';
    let title = '';
    let subtitle = '';
    
    switch(purpose) {
        case 'personal':
            sectionId = 'step4-personal';
            title = 'Personal Finance Goals';
            subtitle = 'Help us understand your personal financial goals';
            break;
        case 'goals':
        case 'business':
            sectionId = 'step4-goals';
            title = 'Business Financial Goals';
            subtitle = 'Tell us about your business financial needs';
            break;
        case 'investing':
            sectionId = 'step4-investing';
            title = 'Investment Goals';
            subtitle = 'Share your investment strategy and goals';
            break;
        case 'debt':
            sectionId = 'step4-debt';
            title = 'Debt Management Goals';
            subtitle = 'Let\'s create a plan to manage your debt';
            break;
        default:
            sectionId = 'step4-personal';
            title = 'Tell Us More';
            subtitle = 'Help us personalize your experience';
    }
    
    // Show the appropriate section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
    
    // Update header
    const titleElement = document.getElementById('step4-title');
    const subtitleElement = document.getElementById('step4-subtitle');
    if (titleElement) titleElement.textContent = title;
    if (subtitleElement) subtitleElement.textContent = subtitle;
}

// Show additional income fields
let incomeEntryCounter = 0;

function showAdditionalIncomeFields() {
    const fieldsContainer = document.getElementById('additional-income-fields');
    const buttonsContainer = document.getElementById('additional-income-buttons');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'block';
        // Add first income entry automatically
        addIncomeEntry();
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
}

// Add a new income entry
function addIncomeEntry() {
    incomeEntryCounter++;
    const entriesContainer = document.getElementById('additional-income-entries');
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'income-entry';
    entryDiv.id = `income-entry-${incomeEntryCounter}`;
    entryDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); position: relative;';
    
    entryDiv.innerHTML = `
        <button type="button" onclick="removeIncomeEntry(${incomeEntryCounter})" 
                style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.875rem; transition: all 0.2s;">
            <i class="fas fa-trash"></i> Remove
        </button>
        
        <div class="form-group" style="margin-top: 1.5rem;">
            <label>Source Type</label>
            <select name="additionalIncomeSource[]" class="additional-income-source">
                <option value="">Select source...</option>
                <option value="side-hustle">Side Hustle/Gig Work</option>
                <option value="rental">Rental Income</option>
                <option value="investments">Dividends/Interest</option>
                <option value="freelance">Freelance Work</option>
                <option value="alimony">Alimony/Child Support</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="form-group">
            <label>Monthly Amount</label>
            <input type="number" name="additionalIncomeAmount[]" class="additional-income-amount" min="0" step="1">
            <small style="color: rgba(139, 192, 223, 0.85);">Average monthly income from this source</small>
        </div>

        <div class="form-group">
            <label>Income Frequency</label>
            <select name="additionalIncomeFrequency[]" class="additional-income-frequency">
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
            </select>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    
    // Add hover effect to remove button
    const removeBtn = entryDiv.querySelector('button[onclick^="removeIncomeEntry"]');
    if (removeBtn) {
        removeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(231, 76, 60, 0.3)';
        });
        removeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(231, 76, 60, 0.2)';
        });
    }
}

// Remove an income entry
function removeIncomeEntry(entryId) {
    const entry = document.getElementById(`income-entry-${entryId}`);
    if (entry) {
        entry.style.transition = 'opacity 0.3s, transform 0.3s';
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            entry.remove();
            
            // If no entries left, hide the container and show buttons again
            const entriesContainer = document.getElementById('additional-income-entries');
            if (entriesContainer && entriesContainer.children.length === 0) {
                cancelAdditionalIncome();
            }
        }, 300);
    }
}

// Cancel additional income section entirely
function cancelAdditionalIncome() {
    const fieldsContainer = document.getElementById('additional-income-fields');
    const buttonsContainer = document.getElementById('additional-income-buttons');
    const entriesContainer = document.getElementById('additional-income-entries');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    
    incomeEntryCounter = 0;
}

// Skip additional income and move to next section
function skipAdditionalIncome() {
    // Clear all additional income entries
    const entriesContainer = document.getElementById('additional-income-entries');
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    incomeEntryCounter = 0;
    
    // Hide the additional income section
    const fieldsContainer = document.getElementById('additional-income-fields');
    const buttonsContainer = document.getElementById('additional-income-buttons');
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    
    // Trigger the next section reveal (expenses section)
    const incomeSection = document.getElementById('income-section');
    if (incomeSection) {
        incomeSection.classList.add('completed');
    }
    
    // Reveal expenses section if it exists
    const expensesSection = document.getElementById('expenses-section');
    if (expensesSection) {
        expensesSection.classList.add('revealed');
        setTimeout(() => {
            expensesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Proceed to expenses after validating income
function proceedToExpenses() {
    const incomeSource = document.getElementById('income-source');
    const monthlyTakehome = document.getElementById('monthly-takehome');
    
    // Validate required fields
    if (!incomeSource.value) {
        alert('Please select your primary income source');
        incomeSource.focus();
        return;
    }
    
    if (!monthlyTakehome.value || parseFloat(monthlyTakehome.value) <= 0) {
        alert('Please enter your monthly take-home income');
        monthlyTakehome.focus();
        return;
    }
    
    // Save income data to onboardingData
    onboardingData.incomeSource = incomeSource.value;
    onboardingData.monthlyTakehome = parseFloat(monthlyTakehome.value);
    onboardingData.annualIncome = onboardingData.monthlyTakehome * 12;
    
    // Collect additional income entries
    const additionalIncomes = [];
    const incomeEntries = document.querySelectorAll('.income-entry');
    incomeEntries.forEach(entry => {
        const source = entry.querySelector('.additional-income-source')?.value;
        const amount = parseFloat(entry.querySelector('.additional-income-amount')?.value || 0);
        const frequency = entry.querySelector('.additional-income-frequency')?.value;
        
        if (source && amount > 0) {
            additionalIncomes.push({ source, amount, frequency });
        }
    });
    onboardingData.additionalIncome = additionalIncomes;
    
    console.log('Income data saved:', {
        source: onboardingData.incomeSource,
        monthlyTakehome: onboardingData.monthlyTakehome,
        additionalIncome: onboardingData.additionalIncome
    });
    
    // Mark income section as completed
    const incomeSection = document.getElementById('income-section');
    if (incomeSection) {
        incomeSection.classList.add('completed');
    }
    
    // Reveal expenses section
    const expensesSection = document.getElementById('expenses-section');
    if (expensesSection) {
        expensesSection.classList.add('revealed');
        
        // Show the expenses next button
        const expensesNextBtn = document.getElementById('expenses-next-btn');
        if (expensesNextBtn) {
            expensesNextBtn.style.display = 'inline-flex';
        }
        
        setTimeout(() => {
            expensesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================
// EXPENSE MANAGEMENT FUNCTIONS
// ============================================
let expenseEntryCounter = 0;

function showExpenseFields() {
    const fieldsContainer = document.getElementById('expense-fields');
    const buttonsContainer = document.querySelector('#expenses-section .form-group > div');
    const expensesNextBtn = document.getElementById('expenses-next-btn');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'block';
        // Add first expense entry automatically
        addExpenseEntry();
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    if (expensesNextBtn) {
        expensesNextBtn.style.display = 'inline-flex';
    }
}

function addExpenseEntry() {
    expenseEntryCounter++;
    const entriesContainer = document.getElementById('expense-entries');
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'expense-entry';
    entryDiv.id = `expense-entry-${expenseEntryCounter}`;
    entryDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); position: relative;';
    
    entryDiv.innerHTML = `
        <button type="button" onclick="removeExpenseEntry(${expenseEntryCounter})" 
                style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.875rem; transition: all 0.2s;">
            <i class="fas fa-trash"></i> Remove
        </button>
        
        <div class="form-group" style="margin-top: 1.5rem;">
            <label>Expense Category</label>
            <select name="expenseCategory[]" class="expense-category">
                <option value="">Select category...</option>
                <option value="housing">Housing (Rent/Mortgage)</option>
                <option value="utilities">Utilities (Electric, Water, Gas)</option>
                <option value="groceries">Groceries & Food</option>
                <option value="dining">Dining Out & Entertainment</option>
                <option value="transportation">Transportation (Car, Gas, Transit)</option>
                <option value="insurance">Insurance (Health, Auto, Life)</option>
                <option value="healthcare">Healthcare & Medical</option>
                <option value="debt">Debt Payments (Credit Cards, Loans)</option>
                <option value="childcare">Childcare & Education</option>
                <option value="personal">Personal Care</option>
                <option value="shopping">Shopping & Clothing</option>
                <option value="memberships">Memberships</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="form-group">
            <label>Monthly Amount</label>
            <input type="number" name="expenseAmount[]" class="expense-amount" min="0" step="1" onchange="calculateExpenseTotal()">
            <small style="color: rgba(139, 192, 223, 0.85);">Average monthly spending in this category</small>
        </div>

        <div class="form-group">
            <label>Payment Frequency</label>
            <select name="expenseFrequency[]" class="expense-frequency">
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
                <option value="annual">Annual (divided by 12)</option>
            </select>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    
    // Show total display
    const totalDisplay = document.getElementById('expense-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'block';
    }
    
    // Add hover effect to remove button
    const removeBtn = entryDiv.querySelector('button[onclick^="removeExpenseEntry"]');
    if (removeBtn) {
        removeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(231, 76, 60, 0.3)';
        });
        removeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(231, 76, 60, 0.2)';
        });
    }
}

function removeExpenseEntry(entryId) {
    const entry = document.getElementById(`expense-entry-${entryId}`);
    if (entry) {
        entry.style.transition = 'opacity 0.3s, transform 0.3s';
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            entry.remove();
            calculateExpenseTotal();
            
            // If no entries left, hide the container and show buttons again
            const entriesContainer = document.getElementById('expense-entries');
            if (entriesContainer && entriesContainer.children.length === 0) {
                cancelExpenses();
            }
        }, 300);
    }
}

function calculateExpenseTotal() {
    const amountInputs = document.querySelectorAll('.expense-amount');
    let total = 0;
    
    amountInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    const totalElement = document.getElementById('expense-total');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function cancelExpenses() {
    const fieldsContainer = document.getElementById('expense-fields');
    const buttonsContainer = document.querySelector('#expenses-section .form-group > div');
    const entriesContainer = document.getElementById('expense-entries');
    const expensesNextBtn = document.getElementById('expenses-next-btn');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    if (expensesNextBtn) {
        expensesNextBtn.style.display = 'none';
    }
    
    // Hide total display
    const totalDisplay = document.getElementById('expense-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'none';
    }
    
    expenseEntryCounter = 0;
}

function skipExpenses() {
    // Clear all expense entries
    const entriesContainer = document.getElementById('expense-entries');
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    expenseEntryCounter = 0;
    
    // Hide the expense section
    const fieldsContainer = document.getElementById('expense-fields');
    const buttonsContainer = document.querySelector('#expenses-section .form-group > div');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
}

// Subscription Functions within Expenses Section
function showSubscriptionFields() {
    const fieldsContainer = document.getElementById('subscription-fields');
    const buttonsContainer = fieldsContainer?.previousElementSibling;
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'block';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
}

function skipSubscriptions() {
    // Clear subscription data
    const subscriptionList = document.getElementById('subscription-list');
    if (subscriptionList) {
        subscriptionList.innerHTML = '';
    }
    
    // Hide the subscription fields
    const fieldsContainer = document.getElementById('subscription-fields');
    const buttonsContainer = fieldsContainer?.previousElementSibling;
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
}

function cancelSubscriptions() {
    const fieldsContainer = document.getElementById('subscription-fields');
    const buttonsContainer = fieldsContainer?.previousElementSibling;
    const subscriptionList = document.getElementById('subscription-list');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
    if (subscriptionList) {
        subscriptionList.innerHTML = '';
    }
    
    // Hide total display
    const totalDisplay = document.getElementById('subscription-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'none';
    }
}

// ============================================
// ASSET MANAGEMENT FUNCTIONS
// ============================================
let assetEntryCounter = 0;

function showAssetFields() {
    const fieldsContainer = document.getElementById('asset-fields');
    const buttonsContainer = document.querySelector('#assets-section .form-group > div');
    const assetsNextBtn = document.getElementById('assets-next-btn');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'block';
        addAssetEntry();
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    if (assetsNextBtn) {
        assetsNextBtn.style.display = 'inline-flex';
    }
}

function addAssetEntry() {
    assetEntryCounter++;
    const entriesContainer = document.getElementById('asset-entries');
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'asset-entry';
    entryDiv.id = `asset-entry-${assetEntryCounter}`;
    entryDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); position: relative;';
    
    entryDiv.innerHTML = `
        <button type="button" onclick="removeAssetEntry(${assetEntryCounter})" 
                style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.875rem; transition: all 0.2s;">
            <i class="fas fa-trash"></i> Remove
        </button>
        
        <div class="form-group" style="margin-top: 1.5rem;">
            <label>Asset Type</label>
            <select name="assetType[]" class="asset-type">
                <option value="">Select asset type...</option>
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="cash">Cash on Hand</option>
                <option value="investment">Investment Account (Brokerage)</option>
                <option value="retirement">Retirement Account (401k, IRA)</option>
                <option value="real-estate">Real Estate / Home Equity</option>
                <option value="vehicle">Vehicle</option>
                <option value="business">Business / Business Assets</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="collectibles">Collectibles / Valuables</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="form-group">
            <label>Current Value</label>
            <input type="number" name="assetValue[]" class="asset-value" min="0" step="1" onchange="calculateAssetTotal()">
            <small style="color: rgba(139, 192, 223, 0.85);">Current market or estimated value</small>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    
    const totalDisplay = document.getElementById('asset-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'block';
    }
    
    const removeBtn = entryDiv.querySelector('button[onclick^="removeAssetEntry"]');
    if (removeBtn) {
        removeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(231, 76, 60, 0.3)';
        });
        removeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(231, 76, 60, 0.2)';
        });
    }
}

function removeAssetEntry(entryId) {
    const entry = document.getElementById(`asset-entry-${entryId}`);
    if (entry) {
        entry.style.transition = 'opacity 0.3s, transform 0.3s';
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            entry.remove();
            calculateAssetTotal();
            
            const entriesContainer = document.getElementById('asset-entries');
            if (entriesContainer && entriesContainer.children.length === 0) {
                cancelAssets();
            }
        }, 300);
    }
}

function calculateAssetTotal() {
    const amountInputs = document.querySelectorAll('.asset-value');
    let total = 0;
    
    amountInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    const totalElement = document.getElementById('asset-total');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function cancelAssets() {
    const fieldsContainer = document.getElementById('asset-fields');
    const buttonsContainer = document.querySelector('#assets-section .form-group > div');
    const entriesContainer = document.getElementById('asset-entries');
    const assetsNextBtn = document.getElementById('assets-next-btn');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    if (assetsNextBtn) {
        assetsNextBtn.style.display = 'none';
    }
    
    const totalDisplay = document.getElementById('asset-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'none';
    }
    
    assetEntryCounter = 0;
}

function skipAssets() {
    const entriesContainer = document.getElementById('asset-entries');
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    assetEntryCounter = 0;
    
    const fieldsContainer = document.getElementById('asset-fields');
    const buttonsContainer = document.querySelector('#assets-section .form-group > div');
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    
    const assetsNextBtn = document.getElementById('assets-next-btn');
    if (assetsNextBtn) {
        assetsNextBtn.style.display = 'none';
    }
    
    const assetSection = document.getElementById('assets-section');
    if (assetSection) {
        assetSection.classList.add('completed');
    }
    
    const debtSection = document.getElementById('debt-section');
    if (debtSection) {
        debtSection.classList.add('revealed');
        setTimeout(() => {
            debtSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function proceedToDebt() {
    const entriesContainer = document.getElementById('asset-entries');
    const hasAssets = entriesContainer && entriesContainer.children.length > 0;
    
    const fieldsContainer = document.getElementById('asset-fields');
    if (fieldsContainer && fieldsContainer.style.display === 'block' && !hasAssets) {
        alert('Please add at least one asset or click Skip');
        return;
    }
    
    // Save asset data
    const assets = [];
    const assetEntries = document.querySelectorAll('.asset-entry');
    assetEntries.forEach(entry => {
        const type = entry.querySelector('.asset-type')?.value;
        const amount = parseFloat(entry.querySelector('.asset-amount')?.value || 0);
        const name = entry.querySelector('.asset-name')?.value;
        
        if (type && amount > 0) {
            assets.push({ type, amount, name });
        }
    });
    onboardingData.assets = assets;
    
    // Save investments from the investment holdings
    onboardingData.investments = window.investmentHoldings || [];
    onboardingData.portfolioValue = onboardingData.investments.reduce((sum, inv) => sum + (parseFloat(inv.totalValue) || 0), 0);
    
    console.log('Asset data saved:', { assets: onboardingData.assets, investments: onboardingData.investments });
    
    const assetSection = document.getElementById('assets-section');
    if (assetSection) {
        assetSection.classList.add('completed');
    }
    
    const debtSection = document.getElementById('debt-section');
    if (debtSection) {
        debtSection.classList.add('revealed');
        setTimeout(() => {
            debtSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Proceed to assets after expenses
function proceedToAssets() {
    // Check if user has added any expense entries
    const entriesContainer = document.getElementById('expense-entries');
    const hasExpenses = entriesContainer && entriesContainer.children.length > 0;
    
    // Validate at least one expense if fields are shown
    const fieldsContainer = document.getElementById('expense-fields');
    if (fieldsContainer && fieldsContainer.style.display === 'block' && !hasExpenses) {
        alert('Please add at least one expense category or click Skip');
        return;
    }
    
    // Save expense data
    const expenseCategories = [];
    const expenseEntries = document.querySelectorAll('.expense-entry');
    expenseEntries.forEach(entry => {
        const category = entry.querySelector('.expense-category')?.value;
        const amount = parseFloat(entry.querySelector('.expense-amount')?.value || 0);
        
        if (category && amount > 0) {
            expenseCategories.push({ category, amount });
            onboardingData.expenses[category] = (onboardingData.expenses[category] || 0) + amount;
        }
    });
    onboardingData.expenseCategories = expenseCategories;
    
    console.log('Expense data saved:', onboardingData.expenseCategories);
    
    // Mark expenses as completed
    const expenseSection = document.getElementById('expenses-section');
    if (expenseSection) {
        expenseSection.classList.add('completed');
    }
    
    // Reveal assets section
    const assetsSection = document.getElementById('assets-section');
    if (assetsSection) {
        assetsSection.classList.add('revealed');
        setTimeout(() => {
            assetsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================
// DEBT MANAGEMENT FUNCTIONS
// ============================================
let debtEntryCounter = 0;

function showDebtFields() {
    const fieldsContainer = document.getElementById('debt-fields');
    const buttonsContainer = document.querySelector('#debt-section .form-group > div');
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'block';
        addDebtEntry();
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
}

function addDebtEntry() {
    debtEntryCounter++;
    const entriesContainer = document.getElementById('debt-entries');
    
    const entryDiv = document.createElement('div');
    entryDiv.id = `debt-entry-${debtEntryCounter}`;
    entryDiv.className = 'entry-container';
    entryDiv.style.cssText = 'background: rgba(255, 255, 255, 0.03); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(93, 173, 226, 0.2);';
    
    entryDiv.innerHTML = `
        <button type="button" onclick="removeDebtEntry(${debtEntryCounter})" 
                style="float: right; background: rgba(231, 76, 60, 0.2); border: 1px solid rgba(231, 76, 60, 0.5); color: #e74c3c; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.875rem;">
            <i class="fas fa-times"></i> Remove
        </button>
        
        <div class="form-group" style="margin-top: 1.5rem;">
            <label>Debt Type</label>
            <select name="debtType[]" class="debt-type">
                <option value="">Select debt type...</option>
                <option value="credit-card">Credit Card</option>
                <option value="student-loan">Student Loan</option>
                <option value="auto-loan">Auto Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="personal-loan">Personal Loan</option>
                <option value="home-equity">Home Equity Loan/HELOC</option>
                <option value="medical">Medical Debt</option>
                <option value="business-loan">Business Loan</option>
                <option value="payday-loan">Payday Loan</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label>Outstanding Balance</label>
                <input type="number" name="debtBalance[]" class="debt-balance" min="0" step="1" onchange="calculateDebtTotal()">
                <small style="color: rgba(139, 192, 223, 0.85);">Total amount owed</small>
            </div>
            
            <div class="form-group">
                <label>Monthly Payment</label>
                <input type="number" name="debtPayment[]" class="debt-payment" min="0" step="1" onchange="calculateDebtTotal()">
                <small style="color: rgba(139, 192, 223, 0.85);">Minimum monthly payment</small>
            </div>
        </div>
        
        <div class="form-group">
            <label>Interest Rate (Optional)</label>
            <input type="number" name="debtInterest[]" class="debt-interest" min="0" max="100" step="0.01" placeholder="e.g., 18.5">
            <small style="color: rgba(139, 192, 223, 0.85);">Annual percentage rate (APR) for payoff calculations</small>
        </div>
    `;
    
    entriesContainer.appendChild(entryDiv);
    
    const totalDisplay = document.getElementById('debt-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'block';
    }
    
    const removeBtn = entryDiv.querySelector('button[onclick^="removeDebtEntry"]');
    if (removeBtn) {
        removeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(231, 76, 60, 0.3)';
        });
        removeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(231, 76, 60, 0.2)';
        });
    }
}

function removeDebtEntry(entryId) {
    const entry = document.getElementById(`debt-entry-${entryId}`);
    if (entry) {
        entry.style.transition = 'opacity 0.3s, transform 0.3s';
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            entry.remove();
            calculateDebtTotal();
            
            const entriesContainer = document.getElementById('debt-entries');
            if (entriesContainer && entriesContainer.children.length === 0) {
                cancelDebt();
            }
        }, 300);
    }
}

function calculateDebtTotal() {
    const balanceInputs = document.querySelectorAll('.debt-balance');
    const paymentInputs = document.querySelectorAll('.debt-payment');
    
    let totalBalance = 0;
    let totalPayment = 0;
    
    balanceInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalBalance += value;
    });
    
    paymentInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalPayment += value;
    });
    
    const totalElement = document.getElementById('debt-total');
    const paymentElement = document.getElementById('debt-payment-total');
    
    if (totalElement) {
        totalElement.textContent = totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (paymentElement) {
        paymentElement.textContent = totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function skipDebt() {
    const fieldsContainer = document.getElementById('debt-fields');
    const buttonsContainer = document.querySelector('#debt-section .form-group > div');
    const entriesContainer = document.getElementById('debt-entries');
    
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    debtEntryCounter = 0;
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
}

function cancelDebt() {
    const fieldsContainer = document.getElementById('debt-fields');
    const buttonsContainer = document.querySelector('#debt-section .form-group > div');
    const entriesContainer = document.getElementById('debt-entries');
    
    if (entriesContainer) {
        entriesContainer.innerHTML = '';
    }
    debtEntryCounter = 0;
    
    if (fieldsContainer) {
        fieldsContainer.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'flex';
    }
    
    const totalDisplay = document.getElementById('debt-total-display');
    if (totalDisplay) {
        totalDisplay.style.display = 'none';
    }
}