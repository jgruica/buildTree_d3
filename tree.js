const express = require('express');
const path = require('path');
const Promise = require("bluebird");
const request = require('request');
const cheerio = require('cheerio');
const parseDomain = require('parse-domain')

const app = express();

function buildTree(url, maxVisitedCount = 100, parsedUrl = null, visited = new Set()) {
    parsedUrl = parsedUrl || parseDomain(url)

    const fullDomain = `${parsedUrl.subdomain}.${parsedUrl.domain}.${parsedUrl.tld}`
    const nullReturn = { [fullDomain]: null }

    if (visited.has(fullDomain) || visited.size >= maxVisitedCount)
        return Promise.resolve(nullReturn)

    visited.add(fullDomain)

    return new Promise((resolve, reject) => {
        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);

                const links = $('a')
                    .map((i, el) => $(el).attr('href'))
                    .get()
                    .filter(link => link.startsWith('http'))
                    .map(link => {
                        try {
                            return [link, parseDomain(link)]
                        } catch (ex) {
                            return [link, null]
                        }
                    })
                    .filter(([link, parsedUrl]) => !!parsedUrl)

                Promise.all(links.map(([link, parsedUrl]) => buildTree(link, maxVisitedCount, parsedUrl, visited)))
                    .then(linkTrees => {
                        const tree = linkTrees.reduce((acc, curr) => Object.assign(acc, curr), {})
                        resolve({ [fullDomain]: tree })
                    })
                    .catch(_ => resolve(nullReturn))
            } else {
                resolve(nullReturn)
            }
        })
    });
}

app.use('/d3js_projects', express.static(path.join(__dirname, 'd3js_projects')))

app.get('/api/tree', (req, res) => {
    buildTree('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has')
     .then(result => res.send(result))
     .catch(_ => console.log('shit'))
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/d3js_projects/project_1.html'));
});

app.listen(3000);
console.log('Listening on port 3000');
