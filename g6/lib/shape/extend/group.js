var Util = require('../../util');

var Group = require('@antv/g/lib').Group;

module.exports = Util.augment(Group, {
  findByClassName: function findByClassName(className) {
    return this.find(function (shape) {
      return shape.get('className') === className;
    });
  }
});