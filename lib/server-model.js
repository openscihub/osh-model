var EventEmitter = require('events').EventEmitter;
var Model = require('./model');
var extend = require('xtend/mutable');
var series = require('async').series;
var tick = process.nextTick;

function ServerModel(attrs) {
  Model.call(this, attrs);
  EventEmitter.call(this);
  this._acked = {};
  this._keep = {};
}

extend(ServerModel.prototype, Model.prototype, EventEmitter.prototype, {
  _ack: function(attr) {
    if (attr in this.attrs) {
      return this._acked[attr] = true;
    }
  },

  keep: function(attr) {
    if (this._ack(attr)) {
      this._keep[attr] = true;
    }
  },

  toss: function(attr) {
    this._ack(attr);
  },

  on: function(event, callback) {
    this._ack(event);
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
      if (name in this._keep) {
        _model[name] = model[name];
      }
      else {
        tasks.push(
          this.emit.bind(this, name, model[name], _model)
        );
      }
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
        if (name in this._keep) {
          _model[name] = model[name];
        }
        else {
          tasks.push(
            this.emit.bind(this, name, model[name], _model)
          );
        }
      }
    }

    series(tasks, function(err) {
      callback(err, _model);
    });
  },

  check: function() {
    for (var name in this.attrs) {
      if (!(name in this._acked)) {
        throw new Error('Missing "' + name + '" listener');
      }
    }
  }
});

module.exports = ServerModel;
