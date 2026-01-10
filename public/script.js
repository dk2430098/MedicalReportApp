function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`${tab}-input`).classList.add('active');
}

function updateFileName() {
    const fileInput = document.getElementById('report-image');
    const fileNameSpan = document.getElementById('file-name');
    if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
        fileNameSpan.style.color = 'var(--primary)';
    }
}

async function processText() {
    const text = document.getElementById('report-text').value;
    if (!text) return alert("Please enter some text.");

    await callApi('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });
}

async function processImage() {
    const fileInput = document.getElementById('report-image');
    if (fileInput.files.length === 0) return alert("Please select an image.");

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    await callApi('/process-image', {
        method: 'POST',
        body: formData
    });
}

async function callApi(endpoint, options) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const placeholder = document.getElementById('placeholder-state');

    placeholder.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const response = await fetch(endpoint, options);
        const data = await response.json();

        displayResults(data);
    } catch (error) {
        alert("Error processing report: " + error.message);
        placeholder.classList.remove('hidden'); // Show placeholder again on error
    } finally {
        loading.classList.add('hidden');
    }
}

function displayResults(data) {
    const results = document.getElementById('results');
    const placeholder = document.getElementById('placeholder-state');

    placeholder.classList.add('hidden'); // Ensure placeholder is gone
    const summaryText = document.getElementById('summary-text');
    const explanationsList = document.getElementById('explanations-list');
    const resultsTable = document.getElementById('results-table');
    const rawJson = document.getElementById('raw-json');

    // Display Summary (from Step 3)
    const summaryData = data.step_3_summary || data; // Fallback if old format
    summaryText.textContent = summaryData.summary || "No summary available.";

    explanationsList.innerHTML = '';
    if (summaryData.explanations) {
        summaryData.explanations.forEach(exp => {
            const li = document.createElement('li');
            li.textContent = exp;
            explanationsList.appendChild(li);
        });
    }

    // Display Table (from Step 2 or Final)
    resultsTable.innerHTML = '';
    const tests = data.step_2_normalization?.tests || data.tests || [];

    tests.forEach(test => {
        const row = document.createElement('tr');
        const range = test.ref_range ? `${test.ref_range.low} - ${test.ref_range.high}` : 'N/A';
        const statusClass = `status-${test.status?.toLowerCase() || 'normal'}`;

        row.innerHTML = `
            <td>${test.name}</td>
            <td>${test.value} <span style="color:var(--text-muted); font-size:0.8em">${test.unit}</span></td>
            <td><span class="status-badge ${statusClass}">${test.status || 'Normal'}</span></td>
            <td>${range}</td>
        `;
        resultsTable.appendChild(row);
    });

    // Debug Info
    rawJson.textContent = JSON.stringify(data, null, 2);

    results.classList.remove('hidden');
}
