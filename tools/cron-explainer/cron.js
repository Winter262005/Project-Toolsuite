// CRON Schedule Explainer & Builder Logic Engine

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
};

const WEEKDAY_MAP = {
    "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6
};

// Ordinal helper
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Format number to double digits
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// Core Parser of a single field
// Core Parser of a single field
function parseField(expr, minVal, maxVal, nameMap = null) {

    const values = new Set();

    const parts = expr.split(',');

    for (let part of parts) {

        part = part.trim().toLowerCase();

        if (!part) return null;


        // Convert names first
        if (nameMap) {

            for (let [key, val] of Object.entries(nameMap)) {

                const regex = new RegExp(`\\b${key}\\b`, "gi");

                part = part.replace(regex, val);

            }

        }


        /*
            STRICT VALIDATION

            Allowed:
            *
            numbers
            -
            /
            ,

            Reject:
            abc
            12abc
            1x2
            @
        */

        if (!/^[0-9*/,\-]+$/.test(part)) {
            return null;
        }


        let step = 1;

        let start = minVal;

        let end = maxVal;


        let hasSlash = false;



        // Handle step
        if (part.includes('/')) {


            hasSlash = true;


            const slashParts = part.split('/');


            if (slashParts.length !== 2) {
                return null;
            }


            step = Number(slashParts[1]);


            if (!Number.isInteger(step) || step <= 0) {
                return null;
            }


            part = slashParts[0];

        }



        // Wildcard

        if (part === '*') {


            start = minVal;

            end = maxVal;


        }



        // Range

        // Range

        else if (part.includes('-')) {


            const dashParts = part.split('-');


            if (dashParts.length !== 2) {
                return null;
            }


            start = Number(dashParts[0]);

            end = Number(dashParts[1]);


            if (
                !Number.isInteger(start) ||
                !Number.isInteger(end) ||
                start < minVal ||
                end > maxVal
            ) {
                return null;
            }


            // Handle wrap-around weekday ranges
            // Example:
            // sat-sun => 6-0 => 6,7,0

            if (start > end && maxVal === 7) {

                for (let i = start; i <= maxVal; i += step) {
                    values.add(i);
                }


                for (let i = minVal; i <= end; i += step) {
                    values.add(i);
                }


                continue;

            }


            if (start > end) {
                return null;
            }

        }


        // Single value

        else {


            const val = Number(part);


            if (
                !Number.isInteger(val) ||
                val < minVal ||
                val > maxVal
            ) {

                return null;

            }


            start = val;

            end = hasSlash ? maxVal : val;

        }



        for (
            let i = start;
            i <= end;
            i += step
        ) {

            values.add(i);

        }

    }


    return values;

}

// Generate the English description of a single field
function describeField(expr, unitName, minVal, maxVal, nameMap = null, listNames = null) {
    if (expr === '*') {
        return `every ${unitName}`;
    }

    const parts = expr.split(',');
    const descriptions = parts.map(part => {
        part = part.trim().toLowerCase();

        if (!/^[0-9*/,\-]+$/.test(part) && !nameMap) {
            return "";
        }

        if (nameMap) {
            for (let [key, val] of Object.entries(nameMap)) {
                part = part.replace(new RegExp(key, 'g'), val);
            }
        }

        let step = 1;
        let start = minVal;
        let end = maxVal;
        let hasSlash = false;

        if (part.includes('/')) {
            hasSlash = true;
            const slashParts = part.split('/');
            step = parseInt(slashParts[1], 10);
            part = slashParts[0];
        }

        if (part === '*') {
            start = minVal;
            end = maxVal;
        } else if (part.includes('-')) {
            const dashParts = part.split('-');
            start = parseInt(dashParts[0], 10);
            end = parseInt(dashParts[1], 10);
        } else {
            start = parseInt(part, 10);
            end = start;
        }

        const getValName = (val) => {
            if (listNames) {
                if (unitName === 'month') {
                    return listNames[val - 1];
                }
                return listNames[val];
            }
            if (unitName === 'day of month') {
                return getOrdinal(val);
            }
            return padZero(val);
        };

        if (hasSlash) {
            const unitPlural = unitName === 'day of month' ? 'days' : `${unitName}s`;
            if (part === '*') {
                return `every ${step} ${unitPlural}`;
            }
            return `every ${step} ${unitPlural} starting from ${getValName(start)}`;
        }

        if (start !== end) {
            return `from ${getValName(start)} through ${getValName(end)}`;
        }

        return getValName(start);
    });

    if (descriptions.length === 1) {
        if (expr.includes('/') || expr.includes('-')) {
            return descriptions[0];
        }
        if (unitName === 'minute') {
            return `at minute ${descriptions[0]}`;
        }
        if (unitName === 'hour') {
            return `at hour ${descriptions[0]}`;
        }
        if (unitName === 'day of month') {
            return `on the ${descriptions[0]}`;
        }
        if (unitName === 'month') {
            return `in ${descriptions[0]}`;
        }
        if (unitName === 'day of week') {
            return `on ${descriptions[0]}`;
        }
    }

    // Join multiple descriptions
    const last = descriptions.pop();
    const prefix = descriptions.join(', ');
    const listStr = `${prefix} and ${last}`;

    if (unitName === 'minute') return `at minutes ${listStr}`;
    if (unitName === 'hour') return `at hours ${listStr}`;
    if (unitName === 'day of month') return `on the ${listStr}`;
    if (unitName === 'month') return `in ${listStr}`;
    if (unitName === 'day of week') return `on ${listStr}`;

    return listStr;
}

