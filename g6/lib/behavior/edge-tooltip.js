var Util = require('../util');

var base = require('./tooltip-base');

module.exports = Util.mix({
  getDefaultCfg: function getDefaultCfg() {
    return {
      item: 'edge',
      formatText: function formatText(model) {
        return 'source:' + model.source + ' target:' + model.target;
      }
    };
  },
  getEvents: function getEvents() {
    return {
      'edge:mouseenter': 'onMouseEnter',
      'edge:mouseleave': 'onMouseLeave',
      'edge:mousemove': 'onMouseMove'
    };
  }
}, base);