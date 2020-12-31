function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * @fileOverview graphic util
 * @author huangtonger@aliyun.com
 */
var MathUtil = require('./math');

var BaseUtil = require('./base');

var Global = require('../global');

var PI = Math.PI;
var sin = Math.sin;
var cos = Math.cos; // 一共支持8个方向的自环，每个环占的角度是45度，在计算时再二分，为22.5度

var SELF_LINK_SIN = sin(PI / 8);
var SELF_LINK_COS = cos(PI / 8);

function traverse(data, fn) {
  if (fn(data) === false) {
    return;
  }

  BaseUtil.each(data.children, function (child) {
    traverse(child, fn);
  });
}

var GraphicUtil = {
  getBBox: function getBBox(element, parent) {
    var bbox = element.getBBox();
    var leftTop = {
      x: bbox.minX,
      y: bbox.minY
    };
    var rightBottom = {
      x: bbox.maxX,
      y: bbox.maxY
    }; // 根据父元素变换矩阵

    if (parent) {
      var matrix = parent.getMatrix();
      leftTop = MathUtil.applyMatrix(leftTop, matrix);
      rightBottom = MathUtil.applyMatrix(rightBottom, matrix);
    }

    return {
      minX: leftTop.x,
      minY: leftTop.y,
      maxX: rightBottom.x,
      maxY: rightBottom.y
    };
  },
  // 获取某元素的自环边配置
  getLoopCfgs: function getLoopCfgs(cfg) {
    var item = cfg.sourceNode || cfg.targetNode;
    var containerMatrix = item.get('group').getMatrix();
    var bbox = item.getKeyShape().getBBox();
    var loopCfg = cfg.loopCfg || {}; // 距离keyShape边的最高距离

    var dist = loopCfg.dist || Math.max(bbox.width, bbox.height) * 2; // 自环边与keyShape的相对位置关系

    var position = loopCfg.position || Global.loopPosition;
    var r = Math.max(bbox.width, bbox.height) / 2;
    var scaleRate = (r + dist) / r; // 中心取group上真实位置

    var center = [containerMatrix[6], containerMatrix[7]];
    var sinDelta = r * SELF_LINK_SIN;
    var cosDelta = r * SELF_LINK_COS;
    var startPoint = [cfg.startPoint.x, cfg.startPoint.y];
    var endPoint = [cfg.endPoint.x, cfg.endPoint.y]; // 如果定义了锚点的，直接用锚点坐标，否则，根据自环的 cfg 计算

    if (startPoint[0] === endPoint[0] && startPoint[1] === endPoint[1]) {
      switch (position) {
        case 'top':
          startPoint = [center[0] - sinDelta, center[1] - cosDelta];
          endPoint = [center[0] + sinDelta, center[1] - cosDelta];
          break;

        case 'top-right':
          startPoint = [center[0] + sinDelta, center[1] - cosDelta];
          endPoint = [center[0] + cosDelta, center[1] - sinDelta];
          break;

        case 'right':
          startPoint = [center[0] + cosDelta, center[1] - sinDelta];
          endPoint = [center[0] + cosDelta, center[1] + sinDelta];
          break;

        case 'bottom-right':
          startPoint = [center[0] + cosDelta, center[1] + sinDelta];
          endPoint = [center[0] + sinDelta, center[1] + cosDelta];
          break;

        case 'bottom':
          startPoint = [center[0] + sinDelta, center[1] + cosDelta];
          endPoint = [center[0] - sinDelta, center[1] + cosDelta];
          break;

        case 'bottom-left':
          startPoint = [center[0] - sinDelta, center[1] + cosDelta];
          endPoint = [center[0] - cosDelta, center[1] + sinDelta];
          break;

        case 'left':
          startPoint = [center[0] - cosDelta, center[1] + sinDelta];
          endPoint = [center[0] - cosDelta, center[1] - sinDelta];
          break;

        case 'top-left':
          startPoint = [center[0] - cosDelta, center[1] - sinDelta];
          endPoint = [center[0] - sinDelta, center[1] - cosDelta];
          break;

        default:
          startPoint = [center[0] - sinDelta, center[1] - cosDelta];
          endPoint = [center[0] + sinDelta, center[1] - cosDelta];
      } // 如果逆时针画，交换起点和终点


      if (loopCfg.clockwise === false) {
        var swap = [startPoint[0], startPoint[1]];
        startPoint = [endPoint[0], endPoint[1]];
        endPoint = [swap[0], swap[1]];
      }
    }

    var startVec = [startPoint[0] - center[0], startPoint[1] - center[1]];
    var startExtendVec = BaseUtil.vec2.scale([], startVec, scaleRate);
    var controlPoint1 = [center[0] + startExtendVec[0], center[1] + startExtendVec[1]];
    var endVec = [endPoint[0] - center[0], endPoint[1] - center[1]];
    var endExtendVec = BaseUtil.vec2.scale([], endVec, scaleRate);
    var controlPoint2 = [center[0] + endExtendVec[0], center[1] + endExtendVec[1]];
    cfg.startPoint = {
      x: startPoint[0],
      y: startPoint[1]
    };
    cfg.endPoint = {
      x: endPoint[0],
      y: endPoint[1]
    };
    cfg.controlPoints = [{
      x: controlPoint1[0],
      y: controlPoint1[1]
    }, {
      x: controlPoint2[0],
      y: controlPoint2[1]
    }];
    return cfg;
  },
  traverseTree: function traverseTree(data, fn) {
    if (typeof fn !== 'function') {
      return;
    }

    traverse(data, fn);
  },
  radialLayout: function radialLayout(data, layout) {
    // 布局方式有 H / V / LR / RL / TB / BT
    var VERTICAL_LAYOUTS = ['V', 'TB', 'BT'];
    var min = {
      x: Infinity,
      y: Infinity
    };
    var max = {
      x: -Infinity,
      y: -Infinity
    }; // 默认布局是垂直布局TB，此时x对应rad，y对应r

    var rScale = 'x';
    var radScale = 'y';

    if (layout && VERTICAL_LAYOUTS.indexOf(layout) >= 0) {
      // 若是水平布局，y对应rad，x对应r
      radScale = 'x';
      rScale = 'y';
    }

    var count = 0;
    this.traverseTree(data, function (node) {
      count++;

      if (node.x > max.x) {
        max.x = node.x;
      }

      if (node.x < min.x) {
        min.x = node.x;
      }

      if (node.y > max.y) {
        max.y = node.y;
      }

      if (node.y < min.y) {
        min.y = node.y;
      }
    });
    var avgRad = PI * 2 / count;
    var radDiff = max[radScale] - min[radScale];

    if (radDiff === 0) {
      return data;
    }

    this.traverseTree(data, function (node) {
      var radial = (node[radScale] - min[radScale]) / radDiff * (PI * 2 - avgRad) + avgRad;
      var r = Math.abs(rScale === 'x' ? node.x - data.x : node.y - data.y);
      node.x = r * Math.cos(radial);
      node.y = r * Math.sin(radial);
    });
    return data;
  },

  /**
   * 根据 label 所在线条的位置百分比，计算 label 坐标
   * @param {object}  pathShape  G 的 path 实例，一般是 Edge 实例的 keyShape
   * @param {number}  percent    范围 0 - 1 的线条百分比
   * @param {number}  refX     x 轴正方向为基准的 label 偏移
   * @param {number}  refY     y 轴正方向为基准的 label 偏移
   * @param {boolean} rotate     是否根据线条斜率旋转文本
   * @return {object} 文本的 x, y, 文本的旋转角度
   */
  getLabelPosition: function getLabelPosition(pathShape, percent, refX, refY, rotate) {
    var TAN_OFFSET = 0.0001;
    var vector = [];
    var point = pathShape.getPoint(percent);

    if (point === null) {
      return {
        x: 0,
        y: 0,
        angle: 0
      };
    } // 头尾最可能，放在最前面，使用 g path 上封装的方法


    if (percent < TAN_OFFSET) {
      vector = pathShape.getStartTangent().reverse();
    } else if (percent > 1 - TAN_OFFSET) {
      vector = pathShape.getEndTangent();
    } else {
      // 否则取指定位置的点,与少量偏移的点，做微分向量
      var offsetPoint = pathShape.getPoint(percent + TAN_OFFSET);
      vector.push([point.x, point.y]);
      vector.push([offsetPoint.x, offsetPoint.y]);
    }

    var rad = Math.atan2(vector[1][1] - vector[0][1], vector[1][0] - vector[0][0]);

    if (rad < 0) {
      rad += PI * 2;
    }

    if (refX) {
      point.x += cos(rad) * refX;
      point.y += sin(rad) * refX;
    }

    if (refY) {
      // 默认方向是 x 轴正方向，法线是 求出角度 - 90°
      var normal = rad - PI / 2; // 若法线角度在 y 轴负方向，切到正方向，保证 refY 相对于 y 轴正方向

      if (rad > 1 / 2 * PI && rad < 3 * 1 / 2 * PI) {
        normal -= PI;
      }

      point.x += cos(normal) * refY;
      point.y += sin(normal) * refY;
    } // 需要原始的旋转角度计算 textAlign


    var result = {
      x: point.x,
      y: point.y,
      angle: rad
    };

    if (rotate) {
      if (rad > 1 / 2 * PI && rad < 3 * 1 / 2 * PI) {
        rad -= PI;
      }

      return _extends({
        rotate: rad
      }, result);
    }

    return result;
  }
};
module.exports = GraphicUtil;