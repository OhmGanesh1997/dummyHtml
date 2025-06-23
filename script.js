document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status-message');
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const fetchIpButton = document.getElementById('fetch-ip-button');
    const proxyResponseArea = document.getElementById('proxy-response-area');
    const connectionCountry = document.getElementById('connection-country'); // Get the new span

    // Base URL for your proxy server (running on port 3001)
    const PROXY_SERVER_URL = 'http://localhost:3001';

    function updateUI(isConnected) {
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
            connectionCountry.textContent = ''; // Clear country on disconnect state
        }
    }

    connectButton.addEventListener('click', async () => {
        proxyResponseArea.textContent = 'Connecting...';
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/connect`, { method: 'POST' });
            if (response.ok) {
                const message = await response.text();
                updateUI(true);
                proxyResponseArea.textContent = message;
                fetchCountryInfo(); // Fetch country info on successful connect
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
                updateUI(false);
                proxyResponseArea.textContent = message;
                connectionCountry.textContent = ''; // Clear country info
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

    // Initial UI state
    updateUI(false); // This will also clear country info now

    async function fetchCountryInfo() {
        connectionCountry.textContent = 'Loading...';
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/get-connection-country`);
            if (response.ok) {
                const data = await response.json();
                if (data.country && data.city) {
                    connectionCountry.textContent = `${data.city}, ${data.country} (IP: ${data.queryIp})`;
                } else if (data.country) {
                    connectionCountry.textContent = `${data.country} (IP: ${data.queryIp})`;
                } else {
                    connectionCountry.textContent = 'Location not found.';
                }
            } else {
                const errorText = await response.text();
                console.error('Error fetching country:', errorText);
                connectionCountry.textContent = 'Error fetching location.';
            }
        } catch (error) {
            console.error('Error fetching country:', error);
            connectionCountry.textContent = 'Error fetching location.';
        }
    }

    // Check initial status from server (optional, good for page loads)
    async function checkInitialStatus() {
        try {
            const response = await fetch(`${PROXY_SERVER_URL}/status`);
            if (response.ok) {
                const data = await response.json();
                updateUI(data.isConnected);
                if (data.isConnected) {
                    fetchCountryInfo(); // If already connected (e.g. previous session), fetch country
                }
            } else {
                console.warn('Could not fetch initial status from server.');
                updateUI(false); // Assume disconnected if status check fails
            }
        } catch (error) {
            console.warn('Error checking initial status:', error.message);
            updateUI(false); // Assume disconnected if server is not reachable
        }
    }

    checkInitialStatus();
});
