// API base URL
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let currentFilters = [];
let editingEmployeeId = null;

// Dashboard charts
let assetTypeChart, companyChart, osChart;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const employeeForm = document.getElementById('employeeForm');
const employeeTable = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
const filterColumn = document.getElementById('filterColumn');
const filterValue = document.getElementById('filterValue');
const addFilterBtn = document.getElementById('addFilter');
const activeFilters = document.getElementById('activeFilters');
const dropdownCategory = document.getElementById('dropdownCategory');
const newOption = document.getElementById('newOption');
const addOptionBtn = document.getElementById('addOption');
const dropdownOptions = document.getElementById('dropdownOptions');
const exportBtn = document.getElementById('exportBtn');

// Initialize dropdowns
const dropdowns = {
    assetType: document.getElementById('assetType'),
    os: document.getElementById('os'),
    company: document.getElementById('company')
};

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Load dropdown options when switching to the dropdowns tab
        if (tabId === 'dropdowns') {
            loadDropdownOptionsList();
        }
        // Initialize dashboard when switching to dashboard tab
        else if (tabId === 'dashboard') {
            initializeDashboard();
        }
    });
});

// Load initial data
async function loadInitialData() {
    await loadDropdownOptions();
    await loadEmployees();
    populateFilterColumns();
}

// Load dropdown options
async function loadDropdownOptions() {
    const categories = ['asset_type', 'os', 'company'];

    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE_URL}/dropdown-options/${category}`);
            const options = await response.json();

            // Handle category name conversion properly
            let dropdownId;
            if (category === 'asset_type') {
                dropdownId = 'assetType';
            } else {
                dropdownId = category;
            }

            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) continue;

            // Clear existing options except the first one (placeholder)
            while (dropdown.options.length > 0) {
                dropdown.remove(0);
            }

            // Add placeholder option
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = `Select ${category.replace('_', ' ')}`;
            placeholder.disabled = true;
            placeholder.selected = true;
            dropdown.appendChild(placeholder);

            // Add options
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                dropdown.appendChild(optionElement);
            });
        } catch (error) {
            console.error(`Error loading ${category} options:`, error);
        }
    }
}

// Load employees
async function loadEmployees() {
    try {
        // Convert filters to query parameters
        const filterParams = currentFilters.reduce((acc, filter) => {
            acc[filter.column] = filter.value;
            return acc;
        }, {});

        const queryString = new URLSearchParams(filterParams).toString();
        const url = `${API_BASE_URL}/employees${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        const employees = await response.json();

        // Update table
        employeeTable.innerHTML = '';

        employees.forEach(employee => {
            const row = employeeTable.insertRow();
            row.innerHTML = `
                <td>${employee.serial_number}</td>
                <td>${employee.employee_name}</td>
                <td>${employee.asset_type}</td>
                <td>${employee.asset_issued_date}</td>
                <td>${employee.os}</td>
                <td>${employee.email}</td>
                <td>${employee.company}</td>
                <td>${employee.monitor_type}</td>
                <td>${employee.monitor_tag}</td>
                <td>${employee.asset_id}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editEmployee(${employee.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteEmployee(${employee.id})">Delete</button>
                </td>
            `;
        });

        // Update dashboard if on dashboard tab
        if (document.getElementById('dashboard').classList.contains('active')) {
            initializeDashboard();
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Add employee
employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get the last employee's ID to generate the next Asset ID
    let lastEmployeeId = 0;
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        const employees = await response.json();
        if (employees.length > 0) {
            lastEmployeeId = Math.max(...employees.map(emp => emp.id));
        }
    } catch (error) {
        console.error('Error getting last employee ID:', error);
    }

    const company = document.getElementById('company').value;
    const assetType = document.getElementById('assetType').value;
    const uniqueId = lastEmployeeId + 1;
    const autoGeneratedAssetId = `${company}/${assetType}/${uniqueId}`;

    // Get the current value of the Asset ID field
    const currentAssetId = document.getElementById('assetId').value;

    const formData = {
        serial_number: parseInt(document.getElementById('serialNumber').value),
        employee_name: document.getElementById('employeeName').value,
        asset_type: document.getElementById('assetType').value,
        asset_issued_date: document.getElementById('assetIssuedDate').value,
        os: document.getElementById('os').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        monitor_type: document.getElementById('monitorType').value,
        monitor_tag: document.getElementById('monitorTag').value,
        asset_id: currentAssetId || autoGeneratedAssetId // Use current value if provided, otherwise use auto-generated
    };

    try {
        if (editingEmployeeId) {
            await fetch(`${API_BASE_URL}/employees/${editingEmployeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            editingEmployeeId = null;
        } else {
            await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        employeeForm.reset();
        await loadEmployees();
    } catch (error) {
        console.error('Error saving employee:', error);
    }
});

// Edit employee
async function editEmployee(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`);
        const employee = await response.json();

        // Format the date to YYYY-MM-DD for the date input
        const issuedDate = new Date(employee.asset_issued_date);
        const formattedDate = issuedDate.toISOString().split('T')[0];

        // Populate all form fields
        document.getElementById('serialNumber').value = employee.serial_number;
        document.getElementById('employeeName').value = employee.employee_name;
        document.getElementById('assetType').value = employee.asset_type;
        document.getElementById('assetIssuedDate').value = formattedDate;
        document.getElementById('os').value = employee.os;
        document.getElementById('email').value = employee.email;
        document.getElementById('company').value = employee.company;
        document.getElementById('monitorType').value = employee.monitor_type;
        document.getElementById('monitorTag').value = employee.monitor_tag;
        document.getElementById('assetId').value = employee.asset_id;

        editingEmployeeId = id;
    } catch (error) {
        console.error('Error loading employee for edit:', error);
    }
}

// Delete employee
async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            await fetch(`${API_BASE_URL}/employees/${id}`, {
                method: 'DELETE'
            });
            await loadEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    }
}

