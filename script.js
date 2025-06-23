document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status-message');
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const fetchIpButton = document.getElementById('fetch-ip-button');
    const proxyResponseArea = document.getElementById('proxy-response-area');
    const connectionCountrySpan = document.getElementById('connection-country'); // Renamed for clarity
    const countrySelect = document.getElementById('country-select'); // Get the select element

    // Base URL for your proxy server (running on port 3001)
    const PROXY_SERVER_URL = 'http://localhost:3001';

    // Hardcode EXIT_NODES client-side to populate dropdown and match server (or fetch from server in a real app)
    const EXIT_NODES_CLIENT = {
        "DIRECT": { name: "Direct Connection" },
        "US": { name: "United States (Simulated)" },
        "DE": { name: "Germany (Simulated)" },
        "JP": { name: "Japan (Simulated)" }
    };

    function populateCountryDropdown() {
        // Clear existing options except the first one if it's "Direct" or a placeholder
        // For simplicity, assuming the HTML has the initial options as defined.
        // If we were building it dynamically:
        // countrySelect.innerHTML = '';
        // Object.keys(EXIT_NODES_CLIENT).forEach(code => {
        //     const option = document.createElement('option');
        //     option.value = code;
        //     option.textContent = EXIT_NODES_CLIENT[code].name;
        //     countrySelect.appendChild(option);
        // });
    }


    function updateUI(isConnected, selectedCountryCode = "DIRECT") {
        countrySelect.disabled = isConnected; // Disable dropdown when connected

        if (isConnected) {
            statusMessage.textContent = 'Connected';
            statusMessage.style.color = 'green';
            connectButton.disabled = true;
            disconnectButton.disabled = false;
            fetchIpButton.disabled = false;
        } else {
            statusMessage.textContent = 'Disconnected';
            statusMessage.style.color = 'red';
            connectButton.disabled = false;
            disconnectButton.disabled = true;
            fetchIpButton.disabled = true;
            connectionCountrySpan.textContent = ''; // Use correct variable name
        }
    }

    connectButton.addEventListener('click', async () => {
        proxyResponseArea.textContent = 'Connecting...';
        const selectedCountryCode = countrySelect.value;
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ countryCode: selectedCountryCode }),
            });
            if (response.ok) {
                const message = await response.text();
                updateUI(true, selectedCountryCode); // Pass selected country code
                proxyResponseArea.textContent = message;
                getConnectionDetails(); // Fetch and display connection details
            } else {
                const errorText = await response.text();
                proxyResponseArea.textContent = `Connection failed: ${response.status} ${errorText}`;
                updateUI(false);
            }
        } catch (error) {
            console.error('Error connecting:', error);
            proxyResponseArea.textContent = `Error connecting: ${error.message}`;
            updateUI(false);
        }
    });

    disconnectButton.addEventListener('click', async () => {
        proxyResponseArea.textContent = 'Disconnecting...';
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/disconnect`, { method: 'POST' });
            if (response.ok) {
                const message = await response.text();
                updateUI(false, "DIRECT"); // Reset to DIRECT on disconnect
                proxyResponseArea.textContent = message;
                connectionCountrySpan.textContent = ''; // Use correct variable name
            } else {
                const errorText = await response.text();
                proxyResponseArea.textContent = `Disconnection failed: ${response.status} ${errorText}`;
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            proxyResponseArea.textContent = `Error disconnecting: ${error.message}`;
        }
    });

    fetchIpButton.addEventListener('click', async () => {
        proxyResponseArea.textContent = 'Fetching IP via proxy...';
        try {
            // Example: fetching your IP address through httpbin.org via our proxy
            const response = await fetch(`${PROXY_SERVER_URL}/proxy/ip`);
            if (response.ok) {
                const data = await response.json(); // httpbin.org/ip returns JSON
                proxyResponseArea.innerHTML = `<p>Response from proxy (your IP as seen by ${PROXY_SERVER_URL}/proxy):</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                const errorText = await response.text();
                proxyResponseArea.textContent = `Proxy request failed: ${response.status} ${errorText}`;
            }
        } catch (error) {
            console.error('Error fetching via proxy:', error);
            proxyResponseArea.textContent = `Error fetching via proxy: ${error.message}`;
        }
    });

    // Initial UI state is set by checkInitialStatus

    // Fetches and displays the current connection details (selected country/proxy)
    async function getConnectionDetails() {
        connectionCountrySpan.textContent = 'Loading...';
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/get-connection-country`);
            if (response.ok) {
                const data = await response.json();
                // Server sends 'country' as selectedCountryName and 'details'
                connectionCountrySpan.textContent = data.details || data.country || 'N/A';
            } else {
                const errorText = await response.text();
                console.error('Error fetching connection details:', errorText);
                connectionCountrySpan.textContent = 'Error fetching details.';
            }
        } catch (error) {
            console.error('Error fetching connection details:', error);
            connectionCountrySpan.textContent = 'Error fetching details.';
        }
    }

    // Check initial status from server
    async function checkInitialStatus() {
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/status`);
            if (response.ok) {
                const data = await response.json();

                let initialCountryCode = "DIRECT"; // Default
                if (data.isConnected && data.selectedCountry) {
                    // Try to find the code corresponding to the name sent by server
                    const foundCode = Object.keys(EXIT_NODES_CLIENT).find(
                        code => EXIT_NODES_CLIENT[code].name === data.selectedCountry
                    );
                    if (foundCode) {
                        initialCountryCode = foundCode;
                    }
                }
                countrySelect.value = initialCountryCode;
                updateUI(data.isConnected, initialCountryCode);

                if (data.isConnected) {
                    getConnectionDetails();
                } else {
                    connectionCountrySpan.textContent = '';
                }
            } else {
                console.warn('Could not fetch initial status from server.');
                updateUI(false, "DIRECT");
                connectionCountrySpan.textContent = '';
            }
        } catch (error) {
            console.warn('Error checking initial status:', error.message);
            updateUI(false, "DIRECT");
            connectionCountrySpan.textContent = '';
        }
    }

    populateCountryDropdown(); // Call to ensure dropdown is set up (though it's static now)
    checkInitialStatus();
});
