var models = require("./models");

var unauthorized = function(res) {
  return res.status(401).json({
    error: "Unauthorized"
  });
};

var authenticate = function(confirmed) {
  return function(req, res, next) {
    var token = req.get("x-books-session");
    if (!token) return unauthorized(res);
    var params = { sessionToken: token };
    if (typeof confirmed !== 'undefined') params.confirmed = !!confirmed;
    models.User.findOne(params).then(function(user) {
      if (!user) return unauthorized(res);
      req.user = user;
      return next();
    }).catch(function(err) {
      return res.status(500).json({
        error: "Something went wrong"
      });
    });
  };
};
module.exports = {
  authenticate: authenticate
};
