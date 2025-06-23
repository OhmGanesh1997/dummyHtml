const express = require('express');
// http-proxy-middleware will be removed for /proxy, but keep for now if other uses exist or for reference
// const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent'); // For routing through external HTTP/S proxies

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes and origins
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies, needed for /connect

// --- Configuration for Simulated Country Selection ---
const EXIT_NODES = {
    "DIRECT": { name: "Direct Connection (No External Proxy)", proxyUrl: null },
    // IMPORTANT: These are PLACEHOLDERS and WILL NOT WORK.
    // Replace with actual, working public proxy URLs.
    // Finding reliable free public proxies is very difficult.
    "US": { name: "United States (Simulated)", proxyUrl: "http://us.exampleproxy.com:8080" },
    "DE": { name: "Germany (Simulated)", proxyUrl: "http://de.exampleproxy.com:8080" },
    "JP": { name: "Japan (Simulated)", proxyUrl: "http://jp.exampleproxy.com:8080" }
};
let currentExitNodeUrl = null;
let selectedCountryName = EXIT_NODES.DIRECT.name; // Default to direct
// --- End Configuration ---

// Placeholder for connected status (very simplified)
let isConnected = false;

// Original TARGET_SERVER for direct connections or if no proxy is used by our proxy
const DEFAULT_TARGET_BASE_URL = 'http://httpbin.org';

// Middleware to check if "connected" (conceptual connection to our service)
// In a real scenario, this would involve verifying VPN session, tunnel, etc.
const ensureConnected = (req, res, next) => {
  if (!isConnected) {
    return res.status(403).send('Not connected to VPN service.');
  }
  next();
};

// Conceptual "connect" endpoint
app.post('/connect', (req, res) => {
  const { countryCode } = req.body; // Expecting { "countryCode": "US" } or "DIRECT"

  if (countryCode && EXIT_NODES[countryCode]) {
    currentExitNodeUrl = EXIT_NODES[countryCode].proxyUrl;
    selectedCountryName = EXIT_NODES[countryCode].name;
    isConnected = true;
    console.log(`Client conceptualized connection. Selected country: ${selectedCountryName}, Proxy URL: ${currentExitNodeUrl || 'None'}`);
    res.status(200).send(`Successfully connected via ${selectedCountryName}.`);
  } else if (countryCode === "DIRECT" || !countryCode) { // Default to direct if no code or "DIRECT"
    currentExitNodeUrl = null;
    selectedCountryName = EXIT_NODES.DIRECT.name;
    isConnected = true;
    console.log(`Client conceptualized connection. Selected country: ${selectedCountryName}`);
    res.status(200).send(`Successfully connected via ${selectedCountryName}.`);
  }
  else {
    res.status(400).send('Invalid country code provided.');
  }
});

// Conceptual "disconnect" endpoint
app.post('/disconnect', (req, res) => {
  isConnected = false;
  currentExitNodeUrl = null;
  selectedCountryName = EXIT_NODES.DIRECT.name;
  console.log('Client conceptualized disconnection. Reset to Direct Connection.');
  res.status(200).send('Successfully disconnected. Connection reset to Direct.');
});

// Status endpoint
app.get('/status', (req, res) => {
  // Also return selected country info if connected
  res.status(200).json({
    isConnected,
    selectedCountry: selectedCountryName,
    exitNodeUrl: currentExitNodeUrl
  });
});

// Modified endpoint to report the *selected* proxy's country, not client's direct GeoIP
app.get('/get-connection-country', async (req, res) => {
  if (isConnected) {
    // For a more advanced version, we could try to verify the exit node's actual IP location here.
    // For now, we just return what the user selected.
    res.json({
        country: selectedCountryName,
        // city: "N/A for selected proxy", // City is harder to get without another GeoIP lookup of the proxy itself
        details: `Connected via ${selectedCountryName}${currentExitNodeUrl ? ' (' + currentExitNodeUrl + ')' : ''}`
    });
  } else {
    res.status(403).json({ error: 'Not connected.' });
  }
});

// New proxy handler for /proxy/*
app.all('/proxy/*', ensureConnected, async (req, res) => {
  const targetPath = req.params[0]; // Gets the '*' part of the path
  const targetUrl = `${DEFAULT_TARGET_BASE_URL}/${targetPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  console.log(`Proxying request for: ${req.method} ${targetUrl}`);
  console.log(`Using exit node: ${selectedCountryName} (${currentExitNodeUrl || 'None'})`);

  const options = {
    method: req.method,
    headers: { ...req.headers }, // Clone headers
    body: (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : undefined, // Pass body if exists
    redirect: 'manual', // Important: handle redirects manually or let fetch do it carefully
  };

  // Remove host header as it can cause issues with proxies/targets
  delete options.headers.host;
  // delete options.headers['content-length']; // Let node-fetch/http calculate this if body is transformed

  if (currentExitNodeUrl) {
    options.agent = new HttpsProxyAgent(currentExitNodeUrl);
  }

  try {
    const proxyResponse = await fetch(targetUrl, options);

    // Forward status code
    res.status(proxyResponse.status);

    // Forward headers
    proxyResponse.headers.forEach((value, name) => {
      // Avoid setting headers that can cause issues, like content-encoding if content is transformed
      // or transfer-encoding.
      if (name.toLowerCase() !== 'transfer-encoding' && name.toLowerCase() !== 'content-encoding') {
         res.setHeader(name, value);
      }
    });

    // Stream the response body back to the client
    proxyResponse.body.pipe(res);

  } catch (error) {
    console.error(`Error proxying to ${targetUrl}:`, error);
    if (error.code === 'ECONNREFUSED' && currentExitNodeUrl) {
        res.status(502).send(`Error connecting to the selected exit proxy: ${selectedCountryName}. It might be offline or invalid.`);
    } else if (error.code === 'ECONNREFUSED') {
        res.status(502).send(`Error connecting to the target server: ${targetUrl}.`);
    }
    else {
        res.status(500).send('Error during proxy request.');
    }
  }
});


// Basic route to show server is running
app.get('/', (req, res) => {
  res.send('VPN Proxy Server is running.');
});

app.listen(PORT, () => {
  console.log(`VPN Proxy Server listening on port ${PORT}`);
  console.log(`Connect conceptually via POST /connect`);
  console.log(`Disconnect conceptually via POST /disconnect`);
  console.log(`Proxy requests to ${TARGET_SERVER} via /proxy/* (e.g., /proxy/ip to see your IP through the proxy)`);
});
