require('dotenv').load();

var server = require('http').createServer();
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
var path = require('path');

var models = require('./models');
var config = require('./config');
var middleware = require('./middleware');
var errors = require('./errors');
var socket = require('./socket');

var app = express();
var jsonParser = bodyParser.json();

var queue = require('./queue');
var email = require('./workers/email');

queue.process('email', email);

app.use(express.static('public'));
app.get(/^\/(login|signup|resend|users|profile|books).*/, function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../public/index.html'));
});

var router  = express.Router();
app.use('/api/v1', router);

// application core

var unauthorized = function(res, message) {
  return res.status(401).json({
    error: message || "Unauthorized"
  });
};

var notFound = function(res, message) {
  return res.status(404).json({
    error: message || "Not Found"
  });
};

var invalid = function(res, message) {
  return res.status(422).json({
    error: message || "Invalid"
  });
};

var internalError = function(res) {
  return res.status(500).json({
    error: "Something went wrong"
  });
}

var handleError = function(res, err) {
  if (config.environment !== "test") {
    if (typeof err === "string") {
      console.log(err);
    } else {
      console.log(err.toString());
    }
  }
  if (err instanceof errors.NotFound) return notFound(res, err.toString());
  if (err instanceof errors.ModelInvalid) return invalid(res, err.toString());
  if (err instanceof errors.Unauthorized) return unauthorized(res, err.toString());
  return internalError(res);
};

// user creation and authentication
router.post("/session", jsonParser, function(req, res) {
  if (!req.body) return unauthorized(res);
  models.User.login(req.body.email, req.body.password).then(function(user) {
    return res.status(201).json(user.renderToken());
  }).catch(handleError.bind(this, res));
});

router.delete("/session", middleware.authenticate(), function(req, res) {
  req.user.logout().then(function(user) {
    return res.status(202).send({});
  }).catch(handleError.bind(this, res));
});

router.get("/profile", middleware.authenticate(), function(req, res) {
  return res.status(200).json(req.user.renderToken());
});

router.put("/profile", jsonParser, middleware.authenticate(), function(req, res) {
  return res.status(202).json({})
});

router.get("/confirm/:token", function(req, res) {
  models.User.confirm(req.params.token).then(function(user) {
    return res.redirect('/login?confirmed=true');
  }).catch(handleError.bind(this, res));
});

router.post("/confirm/resend", middleware.authenticate(false), function(req, res) {
  req.user.sendConfirmation().then(function() {
    return res.status(201).json({
      message: "Confirmation message sent to: " + req.user.email
    });
  }).catch(handleError.bind(this, res));
});

router.post("/signup", jsonParser, function(req, res) {
  if (!req.body) return invalid(res);
  models.User.signup(req.body.username, req.body.name, req.body.email, req.body.password, req.body.confirmation).then(function(user) {
    return res.status(201).json({
      message: "Confirmation message sent to: " + user.email
    });
  }).catch(handleError.bind(this, res));
});

// users
router.get("/users/:id/books", function(req, res) {
  models.Book.getBooksForUser(req.params.id).then(function(books) {
    return res.status(200).json(_.map(books, function(book) {
      return book.renderJson();
    }));
  }).catch(handleError.bind(this, res));
});

// books
router.get("/books/search/:query", middleware.authenticate(true), function(req, res) {
  models.Book.search(req.params.query).then(function(books) {
    return res.status(200).json(books);
  }).catch(handleError.bind(this, res));
});

router.get("/books", function(req, res) {
  models.Book.find({}).populate('user').then(function(books) {
    return res.status(200).json(_.map(books, function(book) {
      return book.renderJson();
    }));
  }).catch(handleError.bind(this, res));
});

router.post("/books", jsonParser, middleware.authenticate(true), function(req, res) {
  if (!req.body) return invalid(res);
  req.user.createBook(req.body.title, req.body.authors, req.body.thumbnail, req.body.link).then(function(book) {
    return res.status(200).json(book.renderJson());
  }).catch(handleError.bind(this, res));
});

router.delete("/books/:id", middleware.authenticate(true), function(req, res) {
  req.user.deleteBook(req.params.id).then(function() {
    return res.status(202).json({});
  }).catch(handleError.bind(this, res));
});

// requests
router.get("/requests/pending", middleware.authenticate(true), function(req, res) {
  req.user.pendingRequests().then(function(requests) {
    return res.status(200).json(_.map(requests, function(request) {
      return request.renderJson();
    }));
  }).catch(handleError.bind(this, res));
});

router.get("/requests/submitted", middleware.authenticate(true), function(req, res) {
  req.user.submittedRequests().then(function(requests) {
    return res.status(200).json(_.map(requests, function(request) {
      return request.renderJson();
    }));
  }).catch(handleError.bind(this, res));
});

router.post("/requests", jsonParser, middleware.authenticate(true), function(req, res) {
  if (!req.body) return invalid(res);
  req.user.createRequest(req.body.owner, req.body.book).then(function(request) {
    return res.status(201).json(request.renderJson());
  }).catch(handleError.bind(this, res));
});

router.post("/requests/:id/accept", jsonParser, middleware.authenticate(true), function(req, res) {
  req.user.acceptRequest(req.params.id).then(function() {
    return res.status(202).json({});
  }).catch(handleError.bind(this, res));
});

router.post("/requests/:id/reject", jsonParser, middleware.authenticate(true), function(req, res) {
  req.user.rejectRequest(req.params.id).then(function() {
    return res.status(202).json({});
  }).catch(handleError.bind(this, res));
});

router.delete("/requests/:id", jsonParser, middleware.authenticate(true), function(req, res) {
  req.user.deleteRequest(req.params.id).then(function() {
    return res.status(202).json({});
  }).catch(handleError.bind(this, res));
});

server.on('request', app);
module.exports = server.listen(config.port, function() {
  if (config.environment !== 'test') console.log('Books app listening on port ' + config.port + '!');
});

socket.createSocket(server, models);
