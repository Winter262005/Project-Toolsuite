// Conversion Data
const conversionData = {
    length: {
        units: ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Micrometer', 'Nanometer', 'Mile', 'Yard', 'Foot', 'Inch', 'Nautical Mile'],
        baseUnit: 'Meter',
        toBase: {
            'Meter': 1,
            'Kilometer': 1000,
            'Centimeter': 0.01,
            'Millimeter': 0.001,
            'Micrometer': 1e-6,
            'Nanometer': 1e-9,
            'Mile': 1609.344,
            'Yard': 0.9144,
            'Foot': 0.3048,
            'Inch': 0.0254,
            'Nautical Mile': 1852
        },
        formula: 'Multiply the length by the appropriate conversion factor'
    },
    mass: {
        units: ['Kilogram', 'Gram', 'Milligram', 'Microgram', 'Ton', 'Pound', 'Ounce', 'Stone', 'Ton (US)'],
        baseUnit: 'Kilogram',
        toBase: {
            'Kilogram': 1,
            'Gram': 0.001,
            'Milligram': 0.000001,
            'Microgram': 1e-9,
            'Ton': 1000,
            'Pound': 0.453592,
            'Ounce': 0.0283495,
            'Stone': 6.35029,
            'Ton (US)': 907.185
        },
        formula: 'Mass conversion using standard conversion factors'
    },
    temperature: {
        units: ['Celsius', 'Fahrenheit', 'Kelvin'],
        baseUnit: 'Celsius',
        toBase: {
            'Celsius': (val) => val,
            'Fahrenheit': (val) => (val - 32) * 5 / 9,
            'Kelvin': (val) => val - 273.15
        },
        fromBase: {
            'Celsius': (val) => val,
            'Fahrenheit': (val) => val * 9 / 5 + 32,
            'Kelvin': (val) => val + 273.15
        },
        formula: '°C = (°F - 32) × 5/9 | K = °C + 273.15'
    },
    volume: {
        units: ['Liter', 'Milliliter', 'Cubic Meter', 'Cubic Centimeter', 'Gallon (US)', 'Gallon (UK)', 'Pint (US)', 'Cup (US)', 'Fluid Ounce (US)', 'Tablespoon', 'Teaspoon'],
        baseUnit: 'Liter',
        toBase: {
            'Liter': 1,
            'Milliliter': 0.001,
            'Cubic Meter': 1000,
            'Cubic Centimeter': 0.001,
            'Gallon (US)': 3.78541,
            'Gallon (UK)': 4.54609,
            'Pint (US)': 0.473176,
            'Cup (US)': 0.236588,
            'Fluid Ounce (US)': 0.0295735,
            'Tablespoon': 0.0147868,
            'Teaspoon': 0.00492892
        },
        formula: 'Volume conversion using standard liquid and cubic measurements'
    },
    area: {
        units: ['Square Meter', 'Square Kilometer', 'Square Centimeter', 'Square Mile', 'Square Yard', 'Square Foot', 'Square Inch', 'Hectare', 'Acre'],
        baseUnit: 'Square Meter',
        toBase: {
            'Square Meter': 1,
            'Square Kilometer': 1e6,
            'Square Centimeter': 0.0001,
            'Square Mile': 2.58999e6,
            'Square Yard': 0.836127,
            'Square Foot': 0.092903,
            'Square Inch': 0.00064516,
            'Hectare': 10000,
            'Acre': 4046.86
        },
        formula: 'Area conversion using standard area measurements'
    },
    speed: {
        units: ['Meter per Second', 'Kilometer per Hour', 'Mile per Hour', 'Knot', 'Foot per Second'],
        baseUnit: 'Meter per Second',
        toBase: {
            'Meter per Second': 1,
            'Kilometer per Hour': 0.277778,
            'Mile per Hour': 0.44704,
            'Knot': 0.51444,
            'Foot per Second': 0.3048
        },
        formula: 'Speed conversion: 1 m/s = 3.6 km/h = 2.237 mph'
    },
    time: {
        units: ['Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year', 'Millisecond', 'Microsecond', 'Nanosecond'],
        baseUnit: 'Second',
        toBase: {
            'Second': 1,
            'Minute': 60,
            'Hour': 3600,
            'Day': 86400,
            'Week': 604800,
            'Month': 2629800,
            'Year': 31557600,
            'Millisecond': 0.001,
            'Microsecond': 0.000001,
            'Nanosecond': 1e-9
        },
        formula: 'Time conversion: 1 min = 60 sec | 1 hour = 3600 sec'
    },
    energy: {
        units: ['Joule', 'Kilojoule', 'Calorie', 'Kilocalorie', 'Watt-hour', 'Kilowatt-hour', 'Electronvolt', 'British Thermal Unit'],
        baseUnit: 'Joule',
        toBase: {
            'Joule': 1,
            'Kilojoule': 1000,
            'Calorie': 4.184,
            'Kilocalorie': 4184,
            'Watt-hour': 3600,
            'Kilowatt-hour': 3.6e6,
            'Electronvolt': 1.602e-19,
            'British Thermal Unit': 1055.06
        },
        formula: 'Energy conversion: 1 kcal = 4184 J | 1 kWh = 3.6 MJ'
    },
    power: {
        units: ['Watt', 'Kilowatt', 'Megawatt', 'Horsepower', 'Kilocalorie per Second'],
        baseUnit: 'Watt',
        toBase: {
            'Watt': 1,
            'Kilowatt': 1000,
            'Megawatt': 1e6,
            'Horsepower': 745.7,
            'Kilocalorie per Second': 4184
        },
        formula: 'Power conversion: 1 kW = 1000 W | 1 hp ≈ 746 W'
    },
    pressure: {
        units: ['Pascal', 'Kilopascal', 'Bar', 'Atmosphere', 'Pound per Square Inch', 'Torr'],
        baseUnit: 'Pascal',
        toBase: {
            'Pascal': 1,
            'Kilopascal': 1000,
            'Bar': 100000,
            'Atmosphere': 101325,
            'Pound per Square Inch': 6894.76,
            'Torr': 133.322
        },
        formula: 'Pressure conversion: 1 bar = 100000 Pa | 1 atm ≈ 101325 Pa'
    },
    data: {
        units: ['Bit', 'Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte', 'Petabyte', 'Exabyte'],
        baseUnit: 'Byte',
        toBase: {
            'Bit': 0.125,
            'Byte': 1,
            'Kilobyte': 1024,
            'Megabyte': 1024 * 1024,
            'Gigabyte': 1024 * 1024 * 1024,
            'Terabyte': 1024 * 1024 * 1024 * 1024,
            'Petabyte': 1024 * 1024 * 1024 * 1024 * 1024,
            'Exabyte': 1024 * 1024 * 1024 * 1024 * 1024 * 1024
        },
        formula: '1 Byte = 8 Bits | 1 KB = 1024 Bytes | 1 GB = 1024 MB'
    },
    bandwidth: {
        units: ['Bit per Second', 'Kilobit per Second', 'Megabit per Second', 'Gigabit per Second', 'Byte per Second', 'Kilobyte per Second', 'Megabyte per Second', 'Gigabyte per Second'],
        baseUnit: 'Bit per Second',
        toBase: {
            'Bit per Second': 1,
            'Kilobit per Second': 1000,
            'Megabit per Second': 1000000,
            'Gigabit per Second': 1000000000,
            'Byte per Second': 8,
            'Kilobyte per Second': 8000,
            'Megabyte per Second': 8000000,
            'Gigabyte per Second': 8000000000
        },
        formula: '1 Kilobit/s = 1000 bits/s | 1 Megabit/s = 1000 Kilobits/s'
    },
    frequency: {
        units: ['Hertz', 'Kilohertz', 'Megahertz', 'Gigahertz', 'Terahertz'],
        baseUnit: 'Hertz',
        toBase: {
            'Hertz': 1,
            'Kilohertz': 1000,
            'Megahertz': 1000000,
            'Gigahertz': 1000000000,
            'Terahertz': 1000000000000
        },
        formula: '1 KHz = 1000 Hz | 1 MHz = 1000 KHz | 1 GHz = 1000 MHz'
    },
    angle: {
        units: ['Degree', 'Radian', 'Gradian', 'Arcminute', 'Arcsecond'],
        baseUnit: 'Radian',
        toBase: {
            'Degree': Math.PI / 180,
            'Radian': 1,
            'Gradian': Math.PI / 200,
            'Arcminute': Math.PI / 10800,
            'Arcsecond': Math.PI / 648000
        },
        formula: '1 Radian = 57.2958° | 360° = 2π Radians | 1° = 60 arcminutes'
    },
    resistance: {
        units: ['Ohm', 'Milliohm', 'Kilohm', 'Megohm'],
        baseUnit: 'Ohm',
        toBase: {
            'Ohm': 1,
            'Milliohm': 0.001,
            'Kilohm': 1000,
            'Megohm': 1000000
        },
        formula: '1 Kilohm = 1000 Ohms | 1 Megohm = 1,000,000 Ohms'
    }
};

