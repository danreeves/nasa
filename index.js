const fs = require('fs');
const { renderSync } = require('node-sass');
const { encode } = require('he');
const normalise = require('normalize-uri');
const parse = require('urlencoded-body-parser')

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
    if (req.method === 'POST') {
        const data = await parse(req);
        if (data.txt) {
            res.writeHead(301, {
                Location: `/${data.txt}`,
            });
            res.end();
        }
    }
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
