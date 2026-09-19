document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addBtn').addEventListener('click', addEntry);
    document.getElementById('saveBtn').addEventListener('click', saveData);

    try {
        const saved = JSON.parse(localStorage.getItem('ledgerEntries') || '[]');
        saved.forEach(entry => createEntryElement(entry.type, entry));
    } catch (e) {
        console.error("Failed to load saved ledger entries:", e);
    }
});

function addEntry() {
    const select = document.getElementById('entryTypeSelect');
    if (!select) return;
    createEntryElement(select.value, null);
}

function createEntryElement(type, data) {
    const container = document.getElementById('entriesContainer');
    const template = document.getElementById(`template-${type}`);

    if (!container || !template) return;

    const details = document.createElement('details');
    details.open = true;
    details.dataset.type = type;

    let title = data?.name || `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const clone = template.content.cloneNode(true);

    if (data) {
        const nameInput = clone.querySelector('.fieldName');
        if (nameInput) nameInput.value = data.name || '';

        if (type === 'recurring') {
            clone.querySelector('.fieldVal').value = data.val ?? '';
            clone.querySelector('.fieldFreqNum').value = data.freqNum ?? 1;
            clone.querySelector('.fieldFreqUnit').value = data.freqUnit ?? 'months';
            clone.querySelector('.fieldStart').value = data.start ?? 0;
        } else if (type === 'once') {
            clone.querySelector('.fieldVal').value = data.val ?? '';
            clone.querySelector('.fieldDay').value = data.day ?? 0;
        } else if (type === 'loan') {
            clone.querySelector('.fieldPrincipal').value = data.principal ?? '';
            clone.querySelector('.fieldRate').value = data.rate ?? '';
            clone.querySelector('.fieldRateUnit').value = data.rateUnit ?? 'monthly';
            clone.querySelector('.fieldPayment').value = data.payment ?? '';
            clone.querySelector('.fieldPayFreqNum').value = data.payFreqNum ?? 1;
            clone.querySelector('.fieldPayFreqUnit').value = data.payFreqUnit ?? 'months';
            clone.querySelector('.fieldStart').value = data.start ?? 0;
        }
    }

    const deleteBtn = clone.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => details.remove());
    }

    details.innerHTML = `<summary>[${type.toUpperCase()}] <span class="summary-title">${title}</span></summary>`;
    details.appendChild(clone);
    container.appendChild(details);
}

function updateSummary(input) {
    const details = input.closest('details');
    const titleSpan = details?.querySelector('.summary-title');
    if (titleSpan) {
        titleSpan.textContent = input.value || 'Untitled';
    }
}

function saveData() {
    const entries = [];
    const detailsNodes = document.querySelectorAll('#entriesContainer details');

    detailsNodes.forEach(details => {
        const type = details.dataset.type;
        const getVal = (selector) => details.querySelector(selector)?.value || '';

        if (type === 'recurring') {
            entries.push({
                type: 'recurring',
                name: getVal('.fieldName'),
                val: parseFloat(getVal('.fieldVal')) || 0,
                freqNum: parseInt(getVal('.fieldFreqNum')) || 1,
                freqUnit: getVal('.fieldFreqUnit'),
                start: parseInt(getVal('.fieldStart')) || 0
            });
        } else if (type === 'once') {
            entries.push({
                type: 'once',
                name: getVal('.fieldName'),
                val: parseFloat(getVal('.fieldVal')) || 0,
                day: parseInt(getVal('.fieldDay')) || 0
            });
        } else if (type === 'loan') {
            entries.push({
                type: 'loan',
                name: getVal('.fieldName'),
                principal: parseFloat(getVal('.fieldPrincipal')) || 0,
                rate: parseFloat(getVal('.fieldRate')) || 0,
                rateUnit: getVal('.fieldRateUnit'),
                payment: parseFloat(getVal('.fieldPayment')) || 0,
                payFreqNum: parseInt(getVal('.fieldPayFreqNum')) || 1,
                payFreqUnit: getVal('.fieldPayFreqUnit'),
                start: parseInt(getVal('.fieldStart')) || 0
            });
        }
    });

    localStorage.setItem('ledgerEntries', JSON.stringify(entries));
    window.location.href = 'index.html';
}
