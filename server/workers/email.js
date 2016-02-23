var fs = require('fs');

var mandrill = require('mandrill-api/mandrill');
var handlebars = require('handlebars');
var _ = require('lodash');

var User = require('../models').User;
var config = require('../config');

var mailer = new mandrill.Mandrill(config.mandrill_key);
var templates = {
  html: {},
  plain: {}
};

_.each(["html", "plain"], function(templateType) {
  var dirname = __dirname + "/../emails/" + templateType + "/";
  fs.readdir(dirname, function(err, filenames) {
    if (err) throw new Error("Unable to read template directory");
    _.each(filenames, function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        var templateName = filename.split(".")[0];
        if (err) throw new Error("Unable to read templates");
        templates[templateType][templateName] = handlebars.compile(content);
      });
    });
  });
});

var generateEmail = function(user, subject, templateName, context) {
  return {
    from_email: "no.reply.voting.app+books@gmail.com",
    from_name: "Books App",
    headers: {
      "Reply-To": "no.reply.voting.app+books@gmail.com"
    },
    html: templates.html[templateName](context),
    text: templates.plain[templateName](context),
    subject: subject,
    to: [{
      "email": user.email,
      "type": "to"
    }]
  };
};

module.exports = function(job, done) {
  return User.findOne({
    _id: job.data.user_id,
    confirmed: false
  }).then(function(user){
    if (!user) return done(new Error('user invalid'));
    var confirmationLink = config.baseUrl + "/api/v1/confirm/" + user.confirmationToken;
    mailer.messages.send({
      message: generateEmail(user, "Confirm your Books App email address!", "confirm", {
          confirmationLink: confirmationLink
        }),
      async: false
    }, function(result) {
      if (result[0].status !== 'sent') return done(new Error('send failed: ' + result.status));
      done();
    }, done);
  }).catch(done);
};
