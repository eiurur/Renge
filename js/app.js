// Generated by CoffeeScript 1.9.2
(function() {
  var Mailer, REDIS_DATABASE_NAME, REDIS_HISTORY, TIMEOUT_MS, app, bodyParser, configs, cookieParser, cors, createHTMLForMail, express, fs, getHistory, hscert, hskey, http, https, httpsOptions, methodOverride, morgan, myUtil, path, redis, redisClient, request, saveHistory, sendMail, server, util;

  fs = require('fs');

  http = require('http');

  https = require('https');

  path = require('path');

  util = require('util');

  cors = require('cors');

  morgan = require('morgan');

  redis = require('redis');

  express = require('express');

  request = require('superagent');

  bodyParser = require('body-parser');

  cookieParser = require('cookie-parser');

  methodOverride = require('method-override');

  configs = require('konfig')();

  myUtil = require('./myUtil').myUtil;

  Mailer = require(path.resolve('js', 'Mailer'));

  TIMEOUT_MS = 10 * 60 * 1000;

  REDIS_DATABASE_NAME = 'ASSIST-WAIFU2X';

  REDIS_HISTORY = REDIS_DATABASE_NAME + ":history";

  redisClient = redis.createClient();

  app = express();

  app.set('port', process.env.PORT || configs.app.PORT);

  app.use(cookieParser());

  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
  }));

  app.use(methodOverride());

  app.use(morgan('dev'));

  app.use(cors());

  app.get('/', function(req, res) {
    res.sendFile(path.resolve('index.html'));
  });

  app.get('/list', function(req, res) {
    res.sendFile(path.resolve('index.html'));
  });

  getHistory = function() {
    return new Promise(function(resolve, reject) {
      return redisClient.lrange(REDIS_HISTORY, 0, -1, function(err, items) {
        if (err) {
          console.error(err);
        }
        return resolve(items);
      });
    });
  };

  saveHistory = function(value) {
    redisClient.rpush(REDIS_HISTORY, value);
    return getHistory().then(function(items) {
      return console.log(items);
    });
  };

  app.post('/api/download/waifu2x', function(req, res) {
    console.log('Go convert!!', req.body);
    console.time("/api/download/waifu2x");
    saveHistory(req.body.url);
    request.post('http://waifu2x.udp.jp/api').type('form').send({
      'url': req.body.url,
      'noise': req.body.noise - 0,
      'scale': req.body.scale - 0
    }).end(function(err, response) {
      if (err) {
        console.log('err = ', err);
        sendMail(err, req.body, response);
        res.json({
          body: req.body,
          error: response.error
        });
        return;
      }
      console.log('res = ', response);
      console.log('res.type = ', response.type);
      console.timeEnd("/api/download/waifu2x");
      return res.json({
        body: response.body,
        type: response.type
      });
    });
    return;
  });

  createHTMLForMail = function(err, body, response) {
    return "<p>Assis-waifu2x Error</p>\n<h1>ERR</h1>\n<p>" + err + "</p>\n<hr>\n<h1>BODY</h1>\n<p>" + body.url + "</p>\n<hr>\n<h1>Response</h1>\n<p>" + response.error + "</p>\n<p>" + response.text + "</p>";
  };

  sendMail = function(err, body, response) {
    var mailer, params;
    params = {
      to: configs.app.MAIL_TO,
      subject: 'Assist-waifu2x Error',
      html: createHTMLForMail(err, body, response)
    };
    mailer = new Mailer(params);
    return mailer.send().then(function(result) {
      return res.json({
        result: result,
        body: body,
        error: response.error
      });
    })["catch"](function(err) {
      return res.json({
        err: err
      });
    });
  };

  hskey = fs.readFileSync(path.resolve('keys', 'renge-key.pem'));

  hscert = fs.readFileSync(path.resolve('keys', 'renge-cert.pem'));

  httpsOptions = {
    key: hskey,
    cert: hscert
  };

  server = https.createServer(httpsOptions, app);

  server.timeout = TIMEOUT_MS;

  server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
  });

}).call(this);
