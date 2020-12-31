/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var Layout = require('./layout');
/**
 * 随机布局
 */


Layout.registerLayout('random', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      center: [0, 0],
      // 布局中心
      height: 300,
      width: 300
    };
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var layoutScale = 0.9;
    var center = self.center;
    var width = self.width;

    if (!width && typeof window !== 'undefined') {
      width = window.innerWidth;
    }

    var height = self.height;

    if (!height && typeof height !== 'undefined') {
      height = window.innerHeight;
    }

    nodes.forEach(function (node) {
      node.x = (Math.random() - 0.5) * layoutScale * width + center[0];
      node.y = (Math.random() - 0.5) * layoutScale * height + center[1];
    });
  }
});