// Complete CRON validation and translation
function explainExpression(cronStr) {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5) {
        return {
            isValid: false,
            error: "CRON expression must have exactly 5 fields: minute, hour, day of month, month, day of week"
        };
    }

    // Validate fields first
    const minutes = parseField(parts[0], 0, 59);
    const hours = parseField(parts[1], 0, 23);
    const days = parseField(parts[2], 1, 31);
    const months = parseField(parts[3], 1, 12, MONTH_MAP);
    const weekdays = parseField(parts[4], 0, 7, WEEKDAY_MAP);

    if (!minutes) return { isValid: false, error: "Invalid Minute field (must be 0-59, support *, -, /, ,)" };
    if (!hours) return { isValid: false, error: "Invalid Hour field (must be 0-23, support *, -, /, ,)" };
    if (!days) return { isValid: false, error: "Invalid Day of Month field (must be 1-31, support *, -, /, ,)" };
    if (!months) return { isValid: false, error: "Invalid Month field (must be 1-12 or JAN-DEC)" };
    if (!weekdays) return { isValid: false, error: "Invalid Day of Week field (must be 0-7 or SUN-SAT)" };

    // Compile descriptions
    const minDesc = describeField(parts[0], 'minute', 0, 59);
    const hourDesc = describeField(parts[1], 'hour', 0, 23);
    const dayDesc = describeField(parts[2], 'day of month', 1, 31);
    const monthDesc = describeField(parts[3], 'month', 1, 12, MONTH_MAP, MONTH_NAMES);
    const weekdayDesc = describeField(parts[4], 'day of week', 0, 7, WEEKDAY_MAP, WEEKDAY_NAMES);

    // Build human-readable output
    let timePart = "";
    // Check if both minute and hour are single constants
    const isSingleMin = /^\d+$/.test(parts[0]);
    const isSingleHour = /^\d+$/.test(parts[1]);

    if (isSingleMin && isSingleHour) {
        const m = parseInt(parts[0], 10);
        const h = parseInt(parts[1], 10);
        timePart = `At ${padZero(h)}:${padZero(m)}`;
    } else {
        // Capitalize first letter of time part
        const rawMin = minDesc.charAt(0).toUpperCase() + minDesc.slice(1);
        timePart = `${rawMin}, ${hourDesc}`;
    }

    let dateParts = [];
    if (parts[2] !== '*') {
        dateParts.push(dayDesc);
    }
    if (parts[3] !== '*') {
        dateParts.push(monthDesc);
    }
    if (parts[4] !== '*') {
        dateParts.push(weekdayDesc);
    }

    let sentence = timePart;
    if (dateParts.length > 0) {
        sentence += `, ${dateParts.join(', ')}`;
    } else {
        sentence += `, every day`;
    }

    return {
        isValid: true,
        description: sentence + ".",
        fields: {
            minute: minDesc,
            hour: hourDesc,
            dayOfMonth: dayDesc,
            month: monthDesc,
            dayOfWeek: weekdayDesc
        }
    };
}

