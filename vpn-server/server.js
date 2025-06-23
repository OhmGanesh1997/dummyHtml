const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors'); // Import the cors package
const fetch = require('node-fetch'); // Import node-fetch

const app = express();
const PORT = process.env.PORT || 3001; // Port for our proxy server

// Enable CORS for all routes and origins
app.use(cors());

// Placeholder for connected status (very simplified)
let isConnected = false;

// Target server to proxy to (e.g., a public API for testing)
// In a real VPN, this would be dynamic or configured by the client.
const TARGET_SERVER = 'http://httpbin.org'; // Using httpbin.org for easy request inspection

// Middleware to check if "connected"
// In a real scenario, this would involve verifying VPN session, tunnel, etc.
const ensureConnected = (req, res, next) => {
  if (!isConnected) {
    return res.status(403).send('Not connected to VPN service.');
  }
  next();
};

// Conceptual "connect" endpoint
app.post('/connect', (req, res) => {
  isConnected = true;
  console.log('Client conceptualized connection.');
  // In a real VPN server, this would involve setting up tunnels, authentication, etc.
  res.status(200).send('Successfully connected (conceptually) to the VPN service.');
});

// Conceptual "disconnect" endpoint
app.post('/disconnect', (req, res) => {
  isConnected = false;
  console.log('Client conceptualized disconnection.');
  // In a real VPN server, this would involve tearing down tunnels, cleaning up sessions, etc.
  res.status(200).send('Successfully disconnected (conceptually) from the VPN service.');
});

// Status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({ isConnected });
});

// Endpoint to get connection country based on client IP
app.get('/get-connection-country', async (req, res) => {
  // For Express behind a proxy (like Heroku, Nginx, etc.), req.ip might be more reliable.
  // For direct connections, req.socket.remoteAddress is good.
  // Express's `trust proxy` setting can affect req.ip.
  // Let's try req.ip first, but have a fallback or consider req.socket.remoteAddress.
  // Note: If the client is on localhost, this IP will be '::1' or '127.0.0.1'.
  // The GeoIP service will then report the location of the server itself or a generic localhost location.
  // For true external IPs, this works better.
  const clientIp = req.ip === '::1' || req.ip === '127.0.0.1' ? '' : req.ip; // ip-api.com uses empty query for current IP

  // If clientIp is empty, ip-api.com will use the IP of the server making the request.
  // This is useful if the server itself is the "client" in some sense, or for testing.
  // If you specifically need the *requesting client's* IP, ensure your proxy setup (if any) forwards it correctly
  // and that Express `trust proxy` is configured.

  console.log(`Requesting GeoIP for IP: ${clientIp || 'server\'s own IP'}`);

  try {
    const geoApiResponse = await fetch(`http://ip-api.com/json/${clientIp}`);
    const geoData = await geoApiResponse.json();

    if (geoData.status === 'success' && geoData.country) {
      res.json({ country: geoData.country, city: geoData.city, queryIp: geoData.query });
    } else {
      res.status(404).json({ error: 'Could not determine country.', details: geoData.message || 'Unknown error from GeoIP API' });
    }
  } catch (error) {
    console.error('Error fetching GeoIP data:', error);
    res.status(500).json({ error: 'Server error while fetching GeoIP data.' });
  }
});

// Apply the proxy middleware for all routes starting with /proxy
// ensureConnected middleware will protect this route
app.use('/proxy', ensureConnected, createProxyMiddleware({
  target: 'http://httpbin.org', // Explicitly set target here
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '', // remove /proxy from the path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Note: TARGET_SERVER is not defined in this immediate scope if you removed its global const.
    // For safety, let's use the literal here too, or ensure TARGET_SERVER is still accessible.
    // Re-instating TARGET_SERVER for clarity in logging, or using the literal.
    // const TARGET_SERVER = 'http://httpbin.org'; // If it was removed globally
    console.log(`Proxying request: ${req.method} ${req.path} to http://httpbin.org${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
}));

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
