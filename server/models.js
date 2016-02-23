var https = require('https');
var querystring = require('querystring');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var promise = require('promise');
var hat = require('hat');
var _ = require('lodash');
var md5 = require('md5');
var moment = require('moment');

var config = require("./config");
var errors = require("./errors");
var queue = require("./queue");
var socket = require("./socket");

var baseSearchUrl = "https://www.googleapis.com/books/v1/volumes?"

// initialize mongo
mongoose.Promise = promise;
mongoose.connect(config.db);

// utils

var validateUrl = function(url) {
  return /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(url)
};

// Users
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String
  },
  name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false,
    require: true
  },
  confirmationToken: String,
  sessionToken: String,
  gravatarId: String
});

var userValidators = {
  email: function(email) {
    return {
      valid: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email),
      message: "Invalid email address."
    }
  },
  username: function(username) {
    return {
      valid: /^[A-Za-z0-9]{5,15}$/.test(username),
      message: "Username must be between 5 and 15 characters and may only contain lower case letters, upper case letters, and numbers."
    }
  },
  password: function(password) {
    return {
      valid: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password),
      message: "Password must be at least 8 characters and must include at least one upper case letter, one lower case letter, and one number."
    }
  },
  confirmation: function(confirmation, password) {
    return {
     valid: confirmation !== '' && password === confirmation,
     message: "Confirmation must not be empty and must match password."
    }
  }
};

var userValidation = function(fields) {
  var usernameValidation;
  var emailValidation;
  var passwordValidation;
  var confirmationValidation;

  if (fields.username) usernameValidation = userValidators.username(fields.username);
  if (fields.email) emailValidation = userValidators.email(fields.email);
  if (fields.password) passwordValidation = userValidators.password(fields.password);
  if (fields.confirmation && fields.password) confirmationValidation = userValidators.confirmation(fields.password, fields.confirmation);

  var errors = []
  if (usernameValidation && !usernameValidation.valid) errors.push(usernameValidation.message);
  if (emailValidation && !emailValidation.valid) errors.push(emailValidation.message);
  if (passwordValidation && !passwordValidation.valid) errors.push(passwordValidation.message);
  if (confirmationValidation && !confirmationValidation.valid) errors.push(confirmationValidation.message);

  return errors;
};