// Next executions engine
function getNextExecutions(cronStr, count = 5) {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const minutes = parseField(parts[0], 0, 59);
    const hours = parseField(parts[1], 0, 23);
    const days = parseField(parts[2], 1, 31);
    const months = parseField(parts[3], 1, 12, MONTH_MAP);
    const weekdays = parseField(parts[4], 0, 7, WEEKDAY_MAP);

    if (!minutes || !hours || !days || !months || !weekdays) return [];

    const results = [];
    let current = new Date();
    // Round up to next minute
    current.setSeconds(0);
    current.setMilliseconds(0);
    current.setMinutes(current.getMinutes() + 1);

    const isDomRestricted = parts[2] !== '*';
    const isDowRestricted = parts[4] !== '*';

    let iterations = 0;
    const maxIterations = 50000; // safety ceiling

    while (results.length < count && iterations < maxIterations) {
        iterations++;
        const currentMonth = current.getMonth() + 1; // 1-12
        const currentDay = current.getDate();
        const currentWeekday = current.getDay(); // 0-6
        const currentHour = current.getHours();
        const currentMin = current.getMinutes();

        // Check month
        if (!months.has(currentMonth)) {
            current.setMonth(current.getMonth() + 1);
            current.setDate(1);
            current.setHours(0);
            current.setMinutes(0);
            continue;
        }

        // Check DOM and DOW standard crontab execution check
        let dateMatches = false;
        if (isDomRestricted && isDowRestricted) {
            const matchesDom = days.has(currentDay);
            const matchesDow = weekdays.has(currentWeekday) || (currentWeekday === 0 && weekdays.has(7)) || (currentWeekday === 7 && weekdays.has(0));
            dateMatches = matchesDom || matchesDow;
        } else {
            const matchesDom = days.has(currentDay);
            const matchesDow = weekdays.has(currentWeekday) || (currentWeekday === 0 && weekdays.has(7)) || (currentWeekday === 7 && weekdays.has(0));
            dateMatches = matchesDom && matchesDow;
        }

        if (!dateMatches) {
            current.setDate(current.getDate() + 1);
            current.setHours(0);
            current.setMinutes(0);
            continue;
        }

        // Check hour
        if (!hours.has(currentHour)) {
            current.setHours(current.getHours() + 1);
            current.setMinutes(0);
            continue;
        }

        // Check minute
        if (!minutes.has(currentMin)) {
            current.setMinutes(current.getMinutes() + 1);
            continue;
        }

        // Found match
        results.push(new Date(current));
        current.setMinutes(current.getMinutes() + 1);
    }

    return results;
}

// Populate select dropdowns programmatically
function populateSelects() {
    const fillSelect = (id, start, end, formatFn = x => x) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = "";
        for (let i = start; i <= end; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = formatFn(i);
            el.appendChild(opt);
        }
    };

    // Minutes
    fillSelect("minuteStepStart", 0, 59, padZero);
    fillSelect("minuteStepValue", 1, 59);
    fillSelect("minuteRangeStart", 0, 59, padZero);
    fillSelect("minuteRangeEnd", 0, 59, padZero);

    // Hours
    fillSelect("hourStepStart", 0, 23, padZero);
    fillSelect("hourStepValue", 1, 23);
    fillSelect("hourRangeStart", 0, 23, padZero);
    fillSelect("hourRangeEnd", 0, 23, padZero);

    // DOM
    fillSelect("domStepStart", 1, 31);
    fillSelect("domStepValue", 1, 31);
    fillSelect("domRangeStart", 1, 31);
    fillSelect("domRangeEnd", 1, 31);

    // Months
    fillSelect("monthStepStart", 1, 12, x => MONTH_NAMES[x - 1]);
    fillSelect("monthStepValue", 1, 12);
    fillSelect("monthRangeStart", 1, 12, x => MONTH_NAMES[x - 1]);
    fillSelect("monthRangeEnd", 1, 12, x => MONTH_NAMES[x - 1]);

    // DOW
    fillSelect("dowStepStart", 0, 6, x => WEEKDAY_NAMES[x]);
    fillSelect("dowStepValue", 1, 6);
    fillSelect("dowRangeStart", 0, 6, x => WEEKDAY_NAMES[x]);
    fillSelect("dowRangeEnd", 0, 6, x => WEEKDAY_NAMES[x]);
}

// Front-end Binding Orchestrator
document.addEventListener("DOMContentLoaded", () => {
    const cronInput = document.getElementById("cronInput");
    const statusPanel = document.getElementById("statusPanel");

    // Field badges value cells
    const valMin = document.getElementById("valMin");
    const valHour = document.getElementById("valHour");
    const valDom = document.getElementById("valDom");
    const valMonth = document.getElementById("valMonth");
    const valDow = document.getElementById("valDow");

    const nextExecutionsContainer = document.getElementById("nextExecutions");

    // Populate dropdown selectors and grids
    populateSelects();
    initGrids();


    // Setup active listeners
    cronInput.addEventListener("input", handleCronInputUpdate);
    setupTabSwitching();
    setupBuilderChangeListeners();

    // Load initial standard default
    cronInput.value = "*/15 9-17 * * 1-5";
    handleCronInputUpdate();
});

