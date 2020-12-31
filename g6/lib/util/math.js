/**
 * @fileOverview math util
 * @author huangtonger@aliyun.com
 */
var BaseUtil = require('./base');

var tolerance = 0.001;
var MathUtil = {
  /**
   * 是否在区间内
   * @param   {number}       value  值
   * @param   {number}       min    最小值
   * @param   {number}       max    最大值
   * @return  {boolean}      bool   布尔
   */
  isBetween: function isBetween(value, min, max) {
    return value >= min && value <= max;
  },

  /**
   * 两线段交点
   * @param  {object}  p0 第一条线段起点
   * @param  {object}  p1 第一条线段终点
   * @param  {object}  p2 第二条线段起点
   * @param  {object}  p3 第二条线段终点
   * @return {object}  交点
   */
  getLineIntersect: function getLineIntersect(p0, p1, p2, p3) {
    var E = {
      x: p2.x - p0.x,
      y: p2.y - p0.y
    };
    var D0 = {
      x: p1.x - p0.x,
      y: p1.y - p0.y
    };
    var D1 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y
    };
    var kross = D0.x * D1.y - D0.y * D1.x;
    var sqrKross = kross * kross;
    var sqrLen0 = D0.x * D0.x + D0.y * D0.y;
    var sqrLen1 = D1.x * D1.x + D1.y * D1.y;
    var point = null;

    if (sqrKross > tolerance * sqrLen0 * sqrLen1) {
      var s = (E.x * D1.y - E.y * D1.x) / kross;
      var t = (E.x * D0.y - E.y * D0.x) / kross;

      if (MathUtil.isBetween(s, 0, 1) && MathUtil.isBetween(t, 0, 1)) {
        point = {
          x: p0.x + s * D0.x,
          y: p0.y + s * D0.y
        };
      }
    }

    return point;
  },

  /**
   * point and rectangular intersection point
   * @param  {object} rect  rect
   * @param  {object} point point
   * @return {object} rst;
   */
  getRectIntersectByPoint: function getRectIntersectByPoint(rect, point) {
    var x = rect.x,
        y = rect.y,
        width = rect.width,
        height = rect.height;
    var cx = x + width / 2;
    var cy = y + height / 2;
    var points = [];
    var center = {
      x: cx,
      y: cy
    };
    points.push({
      x: x,
      y: y
    });
    points.push({
      x: x + width,
      y: y
    });
    points.push({
      x: x + width,
      y: y + height
    });
    points.push({
      x: x,
      y: y + height
    });
    points.push({
      x: x,
      y: y
    });
    var rst = null;

    for (var i = 1; i < points.length; i++) {
      rst = MathUtil.getLineIntersect(points[i - 1], points[i], center, point);

      if (rst) {
        break;
      }
    }

    return rst;
  },

  /**
   * get point and circle inIntersect
   * @param {Object} circle 圆点，x,y,r
   * @param {Object} point 点 x,y
   * @return {object} applied point
   */
  getCircleIntersectByPoint: function getCircleIntersectByPoint(circle, point) {
    var cx = circle.x;
    var cy = circle.y;
    var r = circle.r;
    var x = point.x,
        y = point.y;
    var d = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));

    if (d < r) {
      return null;
    }

    var dx = x - cx;
    var dy = y - cy;
    var signX = Math.sign(dx);
    var signY = Math.sign(dy);
    var angle = Math.atan(dy / dx);
    return {
      x: cx + Math.abs(r * Math.cos(angle)) * signX,
      y: cy + Math.abs(r * Math.sin(angle)) * signY
    };
  },

  /**
   * get point and ellipse inIntersect
   * @param {Object} ellipse 椭圆 x,y,rx,ry
   * @param {Object} point 点 x,y
   * @return {object} applied point
   */
  getEllispeIntersectByPoint: function getEllispeIntersectByPoint(ellipse, point) {
    // 计算线段 (point.x, point.y) 到 (ellipse.x, ellipse.y) 与椭圆的交点
    var a = ellipse.rx;
    var b = ellipse.ry;
    var cx = ellipse.x;
    var cy = ellipse.y; // const c = Math.sqrt(a * a - b * b); // 焦距

    var dx = point.x - cx;
    var dy = point.y - cy;
    var angle = Math.atan2(dy / b, dx / a); // 直接通过 x,y 求夹角，求出来的范围是 -PI, PI

    if (angle < 0) {
      angle += 2 * Math.PI; // 转换到 0，2PI
    } // 通过参数方程求交点
    // const r = (b * b) / (a - c * Math.sin(angle));


    return {
      x: cx + a * Math.cos(angle),
      y: cy + b * Math.sin(angle)
    };
  },

  /**
   * coordinate matrix transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  applyMatrix: function applyMatrix(point, matrix, tag) {
    if (tag === void 0) {
      tag = 1;
    }

    var vector = [point.x, point.y, tag];
    BaseUtil.vec3.transformMat3(vector, vector, matrix);
    return {
      x: vector[0],
      y: vector[1]
    };
  },

  /**
   * coordinate matrix invert transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  invertMatrix: function invertMatrix(point, matrix, tag) {
    if (tag === void 0) {
      tag = 1;
    }

    var inversedMatrix = BaseUtil.mat3.invert([], matrix);
    var vector = [point.x, point.y, tag];
    BaseUtil.vec3.transformMat3(vector, vector, inversedMatrix);
    return {
      x: vector[0],
      y: vector[1]
    };
  },

  /**
   * if the graph about the shortest path matrix is connected
   * @param  {array} matrix   shortest path matrix
   * @return {boolean} connected
   */
  isConnected: function isConnected(matrix) {
    if (matrix.length > 0) {
      for (var j = 0; j < matrix[0].length; j++) {
        if (matrix[0][j] === Infinity) return false;
      }
    }

    return true;
  },
  randomInitPos: function randomInitPos(size, xRange, yRange) {
    if (xRange === void 0) {
      xRange = [0, 1];
    }

    if (yRange === void 0) {
      yRange = [0, 1];
    }

    var positions = [];

    for (var i = 0; i < size; i++) {
      var x = Math.random() * (xRange[1] - xRange[0]) + xRange[0];
      var y = Math.random() * (yRange[1] - yRange[0]) + yRange[0];
      positions.push([x, y]);
    }

    return positions;
  },
  getCircleCenterByPoints: function getCircleCenterByPoints(p1, p2, p3) {
    var a = p1.x - p2.x;
    var b = p1.y - p2.y;
    var c = p1.x - p3.x;
    var d = p1.y - p3.y;
    var e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2;
    var f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2;
    var denominator = b * c - a * d;
    return {
      x: -(d * e - b * f) / denominator,
      y: -(a * f - c * e) / denominator
    };
  },
  distance: function distance(p1, p2) {
    var vx = p1.x - p2.x;
    var vy = p1.y - p2.y;
    return Math.sqrt(vx * vx + vy * vy);
  }
};
module.exports = BaseUtil.mix({}, BaseUtil, MathUtil);