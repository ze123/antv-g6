var Util = require('../util');

var base = require('./tooltip-base');

module.exports = Util.mix({
  getDefaultCfg: function getDefaultCfg() {
    return {
      item: 'node',
      formatText: function formatText(model) {
        return model.label;
      }
    };
  },
  getEvents: function getEvents() {
    return {
      'node:mouseenter': 'onMouseEnter',
      'node:mouseleave': 'onMouseLeave',
      'node:mousemove': 'onMouseMove'
    };
  }
}, base);