// Render the Checkbox grids for Minute, Hour, DOM, Month, DOW
function initGrids() {
    // Minutes (0-59)
    const minGrid = document.getElementById("minSpecificGrid");
    for (let i = 0; i <= 59; i++) {
        minGrid.appendChild(createCheckboxItem("minute", i, padZero(i)));
    }

    // Hours (0-23)
    const hourGrid = document.getElementById("hourSpecificGrid");
    for (let i = 0; i <= 23; i++) {
        hourGrid.appendChild(createCheckboxItem("hour", i, padZero(i)));
    }

    // Days of Month (1-31)
    const domGrid = document.getElementById("domSpecificGrid");
    for (let i = 1; i <= 31; i++) {
        domGrid.appendChild(createCheckboxItem("dom", i, i));
    }

    // Months (1-12)
    const monthGrid = document.getElementById("monthSpecificGrid");
    MONTH_NAMES.forEach((name, idx) => {
        monthGrid.appendChild(createCheckboxItem("month", idx + 1, name.substring(0, 3).toUpperCase()));
    });

    // Weekdays (0-6)
    const dowGrid = document.getElementById("dowSpecificGrid");
    const daysShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    daysShort.forEach((name, idx) => {
        dowGrid.appendChild(createCheckboxItem("dow", idx, name));
    });
}

function createCheckboxItem(prefix, value, label) {
    const wrapper = document.createElement("label");
    wrapper.className = "checkbox-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `${prefix}_val`;
    input.value = value;

    input.addEventListener("change", () => {
        if (input.checked) {
            wrapper.classList.add("checked");
        } else {
            wrapper.classList.remove("checked");
        }
        // Sync visual builder output back to input
        syncBuilderToInput();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(label));
    return wrapper;
}

// Handle Tab switching
function setupTabSwitching() {
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });
}

// Monitor builder changes to trigger compiling
function setupBuilderChangeListeners() {
    const controls = document.querySelectorAll(".tab-content input, .tab-content select");
    controls.forEach(ctrl => {
        // Checkboxes have their own sync on click (defined in createCheckboxItem)
        if (ctrl.type !== "checkbox") {
            ctrl.addEventListener("change", () => {
                // If a subfield setting changes, make sure the matching radio gets checked
                const tabId = ctrl.closest(".tab-content").id;
                const fieldPrefix = tabId.replace("tab-", "");

                // Determine which radio group we are in
                const modeRadios = document.getElementsByName(`${fieldPrefix}_mode`);

                // If user changes a dropdown, auto-select the corresponding radio mode
                if (ctrl.id.includes("Step")) {
                    document.getElementById(`${fieldPrefix}ModeStep`).checked = true;
                } else if (ctrl.id.includes("Range")) {
                    document.getElementById(`${fieldPrefix}ModeRange`).checked = true;
                }

                syncBuilderToInput();
            });
        }
    });
}

// Synchronize Text Box -> Visual Builder Controls
function syncInputToBuilder(cronStr) {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5) return;

    const fields = ["minute", "hour", "dom", "month", "dow"];
    const mins = [0, 1, 1, 1, 0];
    const maxs = [59, 23, 31, 12, 6]; // We bind DOW as 0-6 in UI
    const maps = [null, null, null, MONTH_MAP, WEEKDAY_MAP];

    fields.forEach((field, index) => {
        const val = parts[index];
        const minVal = mins[index];
        const maxVal = maxs[index];
        const nameMap = maps[index];

        const everyRadio = document.getElementById(`${field}ModeEvery`);
        const stepRadio = document.getElementById(`${field}ModeStep`);
        const rangeRadio = document.getElementById(`${field}ModeRange`);
        const specificRadio = document.getElementById(`${field}ModeSpecific`);

        const stepStart = document.getElementById(`${field}StepStart`);
        const stepVal = document.getElementById(`${field}StepValue`);
        const rangeStart = document.getElementById(`${field}RangeStart`);
        const rangeEnd = document.getElementById(`${field}RangeEnd`);

        // Helper to reset checkboxes
        const checkboxes = document.querySelectorAll(`input[name="${field}_val"]`);
        checkboxes.forEach(chk => {
            chk.checked = false;
            chk.parentElement.classList.remove("checked");
        });

        if (val === "*") {
            everyRadio.checked = true;
        } else if (val.includes("/") && !val.includes(",")) {
            stepRadio.checked = true;
            const slashParts = val.split("/");
            let startPart = slashParts[0];
            let stepNum = slashParts[1] || "1";

            if (startPart === "*") {
                stepStart.value = minVal;
            } else {
                stepStart.value = startPart;
            }
            stepVal.value = stepNum;
        } else if (val.includes("-") && !val.includes(",") && !val.includes("/")) {
            rangeRadio.checked = true;
            const dashParts = val.split("-");
            rangeStart.value = dashParts[0];
            rangeEnd.value = dashParts[1];
        } else {
            // Complex list or specific single values
            specificRadio.checked = true;
            const allowed = parseField(val, minVal, maxVal, nameMap);
            if (allowed) {
                checkboxes.forEach(chk => {
                    const checkVal = parseInt(chk.value, 10);
                    if (allowed.has(checkVal)) {
                        chk.checked = true;
                        chk.parentElement.classList.add("checked");
                    }
                });
            }
        }
    });
}

