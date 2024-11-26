function calculateLoanDisclosure() {
  // Get input values
  const loanAmount = parseFloat(document.getElementById('loanAmount').value)
  const term = parseInt(document.getElementById('term').value) // in months
  const ficoRange = document.getElementById('ficoScoreRange').value
  const downPaymentOption = parseInt(
    document.getElementById('downPaymentOption').value
  )
  const state = document.getElementById('state').value
  const freshStart = document.getElementById('freshStart').checked

  // Check for state-specific exceptions
  let closingFee = loanAmount * 0.02 // Default 2% closing fee
  if (state === 'AZ' && loanAmount <= 15000) {
    closingFee = Math.min(closingFee, 150)
  } else if (state === 'CA' && loanAmount < 5000) {
    closingFee = Math.min(closingFee, 75)
  } else if (state === 'MT') {
    closingFee = 0 // Montana: No closing fees
  }

  // Include closing fee in principal
  const principal = loanAmount + closingFee

  // Base rates by state
  let baseRate
  if (
    [
      'AZ',
      'CA',
      'FL',
      'GA',
      'IA',
      'ID',
      'KY',
      'MD',
      'MT',
      'NJ',
      'NY',
      'UT',
    ].includes(state)
  ) {
    baseRate = 11.99
  } else if (['CO', 'KS', 'MA', 'VA'].includes(state)) {
    baseRate = 10.99
  } else if (state === 'TX') {
    baseRate = 9.99
  }

  // Apply FICO range discount
  let ficoDiscount = 0
  if (ficoRange === '660') {
    ficoDiscount =
      state === 'TX' || ['CO', 'KS', 'MA', 'VA'].includes(state) ? -0.5 : -1
  } else if (ficoRange === '700') {
    ficoDiscount =
      state === 'TX' || ['CO', 'KS', 'MA', 'VA'].includes(state) ? -1 : -2
  } else if (ficoRange === '750') {
    ficoDiscount = 0 // No discount for 750+
  }

  // Apply Down Payment discount
  let downPaymentDiscount = 0
  if (downPaymentOption === 10) {
    downPaymentDiscount = -1
  } else if (downPaymentOption === 20) {
    downPaymentDiscount = -2
  }

  // Apply Fresh Start Discount
  let freshStartDiscount = freshStart ? -1 : 0

  // Calculate final interest rate
  const finalRate =
    baseRate + ficoDiscount + downPaymentDiscount + freshStartDiscount

  // Convert annual rate to monthly rate
  const monthlyRate = finalRate / 100 / 12

  // Calculate monthly payment using the amortization formula
  const monthlyPayment =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))

  // Calculate total payments
  const totalPayment = monthlyPayment * term

  // Calculate finance charge
  const financeCharge = totalPayment - loanAmount

  // Calculate APR using binary search
  const apr = calculateAPR(loanAmount, closingFee, term, monthlyPayment)

  // Display results
  document.getElementById('amountFinanced').textContent = loanAmount.toFixed(2)
  document.getElementById('closingFee').textContent = closingFee.toFixed(2)
  document.getElementById('finalRate').textContent = finalRate.toFixed(2)
  document.getElementById('monthlyPayment').textContent =
    monthlyPayment.toFixed(2)
  document.getElementById('apr').textContent = apr.toFixed(3)
  document.getElementById('financeCharge').textContent =
    financeCharge.toFixed(2)
  document.getElementById('totalPayment').textContent = totalPayment.toFixed(2)
}

// APR Calculation Function
function calculateAPR(loanAmount, term, monthlyPayment) {
  const financedAmount = loanAmount // Loan amount without closing fees
  let lowerBound = 0
  let upperBound = 0.5 // 50% APR upper bound
  const tolerance = 1e-6 // Improved precision
  const maxIterations = 100

  let iteration = 0
  let apr = 0

  while (iteration < maxIterations) {
    apr = (lowerBound + upperBound) / 2 // Midpoint for binary search
    const monthlyRate = apr / 12

    // Recalculate payment for this APR
    const recalculatedPayment =
      (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))

    // Adjust bounds based on recalculated payment
    if (Math.abs(recalculatedPayment - monthlyPayment) < tolerance) {
      break // Converged within tolerance
    }

    if (recalculatedPayment < monthlyPayment) {
      lowerBound = apr // APR is higher
    } else {
      upperBound = apr // APR is lower
    }

    iteration++
  }

  return apr * 100 // Convert to percentage
}

function toggleDetails() {
  const details = document.getElementById('estimatedDetails')
  const button = details.previousElementSibling // The button before the details section

  // Toggle visibility
  if (details.style.display === 'none') {
    details.style.display = 'block'
    button.textContent = 'Hide Estimated Details'
  } else {
    details.style.display = 'none'
    button.textContent = 'Show Estimated Details'
  }
}
