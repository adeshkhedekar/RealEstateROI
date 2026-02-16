// ============================================================================
// Real Estate Loan & Rental Visualization Calculator
// ============================================================================

class LoanCalculator {
    constructor(inputs) {
        this.inputs = inputs;
        this.charts = {};
    }

    /**
     * Validate inputs before calculation
     * @returns {object} {isValid: boolean, error: string}
     */
    validateInputs() {
        const { price, downPayment, interestRate, loanTenure, monthlyRent } = this.inputs;

        if (downPayment > price) {
            return {
                isValid: false,
                error: 'Down Payment cannot be greater than Property Price'
            };
        }

        if (price <= 0 || downPayment < 0 || loanTenure <= 0 || monthlyRent < 0) {
            return {
                isValid: false,
                error: 'Please enter valid positive numbers'
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Calculate EMI using standard formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
     * where P = Principal, r = monthly rate, n = number of months
     * @returns {number} Monthly EMI amount
     */
    calculateEMI() {
        const loanAmount = this.inputs.price - this.inputs.downPayment;
        const annualRate = this.inputs.interestRate / 100;
        const monthlyRate = annualRate / 12;
        const totalMonths = this.inputs.loanTenure * 12;

        // Handle edge case: 0% interest
        if (monthlyRate === 0) {
            return loanAmount / totalMonths;
        }

        const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
        const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
        const emi = loanAmount * (numerator / denominator);

        return emi;
    }

    /**
     * Generate monthly amortization schedule
     * @returns {array} Monthly schedule with interest, principal, remaining principal
     */
    generateAmortizationSchedule() {
        const loanAmount = this.inputs.price - this.inputs.downPayment;
        const annualRate = this.inputs.interestRate / 100;
        const monthlyRate = annualRate / 12;
        const emi = this.calculateEMI();

        const schedule = [];
        let remainingPrincipal = loanAmount;

        for (let month = 0; month < this.inputs.loanTenure * 12; month++) {
            // Calculate interest for current month
            const interest = remainingPrincipal * monthlyRate;
            
            // Principal paid this month
            const principalPaid = emi - interest;
            
            // Update remaining principal
            remainingPrincipal -= principalPaid;
            remainingPrincipal = Math.max(0, remainingPrincipal); // Prevent negative

            schedule.push({
                month: month + 1,
                emi: emi,
                interest: interest,
                principal: principalPaid,
                remaining: remainingPrincipal
            });
        }

        return schedule;
    }

    /**
     * Aggregate monthly data to yearly data
     * @param {array} schedule - Monthly amortization schedule
     * @returns {array} Yearly aggregated data
     */
    aggregateToYearly(schedule) {
        const yearlyData = [];

        for (let year = 1; year <= this.inputs.loanTenure; year++) {
            const startMonth = (year - 1) * 12;
            const endMonth = year * 12;
            
            const monthsInYear = schedule.slice(startMonth, endMonth);
            
            let yearlyEMI = 0;
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;

            monthsInYear.forEach(month => {
                yearlyEMI += month.emi;
                yearlyInterest += month.interest;
                yearlyPrincipal += month.principal;
            });

            const remainingPrincipal = monthsInYear.length > 0 
                ? monthsInYear[monthsInYear.length - 1].remaining 
                : 0;

            yearlyData.push({
                year: year,
                emi: yearlyEMI,
                interest: yearlyInterest,
                principal: yearlyPrincipal,
                remaining: remainingPrincipal
            });
        }

        return yearlyData;
    }

    /**
     * Calculate rental income with annual escalation
     * initialAnnualRent = monthlyRent × 12
     * rentYearN = initialAnnualRent × (1 + rentEscalation/100)^(year-1)
     * @returns {array} Yearly rental income
     */
    calculateRentalIncome() {
        const { monthlyRent, rentEscalation } = this.inputs;
        const initialAnnualRent = monthlyRent * 12;
        const escalationRate = rentEscalation / 100;

        const rentalData = [];

        for (let year = 1; year <= this.inputs.loanTenure; year++) {
            const rentThisYear = initialAnnualRent * Math.pow(1 + escalationRate, year - 1);
            rentalData.push({
                year: year,
                income: rentThisYear
            });
        }

        return rentalData;
    }

    /**
     * Calculate fixed property tax for each year
     * @returns {array} Yearly property tax data
     */
    calculatePropertyTax() {
        const propertyTax = this.inputs.propertyTax;

        const taxData = [];
        for (let year = 1; year <= this.inputs.loanTenure; year++) {
            taxData.push({
                year: year,
                tax: propertyTax
            });
        }
        return taxData;
    }

    /**
     * Generate cumulative arrays for all metrics
     * @param {array} yearlyLoans - Yearly loan data
     * @param {array} rentalData - Yearly rental data
     * @param {array} taxData - Yearly tax data
     * @returns {object} Complete dataset with all values
     */
    generateDatasets(yearlyLoans, rentalData, taxData) {
        const yearLabels = [];
        const principalRemaining = [];
        const interestPaidYearly = [];
        const interestPaidCumulative = [];
        const emiPaidYearly = [];
        const emiOutOfPocketYearly = [];
        const emiPaidCumulative = [];
        const rentalIncomeYearly = [];
        const rentalIncomeCumulative = [];
        const rentalYieldYearly = [];
        const propertyTaxYearly = [];
        const propertyTaxCumulative = [];
        const netPosition = [];

        let cumulativeInterest = 0;
        let cumulativeEMI = 0;
        let cumulativeRental = 0;
        let cumulativeTax = 0;

        for (let year = 1; year <= this.inputs.loanTenure; year++) {
            yearLabels.push(`Year ${year}`);

            const loanData = yearlyLoans[year - 1];
            const rental = rentalData[year - 1];
            const tax = taxData[year - 1];

            principalRemaining.push(Math.round(loanData.remaining * 100) / 100);
            interestPaidYearly.push(Math.round(loanData.interest * 100) / 100);
            const emiYear = Math.round(loanData.emi * 100) / 100;
            const rentYear = Math.round(rental.income * 100) / 100;

            emiPaidYearly.push(emiYear);

            cumulativeInterest += loanData.interest;
            cumulativeEMI += loanData.emi;
            cumulativeRental += rental.income;
            cumulativeTax += tax.tax;

            interestPaidCumulative.push(Math.round(cumulativeInterest * 100) / 100);
            emiPaidCumulative.push(Math.round(cumulativeEMI * 100) / 100);
            rentalIncomeYearly.push(rentYear);
            emiOutOfPocketYearly.push(Math.max(0, Math.round((emiYear - rentYear + tax.tax) * 100) / 100));
            rentalYieldYearly.push(Math.round(((rentYear / this.inputs.price) * 100) * 100) / 100);
            rentalIncomeCumulative.push(Math.round(cumulativeRental * 100) / 100);
            propertyTaxYearly.push(Math.round(tax.tax * 100) / 100);
            propertyTaxCumulative.push(Math.round(cumulativeTax * 100) / 100);
            
            // Net position: cumulative rental income - cumulative EMI paid
            netPosition.push(Math.round((cumulativeRental - cumulativeEMI) * 100) / 100);
        }

        return {
            yearLabels,
            principalRemaining,
            interestPaidYearly,
            interestPaidCumulative,
            emiPaidYearly,
            emiOutOfPocketYearly,
            emiPaidCumulative,
            rentalIncomeYearly,
            rentalIncomeCumulative,
            rentalYieldYearly,
            propertyTaxYearly,
            propertyTaxCumulative,
            netPosition,
            breakEvenYear: this.findBreakEvenYear(emiPaidCumulative, rentalIncomeCumulative),
            outOfPocketMoney: this.calculateOutOfPocketMoney(yearlyLoans, rentalData, taxData),
            finalPropertyValue: this.calculateFinalPropertyValue()
        };
    }

    /**
     * Find the year when cumulative rental income exceeds cumulative EMI
     */
    findBreakEvenYear(cumulativeEMI, cumulativeRental) {
        for (let i = 0; i < cumulativeRental.length; i++) {
            if (cumulativeRental[i] > cumulativeEMI[i]) {
                return i + 1;
            }
        }
        return null;
    }

    /**
     * Calculate total out-of-pocket money
     * Total EMIs + Down Payment + Total Property Tax - Total Rental Income
     * @param {array} yearlyLoans - Yearly loan data
     * @param {array} rentalData - Yearly rental data
     * @param {array} taxData - Yearly property tax data
     * @returns {number} Total out-of-pocket money
     */
    calculateOutOfPocketMoney(yearlyLoans, rentalData, taxData) {
        const downPayment = this.inputs.downPayment;
        
        // Sum all EMI payments
        const totalEMI = yearlyLoans.reduce((sum, year) => sum + year.emi, 0);
        
        // Sum all rental income
        const totalRental = rentalData.reduce((sum, year) => sum + year.income, 0);

        // Sum all property tax
        const totalPropertyTax = taxData.reduce((sum, year) => sum + year.tax, 0);
        
        // Out of pocket = Down Payment + Total EMI + Total Property Tax - Total Rental Income
        return downPayment + totalEMI + totalPropertyTax - totalRental;
    }

    /**
     * Calculate property value at end of tenure
     * @returns {number} Property value after appreciation
     */
    calculateFinalPropertyValue() {
        const appreciation = this.inputs.propertyAppreciation / 100;
        const finalValue = this.inputs.price * Math.pow(1 + appreciation, this.inputs.loanTenure);
        return finalValue;
    }

    /**
     * Main calculation orchestrator
     * @returns {object} Complete calculation results
     */
    calculate() {
        const validation = this.validateInputs();
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Step 1: Calculate EMI
        const emi = this.calculateEMI();

        // Step 2: Generate amortization schedule
        const schedule = this.generateAmortizationSchedule();

        // Step 3: Aggregate to yearly
        const yearlyLoans = this.aggregateToYearly(schedule);

        // Step 5: Calculate rental income
        const rentalData = this.calculateRentalIncome();

        // Step 6: Calculate property tax
        const taxData = this.calculatePropertyTax();

        // Step 7: Generate comprehensive datasets
        const datasets = this.generateDatasets(yearlyLoans, rentalData, taxData);

        return {
            emi,
            yearlyLoans,
            rentalData,
            taxData,
            ...datasets
        };
    }
}

// ============================================================================
// Chart Generation
// ============================================================================

function formatCurrency(value) {
    return '₹' + (value / 100000).toFixed(1) + 'L';
}

function createLoanChart(container, data) {
    const ctx = container.getContext('2d');

    // Destroy previous chart if it exists
    if (window.loanChartInstance) {
        window.loanChartInstance.destroy();
    }

    window.loanChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.yearLabels,
            datasets: [
                {
                    label: 'Principal Remaining',
                    data: data.principalRemaining,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Interest Paid',
                    data: data.interestPaidCumulative,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative EMI Paid',
                    data: data.emiPaidCumulative,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

function createRentalVsInterestChart(container, data) {
    const ctx = container.getContext('2d');

    // Destroy previous chart if it exists
    if (window.rentalVsInterestChartInstance) {
        window.rentalVsInterestChartInstance.destroy();
    }

    window.rentalVsInterestChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.yearLabels,
            datasets: [
                {
                    label: 'Yearly Rental Income',
                    data: data.rentalIncomeYearly,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Yearly Interest Paid',
                    data: data.interestPaidYearly,
                    borderColor: '#e67e22',
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

function createRentalVsEMIChart(container, data) {
    const ctx = container.getContext('2d');

    // Destroy previous chart if it exists
    if (window.rentalVsEMIChartInstance) {
        window.rentalVsEMIChartInstance.destroy();
    }

    window.rentalVsEMIChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.yearLabels,
            datasets: [
                {
                    label: 'Yearly Rental Income',
                    data: data.rentalIncomeYearly,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Yearly EMI Paid',
                    data: data.emiPaidYearly,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Out-of-Pocket EMI Paid',
                    data: data.emiOutOfPocketYearly,
                    borderColor: '#8e44ad',
                    backgroundColor: 'rgba(142, 68, 173, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

function createRentalYieldChart(container, data) {
    const ctx = container.getContext('2d');

    if (window.rentalYieldChartInstance) {
        window.rentalYieldChartInstance.destroy();
    }

    window.rentalYieldChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.yearLabels,
            datasets: [
                {
                    label: 'Rental Yield (% of Property Value)',
                    data: data.rentalYieldYearly,
                    borderColor: '#2c3e50',
                    backgroundColor: 'rgba(44, 62, 80, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Rental Yield (%)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

function createNetPositionChart(container, data) {
    const ctx = container.getContext('2d');

    // Destroy previous chart if it exists
    if (window.netPositionChartInstance) {
        window.netPositionChartInstance.destroy();
    }

    window.netPositionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.yearLabels,
            datasets: [
                {
                    label: 'Net Position (Rental Income - EMI)',
                    data: data.netPosition,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const sign = value >= 0 ? '+' : '';
                            return context.dataset.label + ': ' + sign + formatCurrency(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            const sign = value >= 0 ? '+' : '';
                            return sign + formatCurrency(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

function displaySummaryStats(data) {
    const container = document.getElementById('summaryStats');
    const lastYear = data.emiPaidCumulative.length - 1;

    const stats = [
        {
            label: 'Monthly EMI',
            value: formatCurrency(data.emi),
            color: '#3498db'
        },
        {
            label: 'Total Interest Paid',
            value: formatCurrency(data.interestPaidCumulative[lastYear]),
            color: '#f39c12'
        },
        {
            label: 'Total Amount Paid',
            value: formatCurrency(data.emiPaidCumulative[lastYear]),
            color: '#e74c3c'
        },
        {
            label: 'Total Rental Income',
            value: formatCurrency(data.rentalIncomeCumulative[lastYear]),
            color: '#27ae60'
        },
        {
            label: 'Total Property Tax Paid',
            value: formatCurrency(data.propertyTaxCumulative[lastYear]),
            color: '#95a5a6'
        },
        {
            label: 'Total Out-of-Pocket Money',
            value: formatCurrency(data.outOfPocketMoney),
            color: '#8e44ad',
            highlight: true
        },
        {
            label: 'Property Value at End of Tenure',
            value: formatCurrency(data.finalPropertyValue),
            color: '#16a085',
            highlight: true
        },
        {
            label: 'Net Wealth Gain',
            value: formatCurrency(data.finalPropertyValue - data.outOfPocketMoney),
            color: '#27ae60',
            highlight: true
        }
    ];

    if (data.breakEvenYear) {
        stats.push({
            label: 'Break-Even Year',
            value: `Year ${data.breakEvenYear}`,
            color: '#16a085'
        });
    }

    container.innerHTML = stats.map(stat => `
        <div class="stat-card${stat.highlight ? ' highlight' : ''}">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value" style="color: ${stat.color}">${stat.value}</div>
        </div>
    `).join('');
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleFormSubmit(event) {
    event.preventDefault();

    const errorMsg = document.getElementById('errorMessage');
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';

    // Get form values
    const formData = new FormData(document.getElementById('loanForm'));
    const inputs = {
        price: parseFloat(formData.get('price')),
        downPayment: parseFloat(formData.get('downPayment')),
        interestRate: parseFloat(formData.get('interestRate')),
        monthlyRent: parseFloat(formData.get('monthlyRent')),
        rentEscalation: parseFloat(formData.get('rentEscalation')),
        loanTenure: parseInt(formData.get('loanTenure')),
        propertyTax: parseFloat(formData.get('propertyTax')),
        propertyAppreciation: parseFloat(formData.get('propertyAppreciation'))
    };

    try {
        // Calculate
        const calculator = new LoanCalculator(inputs);
        const results = calculator.calculate();

        // Display results
        const loanChartContainer = document.getElementById('loanChart');
        const rentalVsInterestChartContainer = document.getElementById('rentalVsInterestChart');
        const rentalVsEMIChartContainer = document.getElementById('rentalVsEMIChart');
        const rentalYieldChartContainer = document.getElementById('rentalYieldChart');
        const netPositionChartContainer = document.getElementById('netPositionChart');

        createLoanChart(loanChartContainer, results);
        createRentalVsInterestChart(rentalVsInterestChartContainer, results);
        createRentalVsEMIChart(rentalVsEMIChartContainer, results);
        createRentalYieldChart(rentalYieldChartContainer, results);
        createNetPositionChart(netPositionChartContainer, results);
        displaySummaryStats(results);

        // Scroll to charts
        document.querySelector('.charts-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        errorMsg.textContent = '❌ ' + error.message;
        errorMsg.classList.add('show');
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener('wheel', (event) => {
            event.preventDefault();
            input.blur();
        }, { passive: false });
    });

    document.getElementById('loanForm').addEventListener('submit', handleFormSubmit);

    // Pre-fill with example values for demonstration
    document.getElementById('price').value = 31200000;
    document.getElementById('downPayment').value = 5000000;
    document.getElementById('interestRate').value = 8.25;
    document.getElementById('monthlyRent').value = 170000;
    document.getElementById('rentEscalation').value = 5;
    document.getElementById('loanTenure').value = 20;
    document.getElementById('propertyTax').value = 95000;
    document.getElementById('propertyAppreciation').value = 6;
});
