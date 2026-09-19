document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', handleFileImport);
});

// File Import & Export Handlers

function exportData() {
    const data = localStorage.getItem('ledgerEntries') || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger-inputs.json';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target.result);
            if (!Array.isArray(parsed)) throw new Error("Invalid format");

            // Save to local storage
            localStorage.setItem('ledgerEntries', JSON.stringify(parsed));

            // Clear current UI elements and reload from imported data
            const container = document.getElementById('entriesContainer');
            if (container) container.innerHTML = '';
            loadSavedEntries();

            alert('Ledger inputs imported successfully!');
        } catch (err) {
            console.error("Failed to parse imported JSON file:", err);
            alert('Error: Invalid JSON ledger file.');
        } finally {
            e.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}
