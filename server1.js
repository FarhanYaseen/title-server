const http = require('http');
const https = require('https');
const url = require('url');
const cheerio = require('cheerio');
const { urlPattern } = require('./utils');

const getTitle = (address, maxRedirects, callback) => {
    let correctedAddress = address.trim();

    if (!urlPattern.test(correctedAddress)) {
        callback(null, `<li>${address} - "NO RESPONSE"</li>`);
        return;
    }

    if (!/^https?:\/\//i.test(correctedAddress)) {
        correctedAddress = 'http://' + correctedAddress;
    }

    const fetchTitle = (currentUrl, redirectCount) => {
        if (redirectCount > maxRedirects) {
            callback(null, `<li>${address} - "NO RESPONSE"</li>`);
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
                        callback(null, `<li>${address} - "NO RESPONSE"</li>`);
                    }
                } else if (res.statusCode !== 200) {
                    callback(null, `<li>${address} - "NO RESPONSE"</li>`);
                } else {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        const $ = cheerio.load(data);
                        const title = $('title').text().trim() || 'NO RESPONSE';
                        callback(null, `<li>${address} - "${title}"</li>`);
                    });
                }
            }).on('error', (error) => {
                console.error(`Error fetching ${currentUrl}:`, error.message);
                callback(null, `<li>${address} - "NO RESPONSE"</li>`);
            });
        } catch (error) {
            console.error(`Exception fetching ${currentUrl}:`, error.message);
            callback(null, `<li>${address} - "NO RESPONSE"</li>`);
        }
    };

    fetchTitle(correctedAddress, 0);
};

const titleServer = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/I/want/title' && reqUrl.query.address) {
        const addresses = Array.isArray(reqUrl.query.address) ? reqUrl.query.address : [reqUrl.query.address];

        let results = [];
        let completedRequests = 0;

        addresses.forEach((address, index) => {
            getTitle(address, 5, (error, result) => {
                if (error) {
                    results[index] = `<li>${address} - "NO RESPONSE"</li>`;
                } else {
                    results[index] = result;
                }
                completedRequests++;

                if (completedRequests === addresses.length) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<html><head></head><body><h1>Following are the titles of given websites:</h1><ul>${results.join('')}</ul></body></html>`);
                }
            });
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
    }
});

const PORT = process.env.PORT || 3000;

titleServer.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});