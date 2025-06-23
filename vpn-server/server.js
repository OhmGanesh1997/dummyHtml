const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001; // Port for our proxy server

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

// Proxy middleware
// This will proxy requests like /proxy/get to http://httpbin.org/get
const apiProxy = createProxyMiddleware('/proxy', {
  target: TARGET_SERVER,
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '', // remove /proxy from the path
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request: ${req.method} ${req.path} to ${TARGET_SERVER}${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
});

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

// Apply the proxy middleware for all routes starting with /proxy
// ensureConnected middleware will protect this route
app.use('/proxy', ensureConnected, apiProxy);

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
