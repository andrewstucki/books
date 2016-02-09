var hat = require('hat');
var WebSocketServer = require('websocket').server;
var _ = require('underscore');

var config = require('./config');

var websocket;
var connections = {};
var associations = {};
var socketOriginAllowed = function(origin) {
  return origin === config.baseUrl;
};

module.exports = {
  updateUser: function(user) {
    if (!websocket) return;
    for (var key in connections) {
      connections[key].sendUTF(JSON.stringify({
        type: 'update',
        entity: 'users',
        payload: user
      }));
    }
  },

  removeBooks: function(books) {
    if (!websocket) return;
    for (var key in connections) {
      connections[key].sendUTF(JSON.stringify({
        type: 'remove',
        entity: 'books',
        payload: books
      }));
    }
  },

  removeRequests: function(users, requests) {
    //send only to particular users
    if (!websocket) return;
    for (var key in users) {
      connections[associations[key]].sendUTF(JSON.stringify({
        type: 'remove',
        entity: 'requests',
        payload: requests
      }));
    }
  },

  addBook: function(book) {
    if (!websocket) return;
    for (var key in connections) {
      connections[key].sendUTF(JSON.stringify({
        type: 'add',
        entity: 'books',
        payload: book
      }));
    }
  },

  addRequest: function(users, request) {
    //send only to particular users
    if (!websocket) return;
    for (var key in users) {
      connections[associations[key]].sendUTF(JSON.stringify({
        type: 'add',
        entity: 'requests',
        payload: request
      }));
    }
  },

  createSocket: function(app) {
    if (!!websocket) return;

    websocket = new WebSocketServer({
      httpServer: app,
      fragmentOutgoingMessages: false,
      autoAcceptConnections: false
    });

    websocket.on('request', function(request) {
      if (!socketOriginAllowed(request.origin)) return request.reject();
      var connection = request.accept('books', request.origin);
      var id = hat();
      connections[id] = connection;
      connection.on('close', function() {
        delete connections[id]
      });

      connection.on('message', function(message) {
        if (message.type === 'utf8') {
          try {
            var command = JSON.parse(message.utf8Data);

            switch(command.type) {
            case 'login':
              models.User.findOne({ sessionToken: command.data.sessionToken, confirmed: true }).then(function(user) {
                associations[user._id] = id;
              }).catch(function(err) {
                console.log("Invalid login socket request: " + err);
              });
            case 'logout':
              models.User.findOne({ sessionToken: command.data.sessionToken, confirmed: true }).then(function(user) {
                delete associations[user._id];
              }).catch(function(err) {
                console.log("Invalid logout socket request: " + err);
              });
            }
          } catch(err) {
            console.log("Unable to parse JSON: " + message.utf8Data);
          }
        }
      });
    });
  }
}
