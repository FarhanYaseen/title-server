
const http = require('http');
const https = require('https');
const url = require('url');
const { from } = require('rxjs');
const { map, mergeMap, catchError, toArray } = require('rxjs/operators');
const { urlPattern } = require('./utils');
const cheerio = require('cheerio');

const getTitle = (address, maxRedirects) => {
    return new Promise((resolve, reject) => {
        let correctedAddress = address.trim();
        if (!urlPattern.test(correctedAddress)) {
            resolve(`<li>${address} - "NO RESPONSE"</li>`);
            return;
        }
        if (!/^https?:\/\//i.test(correctedAddress)) {
            correctedAddress = 'http://' + correctedAddress;
        }

        const fetchTitle = (currentUrl, redirectCount) => {
            if (redirectCount > maxRedirects) {
                resolve(`<li>${address} - "NO RESPONSE"</li>`);
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
                            resolve(`<li>${address} - "NO RESPONSE"</li>`);
                        }
                    } else if (res.statusCode !== 200) {
                        resolve(`<li>${address} - "NO RESPONSE"</li>`);
                    } else {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            const $ = cheerio.load(data);
                            const title = $('title').text().trim() || 'NO RESPONSE';
                            resolve(`<li>${address} - "${title}"</li>`);
                        });
                    }
                }).on('error', (error) => {
                    console.error(`Error fetching ${currentUrl}:`, error.message);
                    resolve(`<li>${address} - "NO RESPONSE"</li>`);
                });
            } catch (error) {
                console.error(`Exception fetching ${currentUrl}:`, error.message);
                resolve(`<li>${address} - "NO RESPONSE"</li>`);
            }
        };

        fetchTitle(correctedAddress, 0);
    });
};

const rxTitleServer = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/I/want/title' && reqUrl.query.address) {
        const addresses = Array.isArray(reqUrl.query.address) ? reqUrl.query.address : [reqUrl.query.address];

        from(addresses)
            .pipe(
                mergeMap(address => from(getTitle(address))),
                toArray()
            )
            .subscribe(results => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<html><head></head><body><h1>Following are the titles of given websites:</h1><ul>${results.join('')}</ul></body></html>`);
            });
    }  else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
    }
});

rxTitleServer.listen(3003, () => console.log('RxTitleServer is running on http://localhost:3003'));