// DOM Elements
const categoryBtns = document.querySelectorAll('.category-btn');
const fromValueInput = document.getElementById('fromValue');
const toValueInput = document.getElementById('toValue');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const swapBtn = document.getElementById('swapBtn');
const precisionInput = document.getElementById('precision');
const formulaText = document.getElementById('formulaText');
const historyContainer = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let currentCategory = 'length';
let conversionHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    initializeCategory('length');
});

// Category Selection
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        initializeCategory(currentCategory);
        fromValueInput.value = '';
        toValueInput.value = '';
    });
});

function initializeCategory(category) {
    const data = conversionData[category];
    currentCategory = category;

    // Populate unit selects
    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';

    data.units.forEach((unit, index) => {
        const fromOption = document.createElement('option');
        fromOption.value = unit;
        fromOption.textContent = unit;
        if (index === 0) fromOption.selected = true;
        fromUnitSelect.appendChild(fromOption);

        const toOption = document.createElement('option');
        toOption.value = unit;
        toOption.textContent = unit;
        if (index === 1 && data.units.length > 1) toOption.selected = true;
        toUnitSelect.appendChild(toOption);
    });

    // Update formula
    formulaText.textContent = data.formula;

    // Clear inputs
    fromValueInput.value = '';
    toValueInput.value = '';
}


