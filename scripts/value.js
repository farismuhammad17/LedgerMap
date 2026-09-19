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

// Helper to calculate interval in days from number + unit
function getFrequencyInDays(num, unit) {
    const n = parseInt(num) || 1;
    switch (unit) {
        case 'weeks': return n * 7;
        case 'months': return n * 30;
        case 'years': return n * 365;
        case 'days':
        default: return n;
    }
}

function ensureSimulation(maxNeededDay) {
    const entriesJson = localStorage.getItem('ledgerEntries') || '[]';
    const disabledEntries = getDisabledEntryNames();

    const toggleStateStr = Array.from(disabledEntries).join(',');
    const cacheKey = entriesJson + '|' + toggleStateStr;

    if (cacheKey !== simulationBuiltFor || maxNeededDay > simMaxDay || simMinDay > -200) {
        if (cacheKey !== simulationBuiltFor) {
            dailyBalances = {};
            dailyGains = {};
            dailyLosses = {};
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
                rateUnit: e.rateUnit || 'monthly',
                payment: parseFloat(e.payment) || 0,
                payFreqNum: parseInt(e.payFreqNum) || 1,
                payFreqUnit: e.payFreqUnit || 'months',
                start: parseInt(e.start) || 0,
                end: e.end !== null && e.end !== undefined ? parseInt(e.end) : null,
                active: false
            }));

        let runningBalance = 0;
        let totalGainSoFar = 0;
        let totalLossSoFar = 0;

        for (let d = simMinDay; d <= simMaxDay; d++) {
            let dailyChange = 0;
            let dayGain = 0;
            let dayLoss = 0;

            entries.forEach(e => {
                if (disabledEntries.has(e.name)) return;

                if (e.type === 'recurring') {
                    const start = parseInt(e.start) || 0;
                    const end = e.end !== null && e.end !== undefined ? parseInt(e.end) : null;
                    const freq = getFrequencyInDays(e.freqNum, e.freqUnit);

                    if (d >= start && (end === null || d <= end) && (d - start) % freq === 0) {
                        const val = parseFloat(e.val) || 0;
                        dailyChange += val;
                        if (val > 0) dayGain += val;
                        else if (val < 0) dayLoss += val;
                    }
                } else if (e.type === 'once') {
                    const day = parseInt(e.day) || 0;
                    if (d === day) {
                        const val = parseFloat(e.val) || 0;
                        dailyChange += val;
                        if (val > 0) dayGain += val;
                        else if (val < 0) dayLoss += val;
                    }
                }
            });

            runningBalance += dailyChange;

            loansState.forEach(loan => {
                if (d === loan.start) {
                    loan.active = true;
                }
                // Stop loan if it hits its end day or principal drops to 0
                if (loan.end !== null && d >= loan.end) {
                    loan.active = false;
                }

                if (loan.active && loan.principal > 0) {
                    let dailyInterestRate = 0;
                    if (loan.rateUnit === 'yearly') {
                        dailyInterestRate = (loan.rate / 100) / 365;
                    } else {
                        dailyInterestRate = (loan.rate / 100) / 30;
                    }
                    loan.principal += loan.principal * dailyInterestRate;

                    const payFreq = getFrequencyInDays(loan.payFreqNum, loan.payFreqUnit);

                    if ((d - loan.start) > 0 && (d - loan.start) % payFreq === 0) {
                        loan.principal -= loan.payment;
                        if (loan.principal < 0) loan.principal = 0;
                        // Loan payments count as a cash outflow (loss)
                        dayLoss -= loan.payment;
                    }
                }
            });

            // Accumulate total gains and losses from day 0 onwards
            if (d >= 0) {
                totalGainSoFar += dayGain;
                totalLossSoFar += dayLoss; // accumulated negative values
            }

            let totalLoanLiability = loansState.reduce((sum, l) => sum + (l.active ? l.principal : 0), 0);

            dailyBalances[d] = runningBalance - totalLoanLiability;
            dailyGains[d] = totalGainSoFar;
            dailyLosses[d] = totalLossSoFar;
        }
    }
}

function getValueAt(day) {
    const targetDay = Math.round(day);
    ensureSimulation(targetDay);
    return dailyBalances[targetDay] ?? 0;
}
