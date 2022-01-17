// Require the express module
const express = require('express');
// Create an instance of express
const app = express();
// Create a port variable
const port = 80;

// Require the filesystem module
const fs = require('fs');
// Require the os module
const os = require('os');
// Require the config module
const config = require('./config');
// Require the request module
const request = require('request');

// Remove a part of a string
const removeString = (str, remove) => {
    return str.replace(remove, '');
}

// Returns a json object
const jsonResponse = (res, data) => {
    return JSON.stringify({success: res, data: data});
}

// Send a request to a webhook
const sendWebhook = (url, message) =>{
    request.post(url, {
        json: {
            content: message
        }
    });
}

// Log all requests
app.use(function(req, res, next) {
    // Get the current date and time
    const date = new Date();
    const time = date.toLocaleTimeString();

    // Check if console logging is enabled
    if (config.logging.console) {
        // Log the request to the console
        console.log(`${time} - ${req.method} ${req.url}`);
    }

    // Check if webhook logging is enabled by checking if the webhook url is set
    if (config.logging.webhook.length > 0) {
        // Log the request to the webhook
        sendWebhook(config.logging.webhook, `${time} - ${req.method} ${req.url}`)
    }

    // Check if file logging is enabled
    if (config.logging.file) {
        // Log the request to the file
        fs.appendFile('./requestLogs.txt', `${time} - ${req.method} ${req.url}\n`, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    }

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

    // Check if the client's IP is blacklisted
    if (config.database.blacklistedIps.includes(parsedIp)) {
        return res.send(jsonResponse(false, 'IP address is blacklisted'));
    }

    // Create two variables to store the key and data
    const key = req.query.key;
    const data = req.query.data;

    // Check if the parameters are valid (key, data)
    if (!key || !data) {
        return res.send(jsonResponse(false, 'Invalid parameters'));
    }
    // Check if the API key is blacklisted
    if (config.database.blacklistedKeys.includes(key)) {
        return res.send(jsonResponse(false, 'API key is blacklisted'));
    }

    // Check if the API key is whitelisted
    if (!config.database.whitelistedKeys.includes(key)) {
        return res.send(jsonResponse(false, 'API key is not whitelisted'));
    }

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
