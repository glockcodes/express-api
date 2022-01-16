// Require the express module
const express = require('express');
// Create an instance of express
const app = express();
// Create a port variable
const port = 80;

// Require the os module
const os = require('os');

// Remove a part of a string
const removeString = (str, remove) => {
    return str.replace(remove, '');
}

// Returns a json object
const jsonResponse = (res, data) => {
    return JSON.stringify({success: res, data: data});
}

// Log all requests
app.use(function(req, res, next) {
    // Get the current date and time
    const date = new Date();
    const time = date.toLocaleTimeString();

    // Log the request
    console.log(`${time} - ${req.method} ${req.url}`);

    // Continue to the next middleware
    next();
    }
);

// Serve static files from the public directory
app.use(express.static('public'));

// New route that listening on root
app.get('/', function(req, res) {
    // Redirect to api
    res.redirect('/api');
});

// New route that listens on /api
app.get('/api', function(req, res) {
    // Get the client's IP address
    const unparsedIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Check if the client's IP exists
    if (!unparsedIp) {
        return res.send(jsonResponse(false, 'No IP address found'));
    }

    // Parse the IP address
    const parsedIp = removeString(unparsedIp, '::ffff:');

    // List of blacklisted IP addresses
    const blacklistedIps = [
        'xxx.xxx.xxx.xxx',
    ];

    // Check if the IP is blacklisted
    if (blacklistedIps.includes(parsedIp)) {
        return res.send(jsonResponse(false, 'Blacklisted IP address'));
    }

    // Create two variables to store the key and data
    const key = req.query.key;
    const data = req.query.data;

    // Check if the parameters are valid (key, data)
    if (!key || !data) {
        return res.send(jsonResponse(false, 'Invalid parameters'));
    }

    // List of blacklisted API keys
    const blacklistedKeys = [
        'xxx',
    ];

    // Check if the API key is blacklisted
    if (blacklistedKeys.includes(key)) {
        return res.send(jsonResponse(false, 'Blacklisted API key'));
    }

    // List of whitelisted API keys
    const whitelistedKeys = [
        'key',
    ];

    // Check if the API key is whitelisted
    if (!whitelistedKeys.includes(key)) {
        return res.send(jsonResponse(false, 'Invalid API key'));
    }

    // Log the request with the IP address, API key, and data
    console.log(`${parsedIp} - ${key} - ${data}`);

    // Return a json object with the success status and the data
    return res.send(jsonResponse(true, data));
});

// Start the server
app.listen(port, function() {
    // Get the host's IP address
    const ifaces = os.networkInterfaces();
    const ip = Object.keys(ifaces).reduce((prev, curr) => {
        return prev.concat(ifaces[curr]);
    }, []).filter(details => details.family === 'IPv4' && !details.internal)[0].address;

    console.log(`Server listening on ${ip}:${port}`);
});
