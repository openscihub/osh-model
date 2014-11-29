var Model = require('..');
var expect = require('expect.js');

describe('Model', function() {

  function MakeUser(opts) {
    var attrs = {};

    if (opts.username) {
      attrs.username = {
        validate: function(username) {
          if (!/^[a-z]+$/.test(username)) return 'Nope.';
        }
      };
    }
    if (opts.password) {
      attrs.password = {
        validate: function(password) {
          if (password.length < 4) return 'Password too short.';
        }
      };
    }

    return new Model(attrs);
  }

  describe('check()', function() {
    it('should pass', function() {
      var User = MakeUser({username: true});
      User.on('username', function(username, done) {
        done();
      });
      expect(function() {
        User.check();
      })
      .to.not.throwException();
    });

    it('should fail', function() {
      var User = MakeUser({username: true});
      expect(function() {
        User.check();
      })
      .to.throwException(/Missing "username"/);
    });
  });

  describe('on({attr})', function() {
    it('should emit on create', function(done) {
      var User = MakeUser({username: true});
      User.on('username', function(username, user, done) {
        expect(username).to.be('tory');
        user.username = username;
        done();
      });
      User.create({username: 'tory'}, function(err, user) {
        expect(user).to.eql({username: 'tory'});
        done();
      });
    });
  });

  describe('create()', function() {
    it('should fail on invalid attribute', function(done) {
      var User = MakeUser({username: true});
      User.create({username: 'TORY'}, function(err, user) {
        expect(err).to.be.ok();
        expect(err.message).to.match(/Nope\./);
        done();
      });
    });
  });

  describe('keep()', function() {
    it('should pass along validated attr', function(done) {
      var User = MakeUser({username: true});
      User.keep('username');
      User.create({username: 'tory'}, function(err, user) {
        expect(err).to.not.be.ok();
        expect(user.username).to.be('tory');
        done();
      });
    });
  });

  describe('on("create")', function() {
    it('should fire', function(done) {
      var User = MakeUser({username: true});
      User.on('create', function(user) {
        user.goodie = 'yum';
      });
      User.on('username', function(username, user, done) {
        expect(username).to.be('tory');
        expect(user.goodie).to.be('yum');
        done();
      });
      User.create({username: 'tory'}, function(err, user) {
        expect(err).to.not.be.ok();
        expect(user.goodie).to.be('yum');
        done();
      });
    });
  });

  describe('on("update")', function() {
    it('should fire', function(done) {
      var User = MakeUser({username: true});
      User.on('update', function(user) {
        user.goodie = 'yum';
      });
      User.on('username', function(username, user, done) {
        expect(username).to.be('tory');
        expect(user.goodie).to.be('yum');
        done();
      });
      User.update({username: 'tory'}, function(err, user) {
        expect(err).to.not.be.ok();
        expect(user.goodie).to.be('yum');
        done();
      });
    });
  });

  describe('update()', function() {
    it('should validate instance attrs', function(done) {
      var passwordCalled = false;
      var User = MakeUser({
        username: true,
        password: true
      });
      User.on('username', function(username, user, done) {
        expect(username).to.be('tory');
        done();
      });
      User.on('password', function(username, user, done) {
        passwordCalled = true;
        done();
      });
      User.update({username: 'tory'}, function(err, user) {
        expect(passwordCalled).to.be(false);
        expect(user).to.eql({});
        done();
      });
    });

    it('should fail on invalid attribute', function(done) {
      var User = MakeUser({username: true});
      User.update({username: 'TORY'}, function(err, user) {
        expect(err).to.be.ok();
        expect(err.message).to.match(/Nope\./);
        done();
      });
    });
  });
});
