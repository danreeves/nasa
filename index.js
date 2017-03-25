const fs = require('fs');
const { parse: parseUrl } = require('url');
const { renderSync } = require('node-sass');
const { encode } = require('he');
const normalise = require('normalize-uri');
const parseBody = require('urlencoded-body-parser')

// Read style.scss from the filesystem into a string
const scss = fs.readFileSync('./style.scss', 'utf8');

// Pass the string into node-sass to be compiled
// it returns an object with a .css property which
// is a Buffer, .toString turns it into a string
const css = renderSync({
    data: scss,
    outputStyle: 'compressed',
}).css.toString();

// Read index.html from the filesystem
// and replace the instance of "{{ css }}" with
// the compile scss output
const html = fs.readFileSync('./index.html', 'utf8').replace('{{ css }}', css);

// This is the function that is called when
//  someone visits the site.
module.exports = async (req, res) => {
    // If the form has been submit
    if (req.method === 'POST') {
        // Get the form data
        const data = await parseBody(req);
        // If the txt field isn't empty
        if (data.txt) {
            // Redirect to that value as a path
            res.writeHead(301, {
                Location: `/${encodeURIComponent(data.txt)}`,
            });
            res.end();
        }
    } else if (req.method === 'GET') {
        // Get query parameters out of the URL
        const url = parseUrl(req.url, true);
        // If there is ?txt and it has a value
        if (url.query && url.query.txt) {
            // Redirect to that value as a path
            res.writeHead(301, {
                Location: `/${encodeURIComponent(url.query.txt)}`,
            });
            res.end();
        }
    }

    // If none of the above matches we want to take the URL
    // do some transforms and replace it into the html
    let path;
    try {
        path = decodeURIComponent(normalise(req.url))
            // Remove the first /
            .replace(/^\//, '')
            // Replace + with a space
            .replace(/\+/g, ' ')
            // Replace multiple spaces with a single space
            .replace(/\s+/g, ' ') ||
            // Default to NASA
            'NASA';
    } catch (err) {
        path = err.toString();
    }
    return html.replace(/{{ name }}/gm, encode(path));
};
