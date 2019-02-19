const express = require('express');
const hbs = require('hbs');

const app = express();

hbs.registerPartials(__dirname + '/public/views/partials');
app.set('view engine', 'hbs');
app.set('views', __dirname + '/public/views');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

hbs.registerHelper('getManifest', function(context) {
    return JSON.stringify(context);
});

app.get("/serviceWorker.js", (req, res) => {
    res.sendFile(__dirname + '/public/serviceWorker.js');
});

app.get('/download', (req, res) => {
    res.render('download.hbs', {
        manifest: "download"
    });
});

app.get('/', (req, res) => {
    // res.render('index11.html');
    // const param = req.params;
    // console.log(param);
    res.render('index.hbs');
});

app.get('/:manifest', (req, res) => {
    // res.render('index11.html');
    const manifest = req.params.manifest;
    res.render('player.hbs',  {
        manifest: manifest
    });
});
app.listen('3000');
