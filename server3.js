const http = require('http');
const https = require('https');
const url = require('url');
const Q = require('q');
const cheerio = require('cheerio');
const { urlPattern } = require('./utils');


const getTitle = (address, maxRedirects = 5) => {
    const deferred = Q.defer();
    let correctedAddress = address.trim();

    if (!urlPattern.test(correctedAddress)) {
        deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
        return deferred.promise;
    }

    if (!/^https?:\/\//i.test(correctedAddress)) {
        correctedAddress = 'http://' + correctedAddress;
    }

    const fetchTitle = (currentUrl, redirectCount) => {
        if (redirectCount > maxRedirects) {
            deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
            return;
        }

        try {
            const protocol = currentUrl.startsWith('https') ? https : http;

            protocol.get(currentUrl, (res) => {
                if ([301, 302, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (location) {
                        const newAddress = location.startsWith('http') ? location : `${url.resolve(currentUrl, location)}`;
                        console.log(`Redirecting to: ${newAddress}`);
                        fetchTitle(newAddress, redirectCount + 1);
                    } else {
                        deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
                    }
                } else if (res.statusCode !== 200) {
                    deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
                } else {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        const $ = cheerio.load(data);
                        const title = $('title').text().trim() || 'NO RESPONSE';
                        deferred.resolve(`<li>${address} - "${title}"</li>`);
                    });
                }
            }).on('error', (error) => {
                console.error(`Error fetching ${currentUrl}:`, error.message);
                deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
            });
        } catch (error) {
            console.error(`Exception fetching ${currentUrl}:`, error.message);
            deferred.resolve(`<li>${address} - "NO RESPONSE"</li>`);
        }
    };

    fetchTitle(correctedAddress, 0);
    return deferred.promise;
};

const promiseTitleServer = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/I/want/title' && reqUrl.query.address) {
        const addresses = Array.isArray(reqUrl.query.address) ? reqUrl.query.address : [reqUrl.query.address];

        const promises = addresses.map(address => getTitle(address));

        Q.all(promises).then((results) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<html><head></head><body><h1>Following are the titles of given websites:</h1><ul>${results.join('')}</ul></body></html>`);
        }).catch((error) => {
            console.error('Error processing requests:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<html><head></head><body><h1>Internal Server Error</h1></body></html>');
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
    }
});

const PORT = process.env.PORT || 3002;

promiseTitleServer.listen(PORT, () => {
    console.log(`PromiseServer is running on port http://localhost:${PORT}`);
});
