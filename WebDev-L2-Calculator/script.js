const currentOperandTextElement = document.getElementById('current-operand');
const previousOperandTextElement = document.getElementById('previous-operand');
const numberButtons = document.querySelectorAll('[data-number]');
const operatorButtons = document.querySelectorAll('[data-operator]');
const clearButton = document.getElementById('clear');
const deleteButton = document.getElementById('delete');
const equalsButton = document.getElementById('equals');

let currentOperand = '0';
let previousOperand = '';
let operation = undefined;
let shouldResetScreen = false;

function updateDisplay() {
    currentOperandTextElement.innerText = currentOperand;
    if (operation != null) {
        previousOperandTextElement.innerText = `${previousOperand} ${operation}`;
    } else {
        previousOperandTextElement.innerText = previousOperand;
    }
}

function clear() {
    currentOperand = '0';
    previousOperand = '';
    operation = undefined;
    shouldResetScreen = false;
}

function deleteNumber() {
    if (currentOperand === 'Error') {
        clear();
        return;
    }
    if (shouldResetScreen) {
        currentOperand = '0';
        shouldResetScreen = false;
        return;
    }
    currentOperand = currentOperand.toString().slice(0, -1);
    if (currentOperand === '' || currentOperand === '-') {
        currentOperand = '0';
    }
}

function appendNumber(number) {
    if (currentOperand === 'Error') clear();
    if (number === '.' && currentOperand.includes('.')) return;
    
    if (currentOperand === '0' && number !== '.') {
        currentOperand = number;
    } else if (shouldResetScreen) {
        currentOperand = number === '.' ? '0.' : number;
        shouldResetScreen = false;
    } else {
        currentOperand += number;
    }
}

function chooseOperation(op) {
    if (currentOperand === 'Error') return;
    if (currentOperand === '0' && previousOperand === '') {
        // Handle gracefully, don't return so we can chain if previousOperand isn't empty
    }
    if (previousOperand !== '') {
        calculate();
    }
    operation = op;
    previousOperand = currentOperand;
    shouldResetScreen = true;
}

function calculate() {
    let computation;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    
    if (isNaN(prev) || isNaN(current)) return;
    
    switch (operation) {
        case '+':
            computation = prev + current;
            break;
        case '−': // using unicode minus from html
            computation = prev - current;
            break;
        case '×':
            computation = prev * current;
            break;
        case '÷':
            if (current === 0) {
                currentOperand = 'Error';
                operation = undefined;
                previousOperand = '';
                return;
            }
            computation = prev / current;
            break;
        default:
            return;
    }
    
    // Round to avoid floating point precision issues
    computation = Math.round(computation * 10000000000) / 10000000000;
    
    currentOperand = computation.toString();
    operation = undefined;
    previousOperand = '';
    shouldResetScreen = true;
}

// Event Listeners
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        appendNumber(button.getAttribute('data-number'));
        updateDisplay();
    });
});

operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
        chooseOperation(button.getAttribute('data-operator'));
        updateDisplay();
    });
});

clearButton.addEventListener('click', () => {
    clear();
    updateDisplay();
});

deleteButton.addEventListener('click', () => {
    deleteNumber();
    updateDisplay();
});

equalsButton.addEventListener('click', () => {
    calculate();
    updateDisplay();
});

// Initial display
updateDisplay();
