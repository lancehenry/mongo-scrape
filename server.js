// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var path = require('path');
var request = require('request');

// Scraping tools
var axios = require('axios');
var cheerio = require('cheerio');

// Require all models
var db = require('./models');

// Initialize Express
var app = express();

var PORT = process.env.PORT || 8000;

// Configure middleware

// Use morgan for logging requests
app.use(logger('dev'));

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));

// Use express.static to serve the public folder
app.use(express.static('public'));

// Connect to the Mongo DB
// mongoose.connect('mongodb://localhost/mongoNPR');
var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/mongoNPR';

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

// GET route for scraping the NPR/arts website
app.get('/scrape', function(req, res) {
  // Grab the body of the html with request
  axios.get('https://www.npr.org/sections/arts/').then(function(response) {
    // Load into cheerio and save it to $ for shorthand
    var $ = cheerio.load(response.data);

    $('article.has-image').each(function(i, element) {
      var result = {};

      result.title = $(element)
        .find('div.item-info')
        .find('.title')
        .find('a')
        .text();
      result.link = $(element)
        .find('div.item-info')
        .find('.title')
        .find('a')
        .attr('href');
      result.summary = $(element)
        .find('p')
        .find('a')
        .text();

      // Create a new Article using the 'result' object
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });
    res.send('Scrape complete!');
  });
});

app.get('/articles', function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get('/articles/:id', function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate('note')
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post('/articles/:id', function(req, res) {
  db.Comment.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post('/articles/:id', function(req, res) {
  db.Comment.create(req.body)
    .then(function(dbArticle) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log('App running on port ' + PORT);
});
