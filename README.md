# Model

A very simple starting point for **public** model definitions in an
isomorphic Node.js web app or API. Its few features include

- a model validation system and
- an event system that makes sure all model attributes are being
  handled by the developer.

Check out the source; it's short.

## Installation

```
npm install osh-model
```

## Background

You would like to define your models once and reuse code for client-side and
server-side validation.  Also, separating model definitions from storage seems
like a nice way to abstract your storage technique (i.e.  which database
software you use) in case you want to change later.

This library helps isolate your backend changes from your public interface
agreement and helps with development by enforcing handling of all model
attributes.  It makes a single assumption about your storage techniques:
they exist.

## Usage

Model definition (let's call it `user.js`):

```js
var Model = require('osh-model');

var User = new Model({
  username: {
    validate: function(username) {
      if (!/^[a-z]$/.test(username)) return 'Use a-z.';
    },
    required: true
  },

  password: {
    validate: function(password) {
      if (password.length < 4) return 'That a short password!';
    },
    required: true
  }
});

module.exports = User;
```

Server-side usage:

```js
var User = require('./user');
var bcrypt = require('bcrypt');

User.keep('username');

User.on('password', function(password, user, done) {
  bcrypt.hash(password, 8, function(err, hash) {
    user.pwhash = hash;
    done(err);
  });
});

// Throws if you forgot to listen for an attribute. Yay.
User.check();

app.post('/users', function(req, res, next) {
  User.create(req.body, function(err, user) {
    if (err) return next(err);

    // Persist here; user is validated.

    res.send({
      message: 'ok',
      result: user
    });
  });
});
```


In the browser:

```js
var User = require('./user');

var input = document.getElementById('password');
input.onchange = function(ev) {
  var msg = User.validate('password', ev.target.value);
  if (msg) {
    // Add message to the document next to the password input.
  }
  else {
    // Remove any messages.
  }
};
```

## Documentation

In the browser, a Model is just a validator. Use it to check the values
of form inputs before querying your API. Nuff said.

On the server, a Model is an augmented EventEmitter. It emits an event
(named by attribute) whenever a model is created or updated.

### Model.on(attr, callback)

Listen for the creation of the indicated attribute. This is fired whenever the
attribute is encountered on a call to
[Model.create](#modelcreatemodel-callback) or
[Model.update](#modelupdatemodel-callback).

The callback takes 3 arguments:

```
callback(value, model, done)
```

where `value` is the value of the *validated* attribute,
`model` is a POJO namespace, and `done` is a function that must be called
when finished operating on the attribute.

The `model` namespace is for passing along processed attributes to the
callbacks on [Model.create](#modelcreatemodel-callback) and
[Model.update](#modelupdatemodel-callback). Most commonly, you will
want to pass `value` to `model` like so:

```js
User.on('username', function(value, user, done) {
  user.username = username;
  done();
});
```

For such a common operation, there is a shortcut...

### Model.keep(attr)

Equivalent to, e.g.:

```js
User.on('username', function(username, user, done) {
  user.username = username;
  done();
});
```

but saves you from a function call. This is little more than recognition
that the attribute exists and it should be taken as given (if validated).

### Model.toss(attr)

Yeah, `attr` exists, we know. Don't fail on Model.check().

### Model.check()

Call this after setting all attribute listeners. If one is missing,
it will throw an error.

### Model.create(model, callback)

Call this on the server when you want to create an instance of the model. This
function simply validates the attributes of `model` (and makes sure they exist,
if required) and fires the attribute events.  In an Express app, you will
probably pass `req.body` directly as `model`.

The `callback` provides an error in the first slot, and the validated
model in the second.

```
callback(err, model)
```

Here, `model` is **not** the same object passed to Model.create(); rather,
it is the namespace passed to each attribute callback.

### Model.update(model, callback)

The only difference between this and
[Model.create](#modelcreatemodel-callback), is that this version validates (and
fires the events for) only those attributes defined on the given `model`
instance, whereas Model.create validates all attributes on the Model
definition.


## License

MIT
