var Botkit = require('botkit');

function get_response(){
  var responses = [
    'There was a car coming.',
    'To get to the other side.',
    'To get the newspaper.',
    'Because it wanted to find out what those jokes were about.',
    'To boldly go where no chicken has gone before!',
    'Because the light was green.',
    'I could tell you, but then the Chicken Mafia would kill me.'
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

var controller = Botkit.slackbot({
  debug: false
});

var bot = controller.spawn({
  token: process.env.SLACK_TOKEN
}).startRTM();

controller.hears(['why did the chicken cross the road'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.reply(message, get_response());
});
var valuesMessage = {
    "text": "What would you like to praise them for?",
    "response_type": "in_channel",
    "attachments": [
        {
            "text": "Choose a game to play",
            "fallback": "If you could read this message, you'd be choosing something fun to do right now.",
            "color": "#cc0000",
            "attachment_type": "default",
            "callback_id": "value_selection",
            "actions": [
                {
                    "name": "values_list",
                    "text": "Choose a value",
                    "type": "select",
                    "options": [
                        {
                            "text": "Design openly",
                            "value": "design"
                        },
                        {
                            "text": "Offer generously",
                            "value": "offer"
                        },
                        {
                            "text": "Nurture curiosity",
                            "value": "nurture"
                        },
                        {
                            "text": "Cultivate community",
                            "value": "cultivate"
                        }
                    ]
                }
            ]
        }
    ]
}

controller.hears(['praise', 'reward', '++'], 'ambient', function(bot, message) {
  bot.reply(message, valuesMessage);
});






var express = require('express'),
fs      = require('fs'),
app     = express(),
eps     = require('ejs'),
morgan  = require('morgan');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