userSchema.statics.signup = function(username, name, email, password, confirmation, skipEmail) {
  var schema = this;
  return new promise(function(resolve, reject) {
    var validationErrors = userValidation({username, email, password, confirmation});
    if (validationErrors.length !== 0) return reject(new errors.ModelInvalid(validationErrors.join("; ")));
    var params = {
      username: username,
      email: email,
      password: password,
      confirmed: !!skipEmail
    };
    if (name) params.name = name;
    var user = new schema(params);
    user.save().then(function(user) {
      if (!skipEmail) return user.sendConfirmation().then(resolve.bind(this, user)).catch(reject);
      return resolve(user);
    }).catch(function(err) {
      if (err.code === 11000) {
        if (/email/.test(err.errmsg)) return reject(new errors.ModelInvalid('Email address already taken!'));
        if (/username/.test(err.errmsg)) return reject(new errors.ModelInvalid('Username already taken!'));
      }
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.statics.confirm = function(token) {
  var schema = this;
  return new promise(function(resolve, reject) {
    schema.findOne({
      confirmationToken: token,
      confirmed: false
    }).then(function(user) {
      if (!user) return reject(new errors.NotFound("Token not found"));
      user.confirmed = true;
      user.confirmationToken = undefined;
      return user.save().then(function(user) {
        resolve(user)
        socket.updateUser(user);
      }).catch(function(err){
        if (err.code === 11000) return reject(new errors.ModelInvalid("Invalid User"));
        return reject(new errors.DatabaseFailure(err.toString()));
      });
    }).then(function(user) {
      resolve(user);
    });
  });
};

userSchema.statics.login = function(email, password) {
  var schema = this;
  return new promise(function(resolve, reject) {
    schema.findOne({
      email: email
    }).then(function(user) {
      if (!user) return reject(new errors.NotFound("Unable to find user with matching email address"));
      bcrypt.compare(password, user.password, function(err, match) {
        if (err) return reject(new Error("Bcrypt error: " + err.toString()));
        if (!match) return reject(new errors.ModelInvalid("Password Mismatch"));
        user.sessionToken = hat();
        user.save().then(resolve).catch(function(err) {
          if (err.code === 11000) return reject(new errors.ModelInvalid("Invalid User"));
          reject(new errors.DatabaseFailure(err.toString()));
        });
      });
    }).catch(function(err) {
      reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.logout = function() {
  this.sessionToken = undefined;
  return this.save();
};

userSchema.methods.sendConfirmation = function() {
  var user = this;
  return new promise(function(resolve, reject) {
    if (user.confirmed) return reject(new errors.ModelInvalid("User email already confirmed"));
    var job = queue.create('email', {
      user_id: user._id
    }).save(function(err) {
      if (err) return(reject(err));
      return resolve()
    })

    job.on('complete', function(result) {
      console.log('Sent confirmation email to: ' + user.email);
    }).on('failed attempt', function(errorMessage, doneAttempts) {
      console.log('Confirmation attempt ' + doneAttempts + 'for ' + user.email + ', email send failed: ' + errorMessage);
    }).on('failed', function(errorMessage) {
      console.log('Confirmation job permanently failed for ' + user.email + ': ' + errorMessage);
    });
  });
};

userSchema.methods.pendingRequests = function() {
  var user = this;
  return new promise(function(resolve, reject) {
    Request.find({
      owner: user._id,
      accepted: null
    }).populate(['book', 'requestor', 'owner']).then(resolve).catch(function(err) {
      reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.updateProfile = function(profile) {
  var user = this;
  return new promise(function(resolve, reject) {
    if (!profile.password || !profile.confirmation || (profile.password !== profile.confirmation)) return reject(new errors.ModelInvalid("Must supply matching password and confirmation"));
    bcrypt.compare(profile.password, user.password, function(err, match) {
      if (err) return reject(new Error("Bcrypt error: " + err.toString()));
      if (!match) return reject(new errors.ModelInvalid("Password Mismatch"));

      var params = {};
      if (profile.username) params.username = profile.username;
      if (profile.email) params.email = profile.email;
      if (profile.location) params.location = profile.location;
      var validationErrors = userValidation(params);
      if (validationErrors.length !== 0) return reject(new errors.ModelInvalid(validationErrors.join("; ")));

      user.email = params.email || user.email;
      user.username = params.username || user.username;
      user.location = params.location || user.location;
      user.save().then(function(updated) {
        socket.updateUser(updated);
        return resolve(updated);
      }).catch(function(err) {
        if (err.code === 11000) {
          if (/email/.test(err.errmsg)) return reject(new errors.ModelInvalid('Email address already taken!'));
          if (/username/.test(err.errmsg)) return reject(new errors.ModelInvalid('Username already taken!'));
        }
        return reject(new errors.DatabaseFailure(err.toString()));
      });
    });
  });
};

userSchema.methods.deleteProfile = function() {
  var user = this;
  return new promise(function(resolve, reject) {
    user.remove().then(function(user) {
      return resolve(user);
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

// user-books
userSchema.methods.createBook = function(title, authors, thumbnail, link) {
  var user = this;
  return new promise(function(resolve, reject) {
    var validationErrors = bookValidation({ thumbnail: thumbnail, link: link });
    if (validationErrors.length !== 0) return reject(new errors.ModelInvalid(validationErrors.join("; ")));
    var params = {
      user: user._id,
      title: title,
      authors: authors,
      thumbnail: thumbnail,
      link: link
    };
    new Book(params).save().then(function(book) {
      book.user = user;
      socket.addBook(book);
      return resolve(book);
    }).catch(function(err) {
      if (err.code === 11000) return reject(new errors.ModelInvalid("Invalid Book"));
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.deleteBook = function(book) {
  var user = this;
  return new promise(function(resolve, reject) {
    Book.findOneAndRemove({
      _id: mongoose.Types.ObjectId(book),
      user: user._id,
    }).then(function(book) {
      if (!book) return reject(new errors.NotFound('Book not found'));
      socket.removeBooks([book._id]);
      return resolve(book);
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

// user-requests
userSchema.methods.submittedRequests = function() {
  var user = this;
  return new promise(function(resolve, reject) {
    Request.find({
      requestor: user._id,
      accepted: null
    }).populate(['book', 'requestor', 'owner']).then(resolve).catch(function(err) {
      reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.createRequest = function(owner, book) {
  var user = this;
  return new promise(function(resolve, reject) {
    if (mongoose.Types.ObjectId(owner) === user._id) return reject(new errors.ModelInvalid("You cannot request your own book!"));
    Book.findOne({
      user: mongoose.Types.ObjectId(owner),
      _id: mongoose.Types.ObjectId(book)
    }).then(function(book) {
      if (!book) return reject(new errors.NotFound("Book does not belong to that user"));
      var validationErrors = requestValidation({ owner: owner, requestor: user._id, book: book });
      if (validationErrors.length !== 0) return reject(new errors.ModelInvalid(validationErrors.join("; ")));
      var params = {
        owner: owner,
        requestor: user._id,
        book: book._id
      };
      Request.findOne(_.extend({}, params, {accepted: null})).then(function(request) {
        if (request) return reject(new errors.ModelInvalid('You have already requested this book!'));
        new Request(params).save().then(function(request) {
          request.populate(['book', 'owner', 'requestor'], function(err) {
            if (err) reject(new errors.ModelInvalid('Unable to populate references'));
            socket.addRequest(request, {owner: request.owner._id, requestor: request.requestor._id});
            resolve(request);
          });
        }).catch(function(err) {
          if (err.code === 11000) return reject(new errors.ModelInvalid('Model invalid'));
          return reject(new errors.DatabaseFailure(err.toString()));
        });
      }).catch(function(err) {
        return reject(new errors.DatabaseFailure(err.toString()));
      });
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.acceptRequest = function(request) {
  var user = this;
  return new promise(function(resolve, reject) {
    Request.findOneAndUpdate({
      _id: mongoose.Types.ObjectId(request),
      owner: user._id,
      accepted: null
    }, { accepted: true }).then(function(request) {
      if (!request) return reject(new errors.NotFound('Request not found'));
      Request.update({
        book: request.book,
        accepted: null
      }, { accepted: false }).then(function(rejectedRequests) {
        //Reject all other requests
        request.populate(['book', 'owner', 'requestor'], function(err) {
          if (err) reject(new errors.ModelInvalid('Unable to populate references'));
          request.book.user = request.requestor;
          request.book.save().then(function(updated) {
            socket.updateBook(request.book);
            if (rejectedRequests.length > 0) {
              Request.populate(rejectedRequests, { path: 'owner requestor' }).then(function(rejectedRequests) {
                rejectedRequests.forEach(function(request) {
                  socket.updateRequest(request, {owner: request.owner._id, requestor: request.requestor._id});
                });
              }).catch(function(err) {
                console.log("Failed to populate rejected requests and notify users " + err);
              });
            }
            socket.updateRequest(request, {owner: request.owner._id, requestor: request.requestor._id});
            resolve(request);
          }).catch(function(err) {
            return reject(new errors.DatabaseFailure(err.toString()));
          });
        });
      }).catch(function(err) {
        return reject(new errors.DatabaseFailure(err.toString()));
      });
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    })
  });
};

userSchema.methods.rejectRequest = function(request) {
  var user = this;
  return new promise(function(resolve, reject) {
    Request.findOneAndUpdate({
      _id: mongoose.Types.ObjectId(request),
      owner: user._id,
      accepted: null
    }, { accepted: false }).then(function(request) {
      if (!request) return reject(new errors.NotFound('Request not found'));
      request.populate(['book', 'owner', 'requestor'], function(err) {
        if (err) reject(new errors.ModelInvalid('Unable to populate references'));
        socket.updateRequest(request, {owner: request.owner._id, requestor: request.requestor._id});
        resolve(request);
      });
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.deleteRequest = function(request) {
  var user = this;
  return new promise(function(resolve, reject) {
    Request.findOneAndRemove({
      _id: mongoose.Types.ObjectId(request),
      requestor: user._id,
      accepted: null
    }).populate(['requestor', 'owner']).then(function(request) {
      if (!request) return reject(new errors.NotFound('Request not found'));
      socket.removeRequests([request._id], {owner: request.owner._id, requestor: request.requestor._id});
      return resolve(request);
    }).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

userSchema.methods.renderToken = function() {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    gravatarId: this.gravatarId,
    email: this.email,
    location: this.location,
    confirmed: this.confirmed,
    token: this.sessionToken
  };
};

userSchema.methods.renderJson = function() {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    location: this.location,
    gravatarId: this.gravatarId
  };
};

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.confirmed && !user.confirmationToken)
    user.confirmationToken = hat();
  if (!user.gravatarId)
    user.gravatarId = md5(user.email.trim().toLowerCase());
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.pre('remove', function(next) {
  Book.remove({user: this._id}).then(function(removed) {
    if (removed.length > 0) socket.removeBooks(_.map(removed, function(record) { return record._id; }));
    Request.remove({$or: [{'requestor': this._id}, {'owner': this._id}]}).then(function(removed) {
      if (removed.length > 0) removed.forEach(function(request) {
        socket.removeRequests([record._id], {owner: request.owner, requestor: request.requestor});
      });
      return next();
    }).catch(function (err) {
      console.log("Unable to remove requests associated with user: " + err);
      return next(err);
    });
  }).catch(function (err) {
    console.log("Unable to remove books owned by user: " + err);
    return next(err);
  });
});

var User = mongoose.model('User', userSchema);

// Books
var bookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  authors: [{
    type: String
  }],
  thumbnail: {
    type: String
  },
  link: {
    type: String,
    required: true
  }
});

var bookValidators = {
  thumbnail: function(thumbnail) {
    return {
      valid: validateUrl(thumbnail),
      message: "Thumbnail must be a valid url."
    }
  },
  link: function(link) {
    return {
      valid: validateUrl(link),
      message: "Link must be a valid url."
    }
  }
};

var bookValidation = function(fields) {
  var thumbnailValidation;
  var linkValidation;

  if (fields.thumbnail) thumbnailValidation = bookValidators.thumbnail(fields.thumbnail);
  if (fields.link) linkValidation = bookValidators.link(fields.link);

  var errors = []
  if (thumbnailValidation && !thumbnailValidation.valid) errors.push(thumbnailValidation.message);
  if (linkValidation && !linkValidation.valid) errors.push(linkValidation.message);

  return errors;
};

bookSchema.statics.getBooksForUser = function(id) {
  var schema = this;
  return new promise(function(resolve, reject) {
    schema.find({
      user: id
    }).populate('user').then(resolve).catch(function(err) {
      return reject(new errors.DatabaseFailure(err.toString()));
    });
  });
};

bookSchema.statics.search = function(q) {
  var query = {
    q: q,
    fields: 'items(id,volumeInfo(title,authors,imageLinks,infoLink,maturityRating))',
    printType: 'books'
  };
  return new promise(function(resolve, reject) {
    https.get(baseSearchUrl + querystring.stringify(query), function(response){
      if ( response.statusCode && response.statusCode === 200 ) {
        var body = '';
  			response.on('data', function(data) {
  				body += data;
  			});

  			response.on('end', function(){
          var data = JSON.parse(body);
          if (!data.items) reject(new Error("Invalid payload received"));
          var books = _.uniqBy(data.items.map(function(book) {
            if (!book.volumeInfo) return null;
            if (book.volumeInfo.maturityRating !== 'NOT_MATURE') return null;
            var bookInfo = { title: book.volumeInfo.title, id: book.id, link: book.volumeInfo.infoLink };
            if (book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.smallThumbnail) bookInfo.thumbnail = book.volumeInfo.imageLinks.smallThumbnail;
            if (book.volumeInfo.authors) bookInfo.authors = book.volumeInfo.authors;
            return bookInfo;
          }), 'id');
          return resolve(books);
        });
      } else {
        var body = '';
        response.on('data', function(data) {
          body += data;
        });
        response.on('end', function(){
          try {
            var json = JSON.parse(body);
            if (json.error && json.error.message) return reject(new errors.ApiClientFailure('' + response.statusCode + ':' + json.error.message));
            return reject(new errors.ApiClientFailure('Generic API error: ' + response.statusCode));
          } catch(err) {
            return reject(new errors.ApiClientFailure('Generic API error: ' + response.statusCode));
          }
          return reject(new errors.ApiClientFailure(body.error.message));
        });
      }
    });
  });
};

bookSchema.methods.renderJson = function() {
  return {
    id: this._id,
    user: {
      id: this.user._id,
      username: this.user.username
    },
    title: this.title,
    authors: this.authors,
    thumbnail: this.thumbnail,
    link: this.link
  }
};

var Book = mongoose.model('Book', bookSchema);

// Requests
var requestSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  requestor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accepted: {
    type: Boolean
  }
});

var requestValidators = {
  requestor: function(requestor, owner) {
    return {
      valid: owner !== requestor,
      message: "Requestor cannot be the same person as the owner."
    }
  },
  owner: function(owner, requestor) {
    return {
      valid: owner !== requestor,
      message: "Owner cannot be the same person as the requestor."
    }
  },
  book: function(book, owner) {
    return {
      valid: book.user !== owner,
      message: "Book must be owned by owner."
    }
  }
};

var requestValidation = function(fields) {
  var requestorValidation;
  var ownerValidation;
  var bookValidation;

  if (fields.requestor) requestorValidation = requestValidators.requestor(fields.requestor, fields.owner);
  if (fields.owner) ownerValidation = requestValidators.owner(fields.owner, fields.requestor);
  if (fields.book) bookValidation = requestValidators.book(fields.book, fields.owner);

  var errors = []
  if (requestorValidation && !requestorValidation.valid) errors.push(requestorValidation.message);
  if (ownerValidation && !ownerValidation.valid) errors.push(ownerValidation.message);
  if (bookValidation && !bookValidation.valid) errors.push(bookValidation.message);

  return errors;
};

requestSchema.methods.renderJson = function() {
  return {
    id: this._id,
    book: {
      id: this.book._id,
      title: this.book.title,
      authors: this.book.authors
    },
    owner: {
      id: this.owner._id,
      username: this.owner.username
    },
    requestor: {
      id: this.requestor._id,
      username: this.requestor.username
    }
  };
};

var Request = mongoose.model('Request', requestSchema);

module.exports = {
  Book: Book,
  Request: Request,
  User: User
};
