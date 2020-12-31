var Util = require('../util');

var abs = Math.abs;
var DRAG_OFFSET = 10;
var body = document.body;
var ALLOW_EVENTS = [16, 17, 18];
module.exports = {
  getDefaultCfg: function getDefaultCfg() {
    return {
      direction: 'both'
    };
  },
  getEvents: function getEvents() {
    return {
      'canvas:mousedown': 'onMouseDown',
      'canvas:mousemove': 'onMouseMove',
      'canvas:mouseup': 'onMouseUp',
      'canvas:click': 'onMouseUp',
      'canvas:mouseleave': 'onOutOfRange',
      keyup: 'onKeyUp',
      keydown: 'onKeyDown'
    };
  },
  updateViewport: function updateViewport(e) {
    var origin = this.origin;
    var clientX = +e.clientX;
    var clientY = +e.clientY;

    if (isNaN(clientX) || isNaN(clientY)) {
      return;
    }

    var dx = clientX - origin.x;
    var dy = clientY - origin.y;

    if (this.get('direction') === 'x') {
      dy = 0;
    } else if (this.get('direction') === 'y') {
      dx = 0;
    }

    this.origin = {
      x: clientX,
      y: clientY
    };
    this.graph.translate(dx, dy);
    this.graph.paint();
  },
  onMouseDown: function onMouseDown(e) {
    if (this.keydown) {
      return;
    }

    this.origin = {
      x: e.clientX,
      y: e.clientY
    };
    this.dragging = false;
  },
  onMouseMove: function onMouseMove(e) {
    if (this.keydown) {
      return;
    }

    e = Util.cloneEvent(e);
    var graph = this.graph;

    if (!this.origin) {
      return;
    }

    if (this.origin && !this.dragging) {
      if (abs(this.origin.x - e.clientX) + abs(this.origin.y - e.clientY) < DRAG_OFFSET) {
        return;
      }

      if (this.shouldBegin.call(this, e)) {
        e.type = 'dragstart';
        graph.emit('canvas:dragstart', e);
        this.dragging = true;
      }
    }

    if (this.dragging) {
      e.type = 'drag';
      graph.emit('canvas:drag', e);
    }

    if (this.shouldUpdate.call(this, e)) {
      this.updateViewport(e);
    }
  },
  onMouseUp: function onMouseUp(e) {
    if (this.keydown) {
      return;
    }

    if (!this.dragging) {
      this.origin = null;
      return;
    }

    e = Util.cloneEvent(e);
    var graph = this.graph;

    if (this.shouldEnd.call(this, e)) {
      this.updateViewport(e);
    }

    e.type = 'dragend';
    graph.emit('canvas:dragend', e);
    this.endDrag();
  },
  endDrag: function endDrag() {
    if (this.dragging) {
      this.origin = null;
      this.dragging = false; // 终止时需要判断此时是否在监听画布外的 mouseup 事件，若有则解绑

      var fn = this.fn;

      if (fn) {
        body.removeEventListener('mouseup', fn, false);
        this.fn = null;
      }
    }
  },
  // 若在拖拽时，鼠标移出画布区域，此时放开鼠标无法终止 drag 行为。在画布外监听 mouseup 事件，放开则终止
  onOutOfRange: function onOutOfRange(e) {
    if (this.dragging) {
      var self = this;
      var canvasElement = self.graph.get('canvas').get('el');

      var fn = function fn(ev) {
        if (ev.target !== canvasElement) {
          self.onMouseUp(e);
        }
      };

      this.fn = fn;
      body.addEventListener('mouseup', fn, false);
    }
  },
  onKeyDown: function onKeyDown(e) {
    var code = e.keyCode || e.which;

    if (!code) {
      return;
    }

    if (ALLOW_EVENTS.indexOf(code) > -1) {
      this.keydown = true;
    } else {
      this.keydown = false;
    }
  },
  onKeyUp: function onKeyUp() {
    this.keydown = false;
  }
};