var Util = require('../util/index');

var Shape = require('../core/shape');

var Arrow = require('./util/arrow');

var LineMath = require('./math/line');

var Line = function Line(cfg) {
  Line.superclass.constructor.call(this, cfg);
};

Line.ATTRS = {
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  lineWidth: 1,
  startArrow: false,
  endArrow: false
};
Util.extend(Line, Shape);
Util.augment(Line, {
  canStroke: true,
  type: 'line',
  getDefaultAttrs: function getDefaultAttrs() {
    return {
      lineWidth: 1,
      startArrow: false,
      endArrow: false
    };
  },
  calculateBox: function calculateBox() {
    var attrs = this._attrs;
    var x1 = attrs.x1,
        y1 = attrs.y1,
        x2 = attrs.x2,
        y2 = attrs.y2;
    var lineWidth = this.getHitLineWidth();
    return LineMath.box(x1, y1, x2, y2, lineWidth);
  },
  createPath: function createPath(context) {
    var self = this;
    var attrs = this._attrs;
    var x1 = attrs.x1,
        y1 = attrs.y1,
        x2 = attrs.x2,
        y2 = attrs.y2; // 如果定义了箭头，并且是自定义箭头，线条相应缩进

    if (attrs.startArrow && attrs.startArrow.d) {
      var dist = Arrow.getShortenOffset(x1, y1, x2, y2, attrs.startArrow.d);
      x1 += dist.dx;
      y1 += dist.dy;
    }

    if (attrs.endArrow && attrs.endArrow.d) {
      var _dist = Arrow.getShortenOffset(x1, y1, x2, y2, attrs.endArrow.d);

      x2 -= _dist.dx;
      y2 -= _dist.dy;
    }

    context = context || self.get('context');
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
  },
  afterPath: function afterPath(context) {
    var self = this;
    var attrs = self._attrs;
    var x1 = attrs.x1,
        y1 = attrs.y1,
        x2 = attrs.x2,
        y2 = attrs.y2;
    context = context || self.get('context');

    if (attrs.startArrow) {
      Arrow.addStartArrow(context, attrs, x2, y2, x1, y1);
    }

    if (attrs.endArrow) {
      Arrow.addEndArrow(context, attrs, x1, y1, x2, y2);
    }
  },
  getPoint: function getPoint(t) {
    var attrs = this._attrs;
    return {
      x: LineMath.at(attrs.x1, attrs.x2, t),
      y: LineMath.at(attrs.y1, attrs.y2, t)
    };
  }
});
module.exports = Line;