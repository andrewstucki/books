var hat = require('hat');
var WebSocketServer = require('websocket').server;
var _ = require('lodash');

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
        payload: user.renderJson()
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

  removeRequests: function(requests, users) {
    //send only to particular users
    if (!websocket) return;
    _.values(users).forEach(function(user) {
      if (!associations.hasOwnProperty(user)) return;
      var role = _.findKey(users, user);
      associations[user].forEach(function(socket) {
        var connection = connections[socket];
        if (!connection) return;
        connection.sendUTF(JSON.stringify({
          type: 'remove',
          entity: role === 'owner' ? 'pendingRequests' : 'submittedRequests',
          payload: requests
        }));
      });
    });
  },

  addBook: function(book) {
    if (!websocket) return;
    for (var key in connections) {
      connections[key].sendUTF(JSON.stringify({
        type: 'add',
        entity: 'books',
        payload: book.renderJson()
      }));
    }
  },

  updateBook: function(book) {
    if (!websocket) return;
    for (var key in connections) {
      connections[key].sendUTF(JSON.stringify({
        type: 'update',
        entity: 'books',
        payload: book.renderJson()
      }));
    }
  },

  addRequest: function(request, users) {
    //send only to particular users
    if (!websocket) return;
    _.values(users).forEach(function(user) {
      if (!associations.hasOwnProperty(user)) return;
      var role = _.findKey(users, user);
      associations[user].forEach(function(socket) {
        var connection = connections[socket];
        if (!connection) return;
        connection.sendUTF(JSON.stringify({
          type: 'add',
          entity: role === 'owner' ? 'pendingRequests' : 'submittedRequests',
          payload: request.renderJson()
        }));
      });
    });
  },

  updateRequest: function(request, users) {
    if (!websocket) return;
    _.values(users).forEach(function(user) {
      if (!associations.hasOwnProperty(user)) return;
      var role = _.findKey(users, user);
      associations[user].forEach(function(socket) {
        var connection = connections[socket];
        if (!connection) return;
        connection.sendUTF(JSON.stringify({
          type: 'update',
          entity: role === 'owner' ? 'pendingRequests' : 'submittedRequests',
          payload: request.renderJson()
        }));
      });
    });
  },

  createSocket: function(app, models) { //need to inject these due to circular dependencies
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
        var filteredAssociations = _.pickBy(associations, function(value) {
          return value.indexOf(id) !== -1;
        });
        _.each(filteredAssociations, function(value, key) {
          associations[key] = _.without(value, id);
        });
      });

      connection.on('message', function(message) {
        if (message.type === 'utf8') {
          try {
            var command = JSON.parse(message.utf8Data);
            switch(command.type) {
            case 'login':
              return models.User.findOne({ sessionToken: command.data, confirmed: true }).then(function(user) {
                if (!user) return;
                associations[user._id] = associations[user._id] || [];
                associations[user._id].push(id);
              });
            case 'logout':
              return models.User.findOne({ sessionToken: command.data, confirmed: true }).then(function(user) {
                if (!user) return;
                associations[user._id] = _.without(associations[user._id], id);;
              });
            }
          } catch(err) {
            console.log("Invalid socket auth request: " + err + "; Request: " + message.utf8Data);
          }
        }
      });
    });
  }
}
