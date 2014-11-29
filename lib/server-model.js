var EventEmitter = require('events').EventEmitter;
var Model = require('./model');
var extend = require('xtend/mutable');
var series = require('osh-async-series');
var tick = process.nextTick;

function ServerModel(attrs) {
  Model.call(this, attrs);
  EventEmitter.call(this);
  this._attrListeners = {};
}

extend(ServerModel.prototype, Model.prototype, EventEmitter.prototype, {

  on: function(event, callback) {
    if (event in this.attrs) {
      this._attrListeners[event] = true;
    }
    return EventEmitter.prototype.on.call(this, event, callback);
  },

  create: function(model, callback) {
    var tasks = [];
    var _model = {};
    var msg;

    // Must validate all attrs.
    for (var name in this.attrs) {
      msg = this.validate(name, model[name]);
      if (msg) {
        return tick(function() {
          callback(new Error(msg));
        });
      }
      tasks.push(
        this.emit.bind(this, name, model[name], _model)
      );
    }

    series(tasks, function(err) {
      callback(err, _model);
    });
  },

  update: function(model, callback) {
    var tasks = [];
    var _model = {};
    var msg;

    // Validate only given attrs.
    for (var name in model) {
      if (name in this.attrs) {
        msg = this.validate(name, model[name]);
        if (msg) {
          return tick(function() {
            callback(new Error(msg));
          });
        }
        tasks.push(
          this.emit.bind(this, name, model[name], _model)
        );
      }
    }

    series(tasks, function(err) {
      callback(err, _model);
    });
  },

  check: function() {
    for (var name in this.attrs) {
      if (!(name in this._attrListeners)) {
        throw new Error('Missing "' + name + '" listener');
      }
    }
  }
});

module.exports = ServerModel;
