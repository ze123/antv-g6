var Util = require('../util');

var DEFAULT_TRIGGER = 'shift';
var ALLOW_EVENTS = ['shift', 'ctrl', 'alt'];
module.exports = {
  getDefaultCfg: function getDefaultCfg() {
    return {
      multiple: true,
      trigger: DEFAULT_TRIGGER
    };
  },
  getEvents: function getEvents() {
    if (!this.multiple) {
      return {
        'node:click': 'onClick',
        'canvas:click': 'onCanvasClick'
      };
    }

    return {
      'node:click': 'onClick',
      'canvas:click': 'onCanvasClick',
      keyup: 'onKeyUp',
      keydown: 'onKeyDown'
    };
  },
  onClick: function onClick(e) {
    var self = this;
    var item = e.item;
    var graph = self.graph;
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);

    if (!self.keydown || !self.multiple) {
      var selected = graph.findAllByState('node', 'selected');
      Util.each(selected, function (node) {
        if (node !== item) {
          graph.setItemState(node, 'selected', false);
        }
      });
    }

    if (item.hasState('selected')) {
      if (self.shouldUpdate.call(self, e)) {
        graph.setItemState(item, 'selected', false);
      }

      graph.emit('nodeselectchange', {
        target: item,
        select: false
      });
    } else {
      if (self.shouldUpdate.call(self, e)) {
        graph.setItemState(item, 'selected', true);
      }

      graph.emit('nodeselectchange', {
        target: item,
        select: true
      });
    }

    graph.setAutoPaint(autoPaint);
    graph.paint();
  },
  onCanvasClick: function onCanvasClick() {
    var graph = this.graph;
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);
    var selected = graph.findAllByState('node', 'selected');
    Util.each(selected, function (node) {
      graph.setItemState(node, 'selected', false);
    });
    var selectedEdges = graph.findAllByState('edge', 'selected');
    Util.each(selectedEdges, function (edge) {
      return graph.setItemState(edge, 'selected', false);
    });
    graph.paint();
    graph.setAutoPaint(autoPaint);
  },
  onKeyDown: function onKeyDown(e) {
    var code = e.key;

    if (!code) {
      return;
    }

    if (ALLOW_EVENTS.indexOf(code.toLowerCase() > -1)) {
      this.keydown = true;
    } else {
      this.keydown = false;
    }
  },
  onKeyUp: function onKeyUp() {
    this.keydown = false;
  }
};