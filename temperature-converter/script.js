const tempInput = document.getElementById('tempInput');
const unitSelect = document.getElementById('unitSelect');
const convertBtn = document.getElementById('convertBtn');
const errorMessage = document.getElementById('errorMessage');
const resC = document.getElementById('resC');
const resF = document.getElementById('resF');
const resK = document.getElementById('resK');

// Absolute zero constants
const ABSOLUTE_ZERO_C = -273.15;
const ABSOLUTE_ZERO_F = -459.67;
const ABSOLUTE_ZERO_K = 0;

convertBtn.addEventListener('click', performConversion);
tempInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        performConversion();
    }
});

function performConversion() {
    // Clear previous errors
    errorMessage.textContent = '';
    
    // Validate input
    const inputValue = tempInput.value.trim();
    if (inputValue === '') {
        showError('Please enter a numerical temperature value.');
        clearResults();
        return;
    }

    const temp = parseFloat(inputValue);
    if (isNaN(temp)) {
        showError('Invalid input. Please enter a valid number.');
        clearResults();
        return;
    }

    const unit = unitSelect.value;

    // Check for absolute zero violations
    if (unit === 'C' && temp < ABSOLUTE_ZERO_C) {
        showError(`Temperature cannot be below absolute zero (${ABSOLUTE_ZERO_C}°C).`);
        clearResults();
        return;
    }
    if (unit === 'F' && temp < ABSOLUTE_ZERO_F) {
        showError(`Temperature cannot be below absolute zero (${ABSOLUTE_ZERO_F}°F).`);
        clearResults();
        return;
    }
    if (unit === 'K' && temp < ABSOLUTE_ZERO_K) {
        showError(`Temperature cannot be below absolute zero (${ABSOLUTE_ZERO_K}K).`);
        clearResults();
        return;
    }

    // Convert and update UI
    let celsius, fahrenheit, kelvin;

    if (unit === 'C') {
        celsius = temp;
        fahrenheit = (temp * 9/5) + 32;
        kelvin = temp + 273.15;
    } else if (unit === 'F') {
        celsius = (temp - 32) * 5/9;
        fahrenheit = temp;
        kelvin = (temp - 32) * 5/9 + 273.15;
    } else if (unit === 'K') {
        celsius = temp - 273.15;
        fahrenheit = (temp - 273.15) * 9/5 + 32;
        kelvin = temp;
    }

    // Display formatted results (rounded to 2 decimal places)
    resC.textContent = formatNumber(celsius);
    resF.textContent = formatNumber(fahrenheit);
    resK.textContent = formatNumber(kelvin);
}

function showError(msg) {
    errorMessage.textContent = msg;
}

function clearResults() {
    resC.textContent = '--';
    resF.textContent = '--';
    resK.textContent = '--';
}

function formatNumber(num) {
    return Number(num.toFixed(2)).toString();
}
