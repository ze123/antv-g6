function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/**
 * @fileOverview node item
 * @author huangtonger@aliyun.com
 */
var Util = require('../util/');

var Item = require('./item');

var CACHE_ANCHOR_POINTS = 'anchorPointsCache';
var CACHE_BBOX = 'bboxCache';

function getNearestPoint(points, curPoint) {
  var index = 0;
  var nearestPoint = points[0];
  var minDistance = pointDistance(points[0], curPoint);

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    var distance = pointDistance(point, curPoint);

    if (distance < minDistance) {
      nearestPoint = point;
      minDistance = distance;
      index = i;
    }
  }

  nearestPoint.anchorIndex = index;
  return nearestPoint;
}

function pointDistance(p1, p2) {
  return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
}

var Node =
/*#__PURE__*/
function (_Item) {
  _inheritsLoose(Node, _Item);

  function Node() {
    return _Item.apply(this, arguments) || this;
  }

  var _proto = Node.prototype;

  _proto.getDefaultCfg = function getDefaultCfg() {
    return {
      type: 'node',
      anchors: [],
      edges: [],
      status: []
    };
  } // getNeighbors() {
  //   const nodes = [];
  //   let node = null;
  //   Util.each(this.get('edges'), edge => {
  //     if (edge.get('source') === this) {
  //       node = edge.get('target');
  //     } else {
  //       node = edge.get('source');
  //     }
  //     if (nodes.indexOf(node) < 0) {
  //       nodes.push(node);
  //     }
  //   });
  //   return nodes;
  // }

  /**
   * 获取从节点关联的所有边
   * @return {Array} 边的集合
   */
  ;

  _proto.getEdges = function getEdges() {
    return this.get('edges');
  }
  /**
   * 获取引入节点的边 target == this
   * @return {Array} 边的集合
   */
  ;

  _proto.getInEdges = function getInEdges() {
    var self = this;
    return this.get('edges').filter(function (edge) {
      return edge.get('target') === self;
    });
  }
  /**
   * 获取从节点引出的边 source == this
   * @return {Array} 边的集合
   */
  ;

  _proto.getOutEdges = function getOutEdges() {
    var self = this;
    return this.get('edges').filter(function (edge) {
      return edge.get('source') === self;
    });
  } // showAnchors() {
  //   // todo
  // }
  // hideAnchors() {
  // }

  /**
   * 根据锚点的索引获取连接点
   * @param  {Number} index 索引
   * @return {Object} 连接点 {x,y}
   */
  ;

  _proto.getLinkPointByAnchor = function getLinkPointByAnchor(index) {
    var anchorPoints = this.getAnchorPoints();
    return anchorPoints[index];
  }
  /**
    * 获取连接点
    * @param {Object} point 节点外面的一个点，用于计算交点、最近的锚点
    * @return {Object} 连接点 {x,y}
    */
  ;

  _proto.getLinkPoint = function getLinkPoint(point) {
    // const model = this.get('model');
    var keyShape = this.get('keyShape');
    var type = keyShape.get('type');
    var bbox = this.getBBox();
    var centerX = bbox.centerX,
        centerY = bbox.centerY;
    var anchorPoints = this.getAnchorPoints();
    var intersectPoint;

    switch (type) {
      case 'circle':
        intersectPoint = Util.getCircleIntersectByPoint({
          x: centerX,
          y: centerY,
          r: bbox.width / 2
        }, point);
        break;

      case 'ellipse':
        intersectPoint = Util.getEllispeIntersectByPoint({
          x: centerX,
          y: centerY,
          rx: bbox.width / 2,
          ry: bbox.height / 2
        }, point);
        break;

      default:
        intersectPoint = Util.getRectIntersectByPoint(bbox, point);
    }

    var linkPoint = intersectPoint; // 如果存在锚点，则使用交点计算最近的锚点

    if (anchorPoints.length) {
      if (!linkPoint) {
        // 如果计算不出交点
        linkPoint = point;
      }

      linkPoint = getNearestPoint(anchorPoints, linkPoint);
    }

    if (!linkPoint) {
      // 如果最终依然没法找到锚点和连接点，直接返回中心点
      linkPoint = {
        x: centerX,
        y: centerY
      };
    }

    return linkPoint;
  }
  /**
   * 锁定节点
   */
  ;

  _proto.lock = function lock() {
    this.set('locked', true);
  }
  /**
   * 解锁锁定的节点
   */
  ;

  _proto.unlock = function unlock() {
    this.set('locked', false);
  };

  _proto.hasLocked = function hasLocked() {
    return this.get('locked');
  }
  /**
   * 添加边
   * @param {Edge} edge 边
   */
  ;

  _proto.addEdge = function addEdge(edge) {
    this.get('edges').push(edge);
  }
  /**
   * 移除边
   * @param {Edge} edge 边
   */
  ;

  _proto.removeEdge = function removeEdge(edge) {
    var edges = this.getEdges();
    var index = edges.indexOf(edge);

    if (index > -1) {
      edges.splice(index, 1);
    }
  };

  _proto.clearCache = function clearCache() {
    this.set(CACHE_BBOX, null); // 清理缓存的 bbox

    this.set(CACHE_ANCHOR_POINTS, null);
  } // 是否仅仅移动节点，其他属性没变化
  ;

  _proto._isOnlyMove = function _isOnlyMove(cfg) {
    if (!cfg) {
      return false; // 刷新时不仅仅移动
    } // 不能直接使用 cfg.x && cfg.y 这类的判定，因为 0 的情况会出现


    var existX = !Util.isNil(cfg.x);
    var existY = !Util.isNil(cfg.y);
    var keys = Object.keys(cfg);
    return keys.length === 1 && (existX || existY) || // 仅有一个字段，包含 x 或者 包含 y
    keys.length === 2 && existX && existY; // 两个字段，同时有 x，同时有 y
  }
  /**
   * 获取锚点的定义
   * @return {array} anchorPoints， {x,y,...cfg}
   */
  ;

  _proto.getAnchorPoints = function getAnchorPoints() {
    var anchorPoints = this.get(CACHE_ANCHOR_POINTS);

    if (!anchorPoints) {
      anchorPoints = [];
      var shapeFactory = this.get('shapeFactory');
      var bbox = this.getBBox();
      var model = this.get('model');
      var shapeCfg = this.getShapeCfg(model);
      var points = shapeFactory.getAnchorPoints(model.shape, shapeCfg) || [];
      Util.each(points, function (pointArr, index) {
        var point = Util.mix({
          x: bbox.minX + pointArr[0] * bbox.width,
          y: bbox.minY + pointArr[1] * bbox.height
        }, pointArr[2], {
          index: index
        });
        anchorPoints.push(point);
      });
      this.set(CACHE_ANCHOR_POINTS, anchorPoints);
    }

    return anchorPoints;
  };

  return Node;
}(Item);

module.exports = Node;