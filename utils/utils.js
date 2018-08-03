const http = require('http');
const https = require('https');

/**
 * callAPI:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.callAPI = function (options, onResult) {
    try {
        /*
    
        var options = {
            host: 'somesite.com',
            port: 443,
            path: '/some/path',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
    
        */
        console.log("callAPI running");

        var port = options.port == 443 ? https : http;
        var req = port.request(options, function (res) {
            var output = '';
            console.log(options.host + ':' + res.statusCode);
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                try {
                    if (res.statusCode == 200) {
                        var obj = JSON.parse(output);
                        onResult(res.statusCode, obj);
                    } else {
                        onResult(res.statusCode);
                    }
                } catch (error) {
                    console.log("error:", error);
                }
            });
        });

        req.on('error', function (err) {
            console.log("Error", err);
            return false;
        });

        req.end();
    } catch (error) {
        console.log("Request Error:", error);
    }
};