// Compile Visual Builder -> Text Box
function syncBuilderToInput() {
    const fields = ["minute", "hour", "dom", "month", "dow"];
    const compiledFields = fields.map(field => {
        const mode = document.querySelector(`input[name="${field}_mode"]:checked`).value;
        if (mode === "every") {
            return "*";
        } else if (mode === "step") {
            const start = document.getElementById(`${field}StepStart`).value;
            const step = document.getElementById(`${field}StepValue`).value;
            return `${start}/${step}`;
        } else if (mode === "range") {
            const start = document.getElementById(`${field}RangeStart`).value;
            const end = document.getElementById(`${field}RangeEnd`).value;
            return `${start}-${end}`;
        } else if (mode === "specific") {
            const checked = Array.from(document.querySelectorAll(`input[name="${field}_val"]:checked`))
                .map(chk => chk.value);
            if (checked.length === 0) return "*"; // fallback
            return checked.join(",");
        }
        return "*";
    });

    const expr = compiledFields.join(" ");
    document.getElementById("cronInput").value = expr;
    updateAnalysis(expr);
}

// Handle keystrokes on the input text box
function handleCronInputUpdate() {
    const expr = document.getElementById("cronInput").value.trim();
    updateAnalysis(expr);
    syncInputToBuilder(expr);
}

// Update the output UI components
function updateAnalysis(cronStr) {
    const statusPanel = document.getElementById("statusPanel");
    const nextExecutionsContainer = document.getElementById("nextExecutions");
    const valMin = document.getElementById("valMin");
    const valHour = document.getElementById("valHour");
    const valDom = document.getElementById("valDom");
    const valMonth = document.getElementById("valMonth");
    const valDow = document.getElementById("valDow");

    if (!cronStr) {
        statusPanel.className = "status-panel";
        statusPanel.innerHTML = "Type a 5-field CRON expression above to begin...";
        return;
    }

    const analysis = explainExpression(cronStr);
    if (analysis.isValid) {
        statusPanel.className = "status-panel success";
        statusPanel.innerHTML = `<strong>Description:</strong> ${analysis.description}`;

        // Update detail badges
        valMin.textContent = analysis.fields.minute;
        valHour.textContent = analysis.fields.hour;
        valDom.textContent = analysis.fields.dayOfMonth;
        valMonth.textContent = analysis.fields.month;
        valDow.textContent = analysis.fields.dayOfWeek;

        // Calculate next dates
        const dates = getNextExecutions(cronStr, 5);
        nextExecutionsContainer.innerHTML = "";

        if (dates.length > 0) {
            dates.forEach((date, index) => {
                const li = document.createElement("li");
                li.className = "execution-item";

                const idx = document.createElement("div");
                idx.className = "execution-index";
                idx.textContent = index + 1;

                const timeStr = document.createElement("div");
                timeStr.className = "execution-time";

                // Format details
                const y = date.getFullYear();
                const m = MONTH_NAMES[date.getMonth()];
                const d = getOrdinal(date.getDate());
                const dayName = WEEKDAY_NAMES[date.getDay()];
                const hh = padZero(date.getHours());
                const mm = padZero(date.getMinutes());

                timeStr.textContent = `${dayName}, ${m} ${d}, ${y} @ ${hh}:${mm}`;

                li.appendChild(idx);
                li.appendChild(timeStr);
                nextExecutionsContainer.appendChild(li);
            });
        } else {
            nextExecutionsContainer.innerHTML = '<li class="execution-item error-msg">Cannot calculate next dates. The expression may specify an impossible schedule.</li>';
        }
    } else {
        statusPanel.className = "status-panel error";
        statusPanel.innerHTML = `<strong>Syntax Error:</strong> ${analysis.error}`;

        // Reset field badges
        valMin.textContent = "-";
        valHour.textContent = "-";
        valDom.textContent = "-";
        valMonth.textContent = "-";
        valDow.textContent = "-";

        nextExecutionsContainer.innerHTML = '<li class="execution-item error-msg">Fix syntax error to see next execution times.</li>';
    }
}