function getValidPrecision() {
    const DEFAULT_PRECISION = 4;
    const precision = Number.parseInt(precisionInput.value, 10);

    if (
        Number.isNaN(precision) ||
        precision < 0 ||
        precision > 20
    ) {
        return DEFAULT_PRECISION;
    }

    return precision;
}

// Conversion Logic
function performConversion() {
    const fromValue = parseFloat(fromValueInput.value);
    const category = conversionData[currentCategory];

    if (isNaN(fromValue)) {
        toValueInput.value = '';
        return;
    }

    let result;

    if (category.fromBase) {
        // For temperature (special case)
        const baseValue = category.toBase[fromUnitSelect.value](fromValue);
        result = category.fromBase[toUnitSelect.value](baseValue);
    } else {
        // Standard conversion
        const baseValue = fromValue * category.toBase[fromUnitSelect.value];
        result = baseValue / category.toBase[toUnitSelect.value];
    }

    const precision = getValidPrecision();
    toValueInput.value = parseFloat(result.toFixed(precision));
}

function saveCurrentToHistory() {
    const fromValue = parseFloat(fromValueInput.value);
    if (isNaN(fromValue)) {
        return;
    }
    const entry = `${fromValue} ${fromUnitSelect.value} → ${toValueInput.value} ${toUnitSelect.value}`;
    addToHistory(entry);
}

// Event Listeners for Conversion
fromValueInput.addEventListener('input', performConversion);
fromValueInput.addEventListener('change', saveCurrentToHistory);
fromValueInput.addEventListener('blur', saveCurrentToHistory);
fromValueInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveCurrentToHistory();
    }
});

fromUnitSelect.addEventListener('change', () => {
    performConversion();
    saveCurrentToHistory();
});
toUnitSelect.addEventListener('change', () => {
    performConversion();
    saveCurrentToHistory();
});
precisionInput.addEventListener('change', performConversion);

// Swap Units
swapBtn.addEventListener('click', () => {
    const tempUnit = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = tempUnit;

    const tempValue = fromValueInput.value;
    fromValueInput.value = toValueInput.value;
    toValueInput.value = tempValue;

    performConversion();
    saveCurrentToHistory();
});

// History Management
function addToHistory(entry) {
    if (entry.includes('→') && entry.split('→')[1].trim() !== '') {
        // Prevent duplicate consecutive history entries
        if (conversionHistory.length > 0 && conversionHistory[0] === entry) {
            return;
        }
        conversionHistory.unshift(entry);
        if (conversionHistory.length > 10) {
            conversionHistory.pop();
        }
        saveHistory();
        renderHistory();
    }
}

function renderHistory() {
    historyContainer.innerHTML = '';

    if (conversionHistory.length === 0) {
        historyContainer.innerHTML = '<p class="empty-history">No conversions yet</p>';
        clearHistoryBtn.style.display = 'none';
        return;
    }

    clearHistoryBtn.style.display = 'block';

    conversionHistory.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span>${entry}</span>
            <button class="history-item-remove" data-index="${index}">✕</button>
        `;

        item.querySelector('.history-item-remove').addEventListener('click', () => {
            conversionHistory.splice(index, 1);
            saveHistory();
            renderHistory();
        });

        historyContainer.appendChild(item);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    conversionHistory = [];
    saveHistory();
    renderHistory();
});

// Local Storage
function saveHistory() {
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('conversionHistory');
    if (saved) {
        conversionHistory = JSON.parse(saved);
        renderHistory();
    }
}
