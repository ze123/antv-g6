/**
 * @fileOverview graph fit canvas
 * @author huangtonger@aliyun.com
 */
var Util = require('../../util');

var View =
/*#__PURE__*/
function () {
  function View(graph) {
    this.graph = graph;
  }

  var _proto = View.prototype;

  _proto.getFormatPadding = function getFormatPadding() {
    return Util.formatPadding(this.graph.get('fitViewPadding'));
  };

  _proto._fitView = function _fitView() {
    var padding = this.getFormatPadding();
    var graph = this.graph;
    var group = graph.get('group');
    var width = graph.get('width');
    var height = graph.get('height');
    group.resetMatrix();
    var bbox = group.getBBox();

    var viewCenter = this._getViewCenter();

    var groupCenter = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2
    };
    graph.translate(viewCenter.x - groupCenter.x, viewCenter.y - groupCenter.y);
    var w = (width - padding[1] - padding[3]) / bbox.width;
    var h = (height - padding[0] - padding[2]) / bbox.height;
    var ratio = w;

    if (w > h) {
      ratio = h;
    }

    graph.zoom(ratio, viewCenter);
  };

  _proto.focusPoint = function focusPoint(point) {
    var viewCenter = this._getViewCenter();

    var modelCenter = this.getPointByCanvas(viewCenter.x, viewCenter.y);
    var viewportMatrix = this.graph.get('group').getMatrix();
    this.graph.translate((modelCenter.x - point.x) * viewportMatrix[0], (modelCenter.y - point.y) * viewportMatrix[4]);
  };

  _proto.getPointByClient = function getPointByClient(clientX, clientY) {
    var canvas = this.graph.get('canvas');
    var pixelRatio = canvas.get('pixelRatio');
    var canvasPoint = canvas.getPointByClient(clientX, clientY);
    return this.getPointByCanvas(canvasPoint.x / pixelRatio, canvasPoint.y / pixelRatio);
  };

  _proto.getClientByPoint = function getClientByPoint(x, y) {
    var canvas = this.graph.get('canvas');
    var canvasPoint = this.getCanvasByPoint(x, y);
    var pixelRatio = canvas.get('pixelRatio');
    var point = canvas.getClientByPoint(canvasPoint.x * pixelRatio, canvasPoint.y * pixelRatio);
    return {
      x: point.clientX,
      y: point.clientY
    };
  };

  _proto.getPointByCanvas = function getPointByCanvas(canvasX, canvasY) {
    var viewportMatrix = this.graph.get('group').getMatrix();
    var point = Util.invertMatrix({
      x: canvasX,
      y: canvasY
    }, viewportMatrix);
    return point;
  };

  _proto.getCanvasByPoint = function getCanvasByPoint(x, y) {
    var viewportMatrix = this.graph.get('group').getMatrix();
    return Util.applyMatrix({
      x: x,
      y: y
    }, viewportMatrix);
  };

  _proto.focus = function focus(item) {
    if (Util.isString(item)) {
      item = this.graph.findById(item);
    }

    if (item) {
      var matrix = item.get('group').getMatrix(); // 用实际位置而不是model中的x,y,防止由于拖拽等的交互导致model的x,y并不是当前的x,y

      this.focusPoint({
        x: matrix[6],
        y: matrix[7]
      });
    }
  };

  _proto.changeSize = function changeSize(width, height) {
    if (!Util.isNumber(width) || !Util.isNumber(height)) {
      throw Error('invalid canvas width & height');
    }

    var graph = this.graph;
    graph.set({
      width: width,
      height: height
    });
    var canvas = this.graph.get('canvas');
    canvas.changeSize(width, height);
  };

  _proto._getViewCenter = function _getViewCenter() {
    var padding = this.getFormatPadding();
    var graph = this.graph;
    var width = this.graph.get('width');
    var height = graph.get('height');
    return {
      x: (width - padding[2] - padding[3]) / 2 + padding[3],
      y: (height - padding[0] - padding[2]) / 2 + padding[0]
    };
  };

  _proto.destroy = function destroy() {
    this.graph = null;
    this.destroyed = true;
  };

  return View;
}();

module.exports = View;