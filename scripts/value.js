let dailyBalances = {};
let simulationBuiltFor = '';
let simMinDay = -200;
let simMaxDay = 1000;

document.addEventListener('DOMContentLoaded', () => {
    const toggleList = document.getElementById('toggleList');
    const template = document.getElementById('template-sidebar-item');
    if (!toggleList || !template) return;

    try {
        const entries = JSON.parse(localStorage.getItem('ledgerEntries') || '[]');

        if (entries.length === 0) {
            const p = document.createElement('p');
            p.className = 'sidebar-empty-msg';
            p.textContent = 'No entries found. Add some in Manage Inputs.';
            toggleList.appendChild(p);
            return;
        }

        entries.forEach(e => {
            const clone = template.content.cloneNode(true);

            const checkbox = clone.querySelector('.entry-toggle');
            checkbox.dataset.name = e.name;

            checkbox.addEventListener('change', () => {
                simulationBuiltFor = '';
                draw();
            });

            const textSpan = clone.querySelector('.entry-toggle-text');
            textSpan.textContent = `${e.name} (${e.type})`;

            toggleList.appendChild(clone);
        });
    } catch (err) {
        console.error("Failed to load sidebar toggles:", err);
    }
});

// Simulation Helpers

function getDisabledEntryNames() {
    const checkboxes = document.querySelectorAll('.entry-toggle');
    const disabled = new Set();
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            disabled.add(cb.dataset.name);
        }
    });
    return disabled;
}

function ensureSimulation(maxNeededDay) {
    const entriesJson = localStorage.getItem('ledgerEntries') || '[]';
    const disabledEntries = getDisabledEntryNames();

    const toggleStateStr = Array.from(disabledEntries).join(',');
    const cacheKey = entriesJson + '|' + toggleStateStr;

    if (cacheKey !== simulationBuiltFor || maxNeededDay > simMaxDay || simMinDay > -200) {
        if (cacheKey !== simulationBuiltFor) {
            dailyBalances = {};
            simulationBuiltFor = cacheKey;
            simMinDay = -200;
            simMaxDay = Math.max(1000, maxNeededDay + 200);
        } else if (maxNeededDay > simMaxDay) {
            simMaxDay = maxNeededDay + 200;
        }

        const entries = JSON.parse(entriesJson);

        let loansState = entries
            .filter(e => e.type === 'loan' && !disabledEntries.has(e.name))
            .map(e => ({
                name: e.name,
                principal: parseFloat(e.principal) || 0,
                rate: parseFloat(e.rate) || 0,
                payment: parseFloat(e.payment) || 0,
                start: parseInt(e.start) || 0,
                active: false
            }));

        let runningBalance = 0;

        for (let d = simMinDay; d <= simMaxDay; d++) {
            let dailyChange = 0;

            entries.forEach(e => {
                if (disabledEntries.has(e.name)) return;

                if (e.type === 'recurring') {
                    const start = parseInt(e.start) || 0;
                    const freq = parseInt(e.freq) || 30;
                    if (d >= start && (d - start) % freq === 0) {
                        dailyChange += parseFloat(e.val) || 0;
                    }
                } else if (e.type === 'once') {
                    const day = parseInt(e.day) || 0;
                    if (d === day) {
                        dailyChange += parseFloat(e.val) || 0;
                    }
                }
            });

            runningBalance += dailyChange;

            loansState.forEach(loan => {
                if (d === loan.start) {
                    loan.active = true;
                }
                if (loan.active && loan.principal > 0) {
                    const dailyInterestRate = (loan.rate / 100) / 30;
                    loan.principal += loan.principal * dailyInterestRate;

                    if ((d - loan.start) > 0 && (d - loan.start) % 30 === 0) {
                        loan.principal -= loan.payment;
                        if (loan.principal < 0) loan.principal = 0;
                    }
                }
            });

            let totalLoanLiability = loansState.reduce((sum, l) => sum + (l.active ? l.principal : 0), 0);
            dailyBalances[d] = runningBalance - totalLoanLiability;
        }
    }
}

function getValueAt(day) {
    const targetDay = Math.round(day);
    ensureSimulation(targetDay);
    return dailyBalances[targetDay] ?? 0;
}
