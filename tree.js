const express = require('express');
const path = require('path');
const Promise = require("bluebird");
const request = require('request');
const cheerio = require('cheerio');
const parseDomain = require('parse-domain')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

const Tree = require('./treeModel');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connection to the mongodb
mongoose.connect('mongodb://tree:123456@ds117485.mlab.com:17485/treedata');
mongoose.connection.once('open', () => {
    console.log('Connected to Database');
});

// buildTree starts at the single url and from there recursively it visits all the children of that web page. 
// Children are found as hyperlinks that are present in the fetched HTML page.
// There's a limit on how much work we are going to do by storing all the visited domains in the 'visited' set.  
function buildTree(url, maxVisitedCount = 100, parsedUrl = null, visited = new Set()) {
    parsedUrl = parsedUrl || parseDomain(url)

    // console.log('Inside BT')
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/d3js_projects/project_1.html'));
});

app.get('/api/tree', (req, res) => {
    // if it's not in db bulid tree
    // if it's in db get that data from db
    // have to stringfy data
    Tree.findOne({ url: req.query.url }, (err, tree) => {
        // if it's not in db build tree
        if (!err) {
            if (!tree) {
                //build tree
                buildTree(req.query.url)
                    .then(result => {
                        let strResult = JSON.stringify(result);
                        let treeData = new Tree({
                            url: req.query.url,
                            data: strResult
                        });
                        treeData.save().then((doc)=> {
                            // console.log(JSON.parse(doc.data))
                            res.send(JSON.parse(doc.data))
                        }). catch((err) => {
                            console.log('Error')
                        })
                    })
                    .catch(_ => console.log('shiiit'))
                //if its not error and if tree exist
            } else {
                res.send(JSON.parse(tree.data));
            }
        } 
    })
})

app.listen(3000);
console.log('Listening on port 3000');
