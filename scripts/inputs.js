document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addBtn');
    const saveBtn = document.getElementById('saveBtn');

    if (addBtn) addBtn.addEventListener('click', addEntry);
    if (saveBtn) saveBtn.addEventListener('click', saveData);

    loadSavedEntries();
});

// Event Handlers

function addEntry() {
    const select = document.getElementById('entryTypeSelect');
    if (!select) return;
    createEntryElement(select.value, null);
}

function updateSummary(input) {
    const details = input.closest('details');
    const titleSpan = details?.querySelector('.summary-title');
    if (titleSpan) {
        titleSpan.textContent = input.value || 'Untitled';
    }
}

// Helper to convert value + unit into absolute days
function convertToDays(val, unit) {
    const num = parseFloat(val) || 0;
    switch (unit) {
        case 'weeks': return Math.round(num * 7);
        case 'months': return Math.round(num * 30);
        case 'years': return Math.round(num * 365);
        case 'days':
        default: return Math.round(num);
    }
}

function saveData() {
    const entries = [];
    const detailsNodes = document.querySelectorAll('#entriesContainer details');

    detailsNodes.forEach(details => {
        const type = details.dataset.type;
        const getVal = (selector) => details.querySelector(selector)?.value || '';

        if (type === 'recurring') {
            const rawStart = getVal('.fieldStartNum');
            const startUnit = getVal('.fieldStartUnit');
            const rawEnd = getVal('.fieldEndNum');
            const endUnit = getVal('.fieldEndUnit');

            entries.push({
                type: 'recurring',
                name: getVal('.fieldName'),
                val: parseFloat(getVal('.fieldVal')) || 0,
                freqNum: parseInt(getVal('.fieldFreqNum')) || 1,
                freqUnit: getVal('.fieldFreqUnit'),
                start: convertToDays(rawStart, startUnit),
                startNum: rawStart,
                startUnit: startUnit,
                end: rawEnd !== '' ? convertToDays(rawEnd, endUnit) : null,
                endNum: rawEnd,
                endUnit: endUnit
            });
        } else if (type === 'once') {
            entries.push({
                type: 'once',
                name: getVal('.fieldName'),
                val: parseFloat(getVal('.fieldVal')) || 0,
                day: parseInt(getVal('.fieldDay')) || 0
            });
        } else if (type === 'loan') {
            const rawStart = getVal('.fieldStartNum');
            const startUnit = getVal('.fieldStartUnit');
            const rawEnd = getVal('.fieldEndNum');
            const endUnit = getVal('.fieldEndUnit');

            entries.push({
                type: 'loan',
                name: getVal('.fieldName'),
                principal: parseFloat(getVal('.fieldPrincipal')) || 0,
                rate: parseFloat(getVal('.fieldRate')) || 0,
                rateUnit: getVal('.fieldRateUnit'),
                payment: parseFloat(getVal('.fieldPayment')) || 0,
                payFreqNum: parseInt(getVal('.fieldPayFreqNum')) || 1,
                payFreqUnit: getVal('.fieldPayFreqUnit'),
                start: convertToDays(rawStart, startUnit),
                startNum: rawStart,
                startUnit: startUnit,
                end: rawEnd !== '' ? convertToDays(rawEnd, endUnit) : null,
                endNum: rawEnd,
                endUnit: endUnit
            });
        }
    });

    localStorage.setItem('ledgerEntries', JSON.stringify(entries));
    window.location.href = 'index.html';
}

// Core Functions

function loadSavedEntries() {
    try {
        const saved = JSON.parse(localStorage.getItem('ledgerEntries') || '[]');
        saved.forEach(entry => createEntryElement(entry.type, entry));
    } catch (e) {
        console.error("Failed to load saved ledger entries:", e);
    }
}

function createEntryElement(type, data) {
    const container = document.getElementById('entriesContainer');
    const detailsTemplate = document.getElementById('template-entry-details');
    const innerTemplate = document.getElementById(`template-${type}`);

    if (!container || !detailsTemplate || !innerTemplate) return;

    const detailsClone = detailsTemplate.content.cloneNode(true);
    const details = detailsClone.querySelector('details');
    details.dataset.type = type;

    const title = data?.name || `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    details.querySelector('.entry-type-badge').textContent = `[${type}]`;
    details.querySelector('.summary-title').textContent = title;

    const contentClone = innerTemplate.content.cloneNode(true);

    if (data) {
        const nameInput = contentClone.querySelector('.fieldName');
        if (nameInput) nameInput.value = data.name || '';

        if (type === 'recurring') {
            contentClone.querySelector('.fieldVal').value = data.val ?? '';
            contentClone.querySelector('.fieldFreqNum').value = data.freqNum ?? 1;
            contentClone.querySelector('.fieldFreqUnit').value = data.freqUnit ?? 'months';

            contentClone.querySelector('.fieldStartNum').value = data.startNum ?? data.start ?? 0;
            contentClone.querySelector('.fieldStartUnit').value = data.startUnit ?? 'days';

            if (data.endNum !== undefined && data.endNum !== null) {
                contentClone.querySelector('.fieldEndNum').value = data.endNum;
                contentClone.querySelector('.fieldEndUnit').value = data.endUnit ?? 'days';
            }
        } else if (type === 'once') {
            contentClone.querySelector('.fieldVal').value = data.val ?? '';
            contentClone.querySelector('.fieldDay').value = data.day ?? 0;
        } else if (type === 'loan') {
            contentClone.querySelector('.fieldPrincipal').value = data.principal ?? '';
            contentClone.querySelector('.fieldRate').value = data.rate ?? '';
            contentClone.querySelector('.fieldRateUnit').value = data.rateUnit ?? 'monthly';
            contentClone.querySelector('.fieldPayment').value = data.payment ?? '';
            contentClone.querySelector('.fieldPayFreqNum').value = data.payFreqNum ?? 1;
            contentClone.querySelector('.fieldPayFreqUnit').value = data.payFreqUnit ?? 'months';

            contentClone.querySelector('.fieldStartNum').value = data.startNum ?? data.start ?? 0;
            contentClone.querySelector('.fieldStartUnit').value = data.startUnit ?? 'days';

            if (data.endNum !== undefined && data.endNum !== null) {
                contentClone.querySelector('.fieldEndNum').value = data.endNum;
                contentClone.querySelector('.fieldEndUnit').value = data.endUnit ?? 'days';
            }
        }
    }

    const deleteBtn = contentClone.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => details.remove());
    }

    // Move Up / Move Down Handlers (Scoped properly here!)
    const moveUpBtn = details.querySelector('.move-up-btn');
    const moveDownBtn = details.querySelector('.move-down-btn');

    if (moveUpBtn) {
        moveUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (details.previousElementSibling) {
                container.insertBefore(details, details.previousElementSibling);
            }
        });
    }

    if (moveDownBtn) {
        moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (details.nextElementSibling) {
                container.insertBefore(details.nextElementSibling, details);
            }
        });
    }

    const nameInputField = contentClone.querySelector('.fieldName');
    if (nameInputField) {
        nameInputField.addEventListener('input', (e) => updateSummary(e.target));
    }

    details.querySelector('.entry-content-wrapper').appendChild(contentClone);
    container.appendChild(details);
}