// Add filter
addFilterBtn.addEventListener('click', () => {
    const column = filterColumn.value;
    const value = filterValue.value;

    if (column && value) {
        // Check if filter already exists
        const existingFilterIndex = currentFilters.findIndex(
            filter => filter.column === column && filter.value === value
        );

        if (existingFilterIndex === -1) {
            currentFilters.push({ column, value });
            updateActiveFilters();
            loadEmployees(); // Reload employees with new filter
        }
        filterValue.value = '';
    }
});

// Update active filters display
function updateActiveFilters() {
    activeFilters.innerHTML = '';

    currentFilters.forEach((filter, index) => {
        const filterTag = document.createElement('div');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `
            ${filter.column}: ${filter.value}
            <button onclick="removeFilter(${index})">×</button>
        `;
        activeFilters.appendChild(filterTag);
    });
}

// Remove filter
function removeFilter(index) {
    currentFilters.splice(index, 1);
    updateActiveFilters();
    loadEmployees(); // Reload employees after removing filter
}

// Populate filter columns
function populateFilterColumns() {
    const columns = [
        'serial_number',
        'employee_name',
        'asset_type',
        'asset_issued_date',
        'os',
        'email',
        'company',
        'monitor_type',
        'monitor_tag',
        'asset_id'
    ];

    filterColumn.innerHTML = '<option value="">Select Column</option>';

    columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = column.replace('_', ' ').toUpperCase();
        filterColumn.appendChild(option);
    });
}

// Add dropdown option
addOptionBtn.addEventListener('click', async () => {
    const category = dropdownCategory.value;
    const value = newOption.value;

    if (value) {
        try {
            await fetch(`${API_BASE_URL}/dropdown-options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category, value })
            });

            newOption.value = '';
            await loadDropdownOptions();
            await loadDropdownOptionsList();
        } catch (error) {
            console.error('Error adding dropdown option:', error);
        }
    }
});

// Load dropdown options list
async function loadDropdownOptionsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/dropdown-options/${dropdownCategory.value}`);
        const options = await response.json();

        dropdownOptions.innerHTML = '';

        options.forEach(option => {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.innerHTML = `
                ${option}
                <button onclick="deleteDropdownOption('${option}')">Delete</button>
            `;
            dropdownOptions.appendChild(optionItem);
        });
    } catch (error) {
        console.error('Error loading dropdown options:', error);
    }
}

// Delete dropdown option
async function deleteDropdownOption(value) {
    try {
        await fetch(`${API_BASE_URL}/dropdown-options`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: dropdownCategory.value,
                value
            })
        });

        await loadDropdownOptions();
        await loadDropdownOptionsList();
    } catch (error) {
        console.error('Error deleting dropdown option:', error);
    }
}

