function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/**
 * @fileOverview edge item
 * @author huangtonger@aliyun.com
 */
var Util = require('../util/');

var Item = require('./item');

var END_MAP = {
  source: 'start',
  target: 'end'
};
var ITEM_NAME_SUFFIX = 'Node'; // 端点的后缀，如 sourceNode, targetNode

var POINT_NAME_SUFFIX = 'Point'; // 起点或者结束点的后缀，如 startPoint, endPoint

var ANCHOR_NAME_SUFFIX = 'Anchor';

var Edge =
/*#__PURE__*/
function (_Item) {
  _inheritsLoose(Edge, _Item);

  function Edge() {
    return _Item.apply(this, arguments) || this;
  }

  var _proto = Edge.prototype;

  _proto.getDefaultCfg = function getDefaultCfg() {
    return {
      type: 'edge',
      sourceNode: null,
      targetNode: null,
      startPoint: null,
      endPoint: null,
      linkCenter: false // 参数名暂时没想好，是连接节点的中心，还是直接连接 x,y

    };
  };

  _proto.init = function init() {
    _Item.prototype.init.call(this); // 初始化两个端点


    this.setSource(this.get('source'));
    this.setTarget(this.get('target'));
  };

  _proto.setSource = function setSource(source) {
    this._setEnd('source', source);

    this.set('source', source);
  };

  _proto.setTarget = function setTarget(target) {
    this._setEnd('target', target);

    this.set('target', target);
  };

  _proto.getSource = function getSource() {
    return this.get('source');
  };

  _proto.getTarget = function getTarget() {
    return this.get('target');
  }
  /**
   * 边不需要重计算容器位置，直接重新计算 path 位置
   * @param {object} cfg 待更新数据
   */
  ;

  _proto.update = function update(cfg) {
    var model = this.get('model');
    Util.mix(model, cfg);
    this.updateShape();
    this.afterUpdate();
    this.clearCache();
  };

  _proto.updatePosition = function updatePosition() {} // 设置端点：起点或者结束点
  ;

  _proto._setEnd = function _setEnd(name, value) {
    var pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    var itemName = name + ITEM_NAME_SUFFIX;
    var preItem = this.get(itemName);
    preItem && preItem.removeEdge(this); // 如果之前存在节点，则移除掉边

    if (Util.isPlainObject(value)) {
      // 如果设置成具体的点，则清理节点
      this.set(pointName, value);
      this.set(itemName, null);
    } else {
      value.addEdge(this);
      this.set(itemName, value);
      this.set(pointName, null);
    }
  } // 获取与端点相交的节点
  ;

  _proto._getLinkPoint = function _getLinkPoint(name, model, controlPoints) {
    var pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    var itemName = name + ITEM_NAME_SUFFIX;
    var point = this.get(pointName);

    if (!point) {
      var item = this.get(itemName);
      var anchorName = name + ANCHOR_NAME_SUFFIX;

      var prePoint = this._getPrePoint(name, controlPoints);

      var anchorIndex = model[anchorName];

      if (!Util.isNil(anchorIndex)) {
        // 如果有锚点，则使用锚点索引获取连接点
        point = item.getLinkPointByAnchor(anchorIndex);
      } // 如果锚点没有对应的点或者没有锚点，则直接计算连接点


      point = point || item.getLinkPoint(prePoint);

      if (!Util.isNil(point.index)) {
        this.set(name + 'AnchorIndex', point.index);
      }
    }

    return point;
  } // 获取同端点进行连接的点，计算交汇点
  ;

  _proto._getPrePoint = function _getPrePoint(name, controlPoints) {
    if (controlPoints && controlPoints.length) {
      var index = name === 'source' ? 0 : controlPoints.length - 1;
      return controlPoints[index];
    }

    var oppositeName = name === 'source' ? 'target' : 'source'; // 取另一个节点的位置

    return this._getEndPoint(oppositeName);
  } // 通过端点的中心获取控制点
  ;

  _proto._getControlPointsByCenter = function _getControlPointsByCenter(model) {
    var sourcePoint = this._getEndPoint('source');

    var targetPoint = this._getEndPoint('target');

    var shapeFactory = this.get('shapeFactory');
    return shapeFactory.getControlPoints(model.shape, {
      startPoint: sourcePoint,
      endPoint: targetPoint
    });
  } // 获取端点的位置
  ;

  _proto._getEndPoint = function _getEndPoint(name) {
    var itemName = name + ITEM_NAME_SUFFIX;
    var pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    var item = this.get(itemName); // 如果有端点，直接使用 model

    if (item) {
      return item.get('model');
    } // 否则直接使用点


    return this.get(pointName);
  };

  _proto._getEndCenter = function _getEndCenter(name) {
    var itemName = name + ITEM_NAME_SUFFIX;
    var pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    var item = this.get(itemName); // 如果有端点，直接使用 model

    if (item) {
      var bbox = item.getBBox();
      return {
        x: bbox.centerX,
        y: bbox.centerY
      };
    } // 否则直接使用点


    return this.get(pointName);
  };

  _proto.getShapeCfg = function getShapeCfg(model) {
    var self = this;
    var linkCenter = self.get('linkCenter'); // 如果连接到中心，忽视锚点、忽视控制点

    var cfg = _Item.prototype.getShapeCfg.call(this, model);

    if (linkCenter) {
      cfg.startPoint = self._getEndCenter('source');
      cfg.endPoint = self._getEndCenter('target');
    } else {
      var controlPoints = cfg.controlPoints || self._getControlPointsByCenter(cfg);

      cfg.startPoint = self._getLinkPoint('source', model, controlPoints);
      cfg.endPoint = self._getLinkPoint('target', model, controlPoints);
    }

    cfg.sourceNode = self.get('sourceNode');
    cfg.targetNode = self.get('targetNode');
    return cfg;
  };

  _proto.getModel = function getModel() {
    var model = this.get('model');
    var out = Util.mix({}, model);
    var sourceItem = this.get('source' + ITEM_NAME_SUFFIX);
    var targetItem = this.get('target' + ITEM_NAME_SUFFIX);

    if (sourceItem) {
      out.source = sourceItem.get('id');
      delete out['source' + ITEM_NAME_SUFFIX];
    } else {
      out.source = this.get('start' + POINT_NAME_SUFFIX);
    }

    if (targetItem) {
      out.target = targetItem.get('id');
      delete out['target' + ITEM_NAME_SUFFIX];
    } else {
      out.target = this.get('end' + POINT_NAME_SUFFIX);
    }

    return out;
  };

  _proto.destroy = function destroy() {
    var sourceItem = this.get('source' + ITEM_NAME_SUFFIX);
    var targetItem = this.get('target' + ITEM_NAME_SUFFIX);
    sourceItem && !sourceItem.destroyed && sourceItem.removeEdge(this);
    targetItem && !targetItem.destroyed && targetItem.removeEdge(this);

    _Item.prototype.destroy.call(this);
  };

  return Edge;
}(Item);

module.exports = Edge;