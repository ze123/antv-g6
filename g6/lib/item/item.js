/**
 * @fileOverview item
 * @author huangtonger@aliyun.com
 */
var Util = require('../util/');

var Shape = require('../shape');

var Global = require('../global');

var CACHE_BBOX = 'bboxCache';
var GLOBAL_STATE_STYLE_SUFFIX = 'StateStyle';
var NAME_STYLE = 'Style'; // cache 缓存的状态属性的名字

var RESERVED_STYLES = ['fillStyle', 'strokeStyle', 'path', 'points', 'img', 'symbol'];

var Item =
/*#__PURE__*/
function () {
  function Item(cfg) {
    var defaultCfg = {
      /**
       * id
       * @type {string}
       */
      id: null,

      /**
       * 类型
       * @type {string}
       */
      type: 'item',

      /**
       * data model
       * @type {object}
       */
      model: {},

      /**
       * g group
       * @type {G.Group}
       */
      group: null,

      /**
       * is open animate
       * @type {boolean}
       */
      animate: false,

      /**
       * visible - not group visible
       * @type {boolean}
       */
      visible: true,

      /**
       * locked - lock node
       * @type {boolean}
       */
      locked: false,

      /**
       * capture event
       * @type {boolean}
       */
      event: true,

      /**
       * key shape to calculate item's bbox
       * @type object
       */
      keyShape: null,

      /**
       * item's states, such as selected or active
       * @type Array
       */
      states: []
    };
    this._cfg = Util.mix(defaultCfg, this.getDefaultCfg(), cfg);
    var group = cfg.group;
    group.set('item', this);
    var id = this.get('model').id;

    if (!id || id === '') {
      id = Util.uniqueId(this.get('type'));
    }

    this.set('id', id);
    group.set('id', id);
    this.init();
    this.draw();
  }
  /**
   * 是否是 Item 对象，悬空边情况下进行判定
   * @return {Boolean} 是否是 Item 对象
   */


  var _proto = Item.prototype;

  _proto.isItem = function isItem() {
    return true;
  }
  /**
   * 获取属性
   * @internal 仅内部类使用
   * @param  {String} key 属性名
   * @return {*} 属性值
   */
  ;

  _proto.get = function get(key) {
    return this._cfg[key];
  }
  /**
   * 设置属性
   * @internal 仅内部类使用
   * @param {String|Object} key 属性名，也可以是对象
   * @param {*} val 属性值
   */
  ;

  _proto.set = function set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key);
    } else {
      this._cfg[key] = val;
    }
  }
  /**
   * 获取默认的配置项
   * @protected 供子类复写
   * @return {Object} 配置项
   */
  ;

  _proto.getDefaultCfg = function getDefaultCfg() {
    return {};
  }
  /**
   * 初始化
   * @protected
   */
  ;

  _proto.init = function init() {
    var shapeFactory = Shape.getFactory(this.get('type'));
    this.set('shapeFactory', shapeFactory);
  } // 根据 keyshape 计算包围盒
  ;

  _proto._calculateBBox = function _calculateBBox() {
    var keyShape = this.get('keyShape');
    var group = this.get('group'); // 因为 group 可能会移动，所以必须通过父元素计算才能计算出正确的包围盒

    var bbox = Util.getBBox(keyShape, group);
    bbox.x = bbox.minX;
    bbox.y = bbox.minY;
    bbox.width = bbox.maxX - bbox.minX;
    bbox.height = bbox.maxY - bbox.minY;
    bbox.centerX = (bbox.minX + bbox.maxX) / 2;
    bbox.centerY = (bbox.minY + bbox.maxY) / 2;
    return bbox;
  } // 绘制
  ;

  _proto._drawInner = function _drawInner() {
    var self = this;
    var shapeFactory = self.get('shapeFactory');
    var group = self.get('group');
    var model = self.get('model');
    group.clear();

    if (!shapeFactory) {
      return;
    }

    self.updatePosition(model);
    var cfg = self.getShapeCfg(model); // 可能会附加额外信息

    var shapeType = cfg.shape;
    var keyShape = shapeFactory.draw(shapeType, cfg, group);

    if (keyShape) {
      keyShape.isKeyShape = true;
      self.set('keyShape', keyShape);
      self.set('originStyle', this.getKeyShapeStyle());
    } // 防止由于用户外部修改 model 中的 shape 导致 shape 不更新


    this.set('currentShape', shapeType);

    this._resetStates(shapeFactory, shapeType);
  };

  _proto.getKeyShapeStyle = function getKeyShapeStyle() {
    var keyShape = this.getKeyShape();

    if (keyShape) {
      var styles = {};
      Util.each(keyShape.attr(), function (val, key) {
        if (RESERVED_STYLES.indexOf(key) < 0) {
          styles[key] = val;
        }
      });
      return styles;
    }
  };

  _proto._resetStates = function _resetStates(shapeFactory, shapeType) {
    var self = this;
    var states = self.get('states');
    Util.each(states, function (state) {
      shapeFactory.setState(shapeType, state, true, self);
    });
  }
  /**
   * 获取当前元素的所有状态
   * @return {Array} 元素的所有状态
   */
  ;

  _proto.getStates = function getStates() {
    return this.get('states');
  }
  /**
   * 当前元素是否处于某状态
   * @param {String} state 状态名
   * @return {Boolean} 是否处于某状态
   */
  ;

  _proto.hasState = function hasState(state) {
    return this.get('states').indexOf(state) >= 0;
  };

  _proto.getStateStyle = function getStateStyle(state) {
    var self = this; // Global.nodeStateStyle

    var globalStyle = Global[self.getType() + GLOBAL_STATE_STYLE_SUFFIX][state];
    var styles = this.get('styles');
    var defaultStyle = styles && styles[state]; // 状态名 + style（activeStyle) 存储在 item 中，如果 item 中不存在这些信息，则使用默认的样式

    var fieldName = state + NAME_STYLE;
    return Util.mix({}, globalStyle, defaultStyle, self.get(fieldName));
  };

  _proto.getOriginStyle = function getOriginStyle() {
    return this.get('originStyle');
  };

  _proto.getCurrentStatesStyle = function getCurrentStatesStyle() {
    var self = this;
    var originStyle = Util.mix({}, self.getOriginStyle());
    Util.each(self.getStates(), function (state) {
      Util.mix(originStyle, self.getStateStyle(state));
    });
    return originStyle;
  }
  /**
   * 更改元素状态， visible 不属于这个范畴
   * @internal 仅提供内部类 graph 使用
   * @param {String} state 状态名
   * @param {Boolean} enable 节点状态值
   */
  ;

  _proto.setState = function setState(state, enable) {
    var states = this.get('states');
    var shapeFactory = this.get('shapeFactory');
    var index = states.indexOf(state);

    if (enable) {
      if (index > -1) {
        return;
      }

      states.push(state);
    } else if (index > -1) {
      states.splice(index, 1);
    }

    if (shapeFactory) {
      var model = this.get('model');
      shapeFactory.setState(model.shape, state, enable, this);
    }
  };

  _proto.clearStates = function clearStates(states) {
    var self = this;
    var originStates = self.getStates();
    var shapeFactory = self.get('shapeFactory');
    var shape = self.get('model').shape;

    if (!states) {
      self.set('states', []);
      shapeFactory.setState(shape, originStates[0], false, self);
      return;
    }

    if (Util.isString(states)) {
      states = [states];
    }

    var newStates = originStates.filter(function (state) {
      shapeFactory.setState(shape, state, false, self);

      if (states.indexOf(state) >= 0) {
        return false;
      }

      return true;
    });
    self.set('states', newStates);
  }
  /**
   * 节点的图形容器
   * @return {G.Group} 图形容器
   */
  ;

  _proto.getContainer = function getContainer() {
    return this.get('group');
  }
  /**
   * 节点的关键形状，用于计算节点大小，连线截距等
   * @return {G.Shape} 关键形状
   */
  ;

  _proto.getKeyShape = function getKeyShape() {
    return this.get('keyShape');
  }
  /**
   * 节点数据模型
   * @return {Object} 数据模型
   */
  ;

  _proto.getModel = function getModel() {
    return this.get('model');
  }
  /**
   * 节点类型
   * @return {string} 节点的类型
   */
  ;

  _proto.getType = function getType() {
    return this.get('type');
  }
  /**
   * 渲染前的逻辑，提供给子类复写
   * @protected
   */
  ;

  _proto.beforeDraw = function beforeDraw() {}
  /**
   * 渲染后的逻辑，提供给子类复写
   * @protected
   */
  ;

  _proto.afterDraw = function afterDraw() {};

  _proto.getShapeCfg = function getShapeCfg(model) {
    var styles = this.get('styles');

    if (styles && styles.default) {
      // merge graph的item样式与数据模型中的样式
      var newModel = Util.mix({}, model);
      newModel.style = Util.mix({}, styles.default, model.style);
      return newModel;
    }

    return model;
  }
  /**
   * 刷新一般用于处理几种情况
   * 1. item model 在外部被改变
   * 2. 边的节点位置发生改变，需要重新计算边
   *
   * 因为数据从外部被修改无法判断一些属性是否被修改，直接走位置和 shape 的更新
   */
  ;

  _proto.refresh = function refresh() {
    var model = this.get('model'); // 更新元素位置

    this.updatePosition(model); // 更新元素内容，样式

    this.updateShape(); // 做一些更新之后的操作

    this.afterUpdate(); // 清除缓存

    this.clearCache();
  }
  /**
   * 将更新应用到 model 上，刷新属性
   * @internal 仅提供给 Graph 使用，外部直接调用 graph.update 接口
   * @param  {Object} cfg       配置项，可以是增量信息
   */
  ;

  _proto.update = function update(cfg) {
    var model = this.get('model');
    var originPosition = {
      x: model.x,
      y: model.y
    }; // 直接将更新合到原数据模型上，可以保证用户在外部修改源数据然后刷新时的样式符合期待。

    Util.mix(model, cfg);

    var onlyMove = this._isOnlyMove(cfg); // 仅仅移动位置时，既不更新，也不重绘


    if (onlyMove) {
      this.updatePosition(model);
    } else {
      // 如果 x,y 有变化，先重置位置
      if (originPosition.x !== model.x || originPosition.y !== model.y) {
        this.updatePosition(model);
      }

      this.updateShape();
    }

    this.afterUpdate();
    this.clearCache();
  }
  /**
   * 更新元素内容，样式
   */
  ;

  _proto.updateShape = function updateShape() {
    var shapeFactory = this.get('shapeFactory');
    var model = this.get('model');
    var shape = model.shape; // 判定是否允许更新
    // 1. 注册的节点允许更新
    // 2. 更新后的 shape 等于原先的 shape

    if (shapeFactory.shouldUpdate(shape) && shape === this.get('currentShape')) {
      var updateCfg = this.getShapeCfg(model);
      shapeFactory.update(shape, updateCfg, this);
    } else {
      // 如果不满足上面两种状态，重新绘制
      this.draw();
    }

    this.set('originStyle', this.getKeyShapeStyle()); // 更新后重置节点状态

    this._resetStates(shapeFactory, shape);
  }
  /**
   * 更新位置，避免整体重绘
   * @param {object} cfg 待更新数据
   */
  ;

  _proto.updatePosition = function updatePosition(cfg) {
    var model = this.get('model');
    var x = Util.isNil(cfg.x) ? model.x : cfg.x;
    var y = Util.isNil(cfg.y) ? model.y : cfg.y;
    var group = this.get('group');

    if (Util.isNil(x) || Util.isNil(y)) {
      return;
    }

    group.resetMatrix();
    group.translate(x, y);
    model.x = x;
    model.y = y;
    this.clearCache(); // 位置更新后需要清除缓存
  }
  /**
   * 更新后做一些工作
   * @protected
   */
  ;

  _proto.afterUpdate = function afterUpdate() {}
  /**
   * 更新/刷新等操作后，清除 cache
   */
  ;

  _proto.clearCache = function clearCache() {
    this.set(CACHE_BBOX, null);
  }
  /**
   * 绘制元素
   */
  ;

  _proto.draw = function draw() {
    this.beforeDraw();

    this._drawInner();

    this.afterDraw();
  }
  /**
   * 获取元素的包围盒
   * @return {Object} 包含 x,y,width,height, centerX, centerY
   */
  ;

  _proto.getBBox = function getBBox() {
    var bbox = this.get(CACHE_BBOX);

    if (!bbox) {
      // 计算 bbox 开销有些大，缓存
      bbox = this._calculateBBox();
      this.set(CACHE_BBOX, bbox);
    }

    return bbox;
  }
  /**
   * 将元素放到最前面
   */
  ;

  _proto.toFront = function toFront() {
    this.get('group').toFront();
  }
  /**
   * 将元素放到最后面
   */
  ;

  _proto.toBack = function toBack() {
    this.get('group').toBack();
  }
  /**
   * 显示元素
   */
  ;

  _proto.show = function show() {
    this.changeVisibility(true);
  }
  /**
   * 隐藏元素
   */
  ;

  _proto.hide = function hide() {
    this.changeVisibility(false);
  }
  /**
   * 更改是否显示
   * @param  {Boolean} visible 是否显示
   */
  ;

  _proto.changeVisibility = function changeVisibility(visible) {
    var group = this.get('group');

    if (visible) {
      group.show();
    } else {
      group.hide();
    }

    this.set('visible', visible);
  }
  /**
   * 是否拾取及出发该元素的交互事件
   * @param {Boolean} enable 标识位
   */
  ;

  _proto.enableCapture = function enableCapture(enable) {
    var group = this.get('group');
    group && group.attr('capture', enable);
  };

  _proto.isVisible = function isVisible() {
    return this.get('visible');
  }
  /**
   * 析构函数
   */
  ;

  _proto.destroy = function destroy() {
    if (!this.destroyed) {
      var animate = this.get('animate');
      var group = this.get('group');

      if (animate) {
        group.stopAnimate();
      }

      group.remove();
      this._cfg = null;
      this.destroyed = true;
    }
  };

  return Item;
}();

module.exports = Item;