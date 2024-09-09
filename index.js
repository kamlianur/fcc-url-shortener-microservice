require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('node:dns');

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: String,
    required: true,
    unique: true
  }
})

let UrlModel = mongoose.model('url', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use('/', bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  let url = req.body.url;
  let urlObj = new URL(url);
  dns.lookup(urlObj.hostname, (err, address, family) => {
    if (!address || !family) {
      res.json({error: 'invalid url'})
    } else {
      let oriUrl = urlObj.href;
      UrlModel.findOne({original_url: oriUrl}).then((foundUrl) => {
        if (foundUrl) {
          res.json({
            original_url: foundUrl.original_url,
            short_url: foundUrl.short_url
          })
        } else {
          let shortUrl = 1;
          UrlModel.find({}).sort(
            {short_url: "desc"}).limit(1).then(
              (urls) => {
              if (urls.length > 0){
                shortUrl = parseInt(urls[0].short_url) + 1;
              }
              resObj = {
                original_url: oriUrl,
                short_url: shortUrl
              }
              
              let newURL = new UrlModel(resObj);
              newURL.save();
              res.json(resObj);
            })
          }
      })
    }
  })
})

app.get('/api/shorturl/:short_url', (req, res) => {
  let shortUrl = req.params.short_url;
  UrlModel.findOne({short_url: shortUrl}).then((foundUrl) => {
    res.redirect(foundUrl.original_url)
  });
})

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

const start = async () => {
  try {
    await mongoose .connect(process.env.MONGO_URI);
    app.listen(port, function() {
      console.log(`Listening on port ${port}`)
    })
  } catch(e) {
    console.log(e.message)
  }
}

start();
