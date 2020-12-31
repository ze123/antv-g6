/**
 * @fileOverview path util
 * @author huangtonger@aliyun.com
 */
var G = require('@antv/g/lib');

var BaseUtil = require('./base');

var vec2 = BaseUtil.vec2;
/**
 * 替换字符串中的字段.
 * @param {String} str 模版字符串
 * @param {Object} o json data
 * @param {RegExp} [regexp] 匹配字符串的正则表达式
 */

function substitute(str, o) {
  if (!str || !o) {
    return str;
  }

  return str.replace(/\\?\{([^{}]+)\}/g, function (match, name) {
    if (match.charAt(0) === '\\') {
      return match.slice(1);
    }

    return o[name] === undefined ? '' : o[name];
  });
}

module.exports = {
  getSpline: function getSpline(points) {
    var data = [];

    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      data.push(point.x);
      data.push(point.y);
    }

    var splinePath = G.PathUtil.catmullRomToBezier(data);
    splinePath.unshift(['M', points[0].x, points[0].y]);
    return splinePath;
  },

  /**
   * 根据起始点、相对位置、偏移量计算控制点
   * @param  {Object} startPoint 起始点，包含 x,y
   * @param  {Object} endPoint  结束点, 包含 x,y
   * @param  {Number} percent   相对位置,范围 0-1
   * @param  {Number} offset    偏移量
   * @return {Object} 控制点，包含 x,y
   */
  getControlPoint: function getControlPoint(startPoint, endPoint, percent, offset) {
    var point = {
      x: (1 - percent) * startPoint.x + percent * endPoint.x,
      y: (1 - percent) * startPoint.y + percent * endPoint.y
    };
    var tangent = []; // 类似于 C 语言的写法，真难用

    vec2.normalize(tangent, [endPoint.x - startPoint.x, endPoint.y - startPoint.y]);
    var perpendicular = [-tangent[1] * offset, tangent[0] * offset]; // 垂直向量

    point.x += perpendicular[0];
    point.y += perpendicular[1];
    return point;
  },

  /**
   * 点集转化为Path多边形
   * @param {Array} points 点集
   * @param {Boolen} z 是否封闭
   * @return {Array} Path
   */
  pointsToPolygon: function pointsToPolygon(points, z) {
    if (!points.length) {
      return '';
    }

    var path = '';
    var str = '';

    for (var i = 0, length = points.length; i < length; i++) {
      var item = points[i];

      if (i === 0) {
        str = 'M{x} {y}';
      } else {
        str = 'L{x} {y}';
      }

      path += substitute(str, item);
    }

    if (z) {
      path += 'Z';
    }

    return path;
  }
};