// Export data
exportBtn.addEventListener('click', async () => {
    try {
        // Convert filters to the format expected by the backend
        const filterParams = currentFilters.reduce((acc, filter) => {
            acc[filter.column] = filter.value;
            return acc;
        }, {});

        const response = await fetch(`${API_BASE_URL}/export?${new URLSearchParams(filterParams)}`);
        const data = await response.json();

        // Get current date and time
        const now = new Date();
        const dateStr = now.toISOString()
            .replace(/T/, '_')
            .replace(/\..+/, '')
            .replace(/:/g, '-');

        // Create and download CSV file
        const blob = new Blob([data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset_manager_export_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting data:', error);
    }
});

// Event listeners
dropdownCategory.addEventListener('change', loadDropdownOptionsList);

// Add event listeners to auto-generate Asset ID when company or asset type changes
document.getElementById('company').addEventListener('change', updateAssetId);
document.getElementById('assetType').addEventListener('change', updateAssetId);

async function updateAssetId() {
    const company = document.getElementById('company').value;
    const assetType = document.getElementById('assetType').value;
    const currentAssetId = document.getElementById('assetId').value;

    if (company && assetType) {
        // If there's an existing asset ID, extract the unique ID part
        let uniqueId = 0;
        if (currentAssetId) {
            const parts = currentAssetId.split('/');
            if (parts.length === 3) {
                uniqueId = parseInt(parts[2]);
            }
        }

        // If no unique ID was extracted, get the next available ID
        if (!uniqueId) {
            try {
                const response = await fetch(`${API_BASE_URL}/employees`);
                const employees = await response.json();
                if (employees.length > 0) {
                    uniqueId = Math.max(...employees.map(emp => emp.id)) + 1;
                } else {
                    uniqueId = 1;
                }
            } catch (error) {
                console.error('Error getting last employee ID:', error);
                uniqueId = 1;
            }
        }

        // Generate new asset ID with the same format
        const newAssetId = `${company}/${assetType}/${uniqueId}`;
        document.getElementById('assetId').value = newAssetId;
    }
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        const employees = await response.json();

        // Update total assets count
        document.getElementById('totalAssets').textContent = employees.length;

        // Calculate and update total unique employees
        const uniqueEmployees = new Set(employees.map(emp => emp.employee_name)).size;
        document.getElementById('totalEmployees').textContent = uniqueEmployees;

        // Destroy existing charts if they exist
        if (assetTypeChart) {
            assetTypeChart.destroy();
        }
        if (companyChart) {
            companyChart.destroy();
        }
        if (osChart) {
            osChart.destroy();
        }

        // Create new charts
        createAssetTypeChart(employees);
        createCompanyChart(employees);
        createOSChart(employees);
        updateRecentAssets(employees);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Create Asset Type Chart
function createAssetTypeChart(employees) {
    const assetTypes = {};
    employees.forEach(employee => {
        assetTypes[employee.asset_type] = (assetTypes[employee.asset_type] || 0) + 1;
    });

    const ctx = document.getElementById('assetTypeChart').getContext('2d');
    assetTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(assetTypes),
            datasets: [{
                data: Object.values(assetTypes),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#f1c40f',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create Company Chart
function createCompanyChart(employees) {
    const companies = {};
    employees.forEach(employee => {
        companies[employee.company] = (companies[employee.company] || 0) + 1;
    });

    const ctx = document.getElementById('companyChart').getContext('2d');
    companyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(companies),
            datasets: [{
                label: 'Assets by Company',
                data: Object.values(companies),
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create OS Chart
function createOSChart(employees) {
    const osTypes = {};
    employees.forEach(employee => {
        osTypes[employee.os] = (osTypes[employee.os] || 0) + 1;
    });

    const ctx = document.getElementById('osChart').getContext('2d');
    osChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(osTypes),
            datasets: [{
                data: Object.values(osTypes),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#f1c40f'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Recent Assets
function updateRecentAssets(employees) {
    const recentAssetsContainer = document.getElementById('recentAssets');
    recentAssetsContainer.innerHTML = '';

    // Sort employees by asset_issued_date (most recent first)
    const sortedEmployees = [...employees].sort((a, b) =>
        new Date(b.asset_issued_date) - new Date(a.asset_issued_date)
    ).slice(0, 10); // Show only 10 most recent

    sortedEmployees.forEach(employee => {
        const assetItem = document.createElement('div');
        assetItem.className = 'recent-asset-item';
        assetItem.innerHTML = `
            <div class="recent-asset-info">
                <strong>${employee.employee_name}</strong> - ${employee.asset_type}
                <div class="recent-asset-date">Issued: ${employee.asset_issued_date}</div>
            </div>
            <div>${employee.asset_id}</div>
        `;
        recentAssetsContainer.appendChild(assetItem);
    });
}

// Initialize
loadInitialData(); 