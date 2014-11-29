function Model(attrs) {
  this.attrs = attrs || {};
}

/**
 *  Validate a single property.
 */

Model.prototype.validate = function(name, value) {
  var attr = this.attrs[name];
  if (attr.required && value == null /* or undefined */) {
    return (attr.name || name) + ' is required.';
  }
  return attr.validate(value);
};

module.exports = Model;
