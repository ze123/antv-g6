function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/*
 * @Author: moyee
 * @Date: 2019-06-27 18:12:06
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-22 11:22:16
 * @Description: Graph
 */
var _require = require('lodash'),
    groupBy = _require.groupBy,
    isString = _require.isString;

var G = require('@antv/g/lib');

var EventEmitter = G.EventEmitter;

var Util = require('../util');

var Global = require('../global');

var Controller = require('./controller');

var NODE = 'node';
var EDGE = 'edge';

var Graph =
/*#__PURE__*/
function (_EventEmitter) {
  _inheritsLoose(Graph, _EventEmitter);

  var _proto = Graph.prototype;

  /**
   * Access to the default configuration properties
   * @return {object} default configuration
   */
  _proto.getDefaultCfg = function getDefaultCfg() {
    return {
      /**
       * Container could be dom object or dom id
       * @type {object|string|undefined}
       */
      container: undefined,

      /**
       * Canvas width
       * @type {number|undefined}
       * unit pixel if undefined force fit width
       */
      width: undefined,

      /**
       * Canvas height
       * @type {number|undefined}
       * unit pixel if undefined force fit height
       */
      height: undefined,

      /**
       * renderer canvas or svg
       * @type {string}
       */
      renderer: 'canvas',

      /**
       * control graph behaviors
       * @type Array
       */
      mode: [],

      /**
       * 注册插件
       */
      plugins: [],

      /**
       * source data
       * @type object
       */
      data: null,

      /**
       * Fit view padding (client scale)
       * @type {number|array}
       */
      fitViewPadding: 10,

      /**
       * Minimum scale size
       * @type {number}
       */
      minZoom: 0.2,

      /**
       * Maxmum scale size
       * @type {number}
       */
      maxZoom: 10,

      /**
       *  capture events
       *  @type boolean
       */
      event: true,

      /**
       * group node & edges into different graphic groups
       * @private
       * @type boolean
       */
      groupByTypes: true,

      /**
       * determine if it's a directed graph
       * @type boolean
       */
      directed: false,

      /**
       * when data or shape changed, should canvas draw automatically
       * @type boolean
       */
      autoPaint: true,

      /**
       * store all the node instances
       * @type [object]
       */
      nodes: [],

      /**
       * store all the edge instances
       * @type [object]
       */
      edges: [],

      /**
       * all the instances indexed by id
       * @type object
       */
      itemMap: {},

      /**
       * 边直接连接到节点的中心，不再考虑锚点
       * @type {Boolean}
       */
      linkCenter: false,

      /**
       * 默认的节点配置，data 上定义的配置会覆盖这些配置。例如：
       * defaultNode: {
       *  shape: 'rect',
       *  size: [60, 40],
       *  style: {
       *    //... 样式配置项
       *  }
       * }
       * 若数据项为 { id: 'node', x: 100, y: 100 }
       * 实际创建的节点模型是 { id: 'node', x: 100, y: 100， shape: 'rect', size: [60, 40] }
       * 若数据项为 { id: 'node', x: 100, y: 100, shape: 'circle' }
       * 实际创建的节点模型是 { id: 'node', x: 100, y: 100， shape: 'circle', size: [60, 40] }
       */
      defaultNode: {},

      /**
       * 默认边配置，data 上定义的配置会覆盖这些配置。用法同 defaultNode
       */
      defaultEdge: {},

      /**
       * 节点默认样式，也可以添加状态样式
       * 例如：
       * const graph = new G6.Graph({
       *  nodeStateStyle: {
       *    selected: { fill: '#ccc', stroke: '#666' },
       *    active: { lineWidth: 2 }
       *  },
       *  ...
       * });
       *
       */
      nodeStateStyles: {},

      /**
       * 边默认样式，用法同nodeStateStyle
       */
      edgeStateStyles: {},

      /**
       * graph 状态
       */
      states: {},

      /**
       * 是否启用全局动画
       * @type {Boolean}
       */
      animate: false,

      /**
       * 动画设置,仅在 animate 为 true 时有效
       * @type {Object}
       */
      animateCfg: {
        /**
         * 帧回调函数，用于自定义节点运动路径，为空时线性运动
         * @type {Function|null}
         */
        onFrame: null,

        /**
         * 动画时长(ms)
         * @type {Number}
         */
        duration: 500,

        /**
         * 指定动画动效
         * @type {String}
         */
        easing: 'easeLinear'
      },
      callback: null,

      /**
       * group类型
       */
      groupType: 'circle',

      /**
       * 各个group的BBox
      */
      groupBBoxs: {},

      /**
       * 每个group包含的节点，父层的包括自己的节点以及子Group的节点
      */
      groupNodes: {},

      /**
       * 群组的原始数据
      */
      groups: [],
      groupStyle: {}
    };
  };

  function Graph(inputCfg) {
    var _this;

    _this = _EventEmitter.call(this) || this;
    _this._cfg = Util.deepMix(_this.getDefaultCfg(), inputCfg); // merge graph configs

    _this._init();

    return _this;
  }

  _proto._init = function _init() {
    this._initCanvas();

    var eventController = new Controller.Event(this);
    var viewController = new Controller.View(this);
    var modeController = new Controller.Mode(this);
    var itemController = new Controller.Item(this);
    var stateController = new Controller.State(this);
    var layoutController = new Controller.Layout(this); // 实例化customGroup

    var customGroupControll = new Controller.CustomGroup(this);
    this.set({
      eventController: eventController,
      viewController: viewController,
      modeController: modeController,
      itemController: itemController,
      stateController: stateController,
      customGroupControll: customGroupControll,
      layoutController: layoutController
    });

    this._initPlugins();
  };

  _proto._initCanvas = function _initCanvas() {
    var container = this.get('container');

    if (Util.isString(container)) {
      container = document.getElementById(container);
      this.set('container', container);
    }

    if (!container) {
      throw Error('invalid container');
    }

    var canvas = new G.Canvas({
      containerDOM: container,
      width: this.get('width'),
      height: this.get('height'),
      renderer: this.get('renderer'),
      pixelRatio: this.get('pixelRatio')
    });
    this.set('canvas', canvas);

    this._initGroups();
  };

  _proto._initGroups = function _initGroups() {
    var canvas = this.get('canvas');
    var id = this.get('canvas').get('el').id;
    var group = canvas.addGroup({
      id: id + '-root',
      className: Global.rootContainerClassName
    });

    if (this.get('groupByTypes')) {
      var edgeGroup = group.addGroup({
        id: id + '-edge',
        className: Global.edgeContainerClassName
      });
      var nodeGroup = group.addGroup({
        id: id + '-node',
        className: Global.nodeContainerClassName
      });
      var delegateGroup = group.addGroup({
        id: id + '-delagate',
        className: Global.delegateContainerClassName
      }); // 用于存储自定义的群组

      var customGroup = group.addGroup({
        id: id + "-group",
        className: Global.customGroupContainerClassName
      });
      customGroup.toBack();
      this.set({
        nodeGroup: nodeGroup,
        edgeGroup: edgeGroup,
        customGroup: customGroup,
        delegateGroup: delegateGroup
      });
    }

    this.set('group', group);
  };

  _proto._initPlugins = function _initPlugins() {
    var self = this;
    Util.each(self.get('plugins'), function (plugin) {
      if (!plugin.destroyed && plugin.initPlugin) {
        plugin.initPlugin(self);
      }
    });
  };

  _proto.get = function get(key) {
    return this._cfg[key];
  };

  _proto.set = function set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key);
    } else {
      this._cfg[key] = val;
    }

    return this;
  }
  /**
   * 更新元素
   * @param {string|object} item 元素id或元素实例
   * @param {object} cfg 需要更新的数据
   */
  ;

  _proto.update = function update(item, cfg) {
    this.updateItem(item, cfg);
  }
  /**
   * 更新元素
   * @param {string|object} item 元素id或元素实例
   * @param {object} cfg 需要更新的数据
   */
  ;

  _proto.updateItem = function updateItem(item, cfg) {
    this.get('itemController').updateItem(item, cfg);
  }
  /**
   * 设置元素状态
   * @param {string|object} item 元素id或元素实例
   * @param {string} state 状态
   * @param {boolean} enabled 是否启用状态
   */
  ;

  _proto.setItemState = function setItemState(item, state, enabled) {
    if (Util.isString(item)) {
      item = this.findById(item);
    }

    this.get('itemController').setItemState(item, state, enabled);
    this.get('stateController').updateState(item, state, enabled);
  }
  /**
   * 清理元素多个状态
   * @param {string|object} item 元素id或元素实例
   * @param {Array|String|null} states 状态
   */
  ;

  _proto.clearItemStates = function clearItemStates(item, states) {
    if (Util.isString(item)) {
      item = this.findById(item);
    }

    this.get('itemController').clearItemStates(item, states);

    if (!states) {
      states = item.get('states');
    }

    this.get('stateController').updateStates(item, states, false);
  }
  /**
   * 新增元素
   * @param {string} type 元素类型(node | edge)
   * @param {object} model 元素数据模型
   * @return {object} 元素实例
   */
  ;

  _proto.add = function add(type, model) {
    return this.addItem(type, model);
  }
  /**
   * 新增元素 或 节点分组
   * @param {string} type 元素类型(node | edge | group)
   * @param {object} model 元素数据模型
   * @return {object} 元素实例
   */
  ;

  _proto.addItem = function addItem(type, model) {
    if (type === 'group') {
      var groupId = model.groupId,
          nodes = model.nodes,
          _type = model.type,
          zIndex = model.zIndex,
          title = model.title;
      var groupTitle = title;

      if (isString(title)) {
        groupTitle = {
          text: title
        };
      }

      return this.get('customGroupControll').create(groupId, nodes, _type, zIndex, true, groupTitle);
    }

    return this.get('itemController').addItem(type, model);
  }
  /**
   * 删除元素
   * @param {string|object} item 元素id或元素实例
   */
  ;

  _proto.remove = function remove(item) {
    this.removeItem(item);
  }
  /**
   * 删除元素
   * @param {string|object} item 元素id或元素实例
   */
  ;

  _proto.removeItem = function removeItem(item) {
    // 如果item是字符串，且查询的节点实例不存在，则认为是删除group
    var nodeItem = null;

    if (Util.isString(item)) {
      nodeItem = this.findById(item);
    }

    if (!nodeItem && Util.isString(item)) {
      this.get('customGroupControll').remove(item);
    } else {
      this.get('itemController').removeItem(item);
    }
  }
  /**
   * 设置视图初始化数据
   * @param {object} data 初始化数据
   */
  ;

  _proto.data = function data(_data) {
    this.set('data', _data);
  }
  /**
   * 设置各个节点样式，以及在各种状态下节点 keyShape 的样式。
   * 若是自定义节点切在各种状态下
   * graph.node(node => {
   *  return {
   *    {
          shape: 'rect',
          label: node.id,
          style: { fill: '#666' },
          stateStyles: {
            selected: { fill: 'blue' },
            custom: { fill: 'green' }
          }
        }
   *  }
   * });
   * @param {function} nodeFn 指定每个节点样式
   */
  ;

  _proto.node = function node(nodeFn) {
    if (typeof nodeFn === 'function') {
      this.set('nodeMapper', nodeFn);
    }
  }
  /**
   * 设置各个边样式
   * @param {function} edgeFn 指定每个边的样式,用法同 node
   */
  ;

  _proto.edge = function edge(edgeFn) {
    if (typeof edgeFn === 'function') {
      this.set('edgeMapper', edgeFn);
    }
  }
  /**
   * 刷新元素
   * @param {string|object} item 元素id或元素实例
   */
  ;

  _proto.refreshItem = function refreshItem(item) {
    this.get('itemController').refreshItem(item);
  }
  /**
   * 当源数据在外部发生变更时，根据新数据刷新视图。但是不刷新节点位置
   */
  ;

  _proto.refresh = function refresh() {
    var self = this;
    var autoPaint = self.get('autoPaint');
    self.setAutoPaint(false);
    self.emit('beforegraphrefresh');

    if (self.get('animate')) {
      self.positionsAnimate();
    } else {
      var nodes = self.get('nodes');
      var edges = self.get('edges');
      Util.each(nodes, function (node) {
        node.refresh();
      });
      Util.each(edges, function (edge) {
        edge.refresh();
      });
    }

    self.setAutoPaint(autoPaint);
    self.emit('aftergraphrefresh');
    self.autoPaint();
  }
  /**
   * 当节点位置在外部发生改变时，刷新所有节点位置，重计算边
   */
  ;

  _proto.refreshPositions = function refreshPositions() {
    var self = this;
    self.emit('beforegraphrefreshposition');
    var nodes = self.get('nodes');
    var edges = self.get('edges');
    var model;
    Util.each(nodes, function (node) {
      model = node.getModel();
      node.updatePosition(model);
    });
    Util.each(edges, function (edge) {
      edge.refresh();
    });
    self.emit('aftergraphrefreshposition');
    self.autoPaint();
  }
  /**
   * 根据data接口的数据渲染视图
   */
  ;

  _proto.render = function render() {
    var self = this;
    var data = this.get('data');

    if (!data) {
      throw new Error('data must be defined first');
    }

    this.clear();
    this.emit('beforerender');
    var autoPaint = this.get('autoPaint');
    this.setAutoPaint(false);
    Util.each(data.nodes, function (node) {
      self.add(NODE, node);
    });
    Util.each(data.edges, function (edge) {
      self.add(EDGE, edge);
    }); // 防止传入的数据不存在nodes

    if (data.nodes) {
      // 获取所有有groupID的node
      var nodeInGroup = data.nodes.filter(function (node) {
        return node.groupId;
      }); // 所有node中存在groupID，则说明需要群组

      if (nodeInGroup.length > 0) {
        // 渲染群组
        var groupType = self.get('groupType');
        this.renderCustomGroup(data, groupType);
      }
    }

    if (!this.get('groupByTypes')) {
      // 为提升性能，选择数量少的进行操作
      if (data.nodes.length < data.edges.length) {
        var nodes = this.getNodes(); // 遍历节点实例，将所有节点提前。

        nodes.forEach(function (node) {
          node.toFront();
        });
      } else {
        var edges = this.getEdges(); // 遍历节点实例，将所有节点提前。

        edges.forEach(function (edge) {
          edge.toBack();
        });
      }
    } // layout


    var layoutController = self.get('layoutController');

    if (!layoutController.layout(success)) {
      success();
    }

    function success() {
      if (self.get('fitView')) {
        self.get('viewController')._fitView();
      }

      self.paint();
      self.setAutoPaint(autoPaint);
      self.emit('afterrender');
    }
  }
  /**
   * 根据数据渲染群组
   * @param {object} data 渲染图的数据
   * @param {string} groupType group类型
   */
  ;

  _proto.renderCustomGroup = function renderCustomGroup(data, groupType) {
    var _this2 = this;

    var groups = data.groups,
        nodes = data.nodes; // 第一种情况，，不存在groups，则不存在嵌套群组

    var groupIndex = 10;

    if (!groups) {
      // 存在单个群组
      // 获取所有有groupID的node
      var nodeInGroup = nodes.filter(function (node) {
        return node.groupId;
      });
      var groupsArr = []; // 根据groupID分组

      var groupIds = groupBy(nodeInGroup, 'groupId');

      var _loop = function _loop(groupId) {
        var nodeIds = groupIds[groupId].map(function (node) {
          return node.id;
        });

        _this2.get('customGroupControll').create(groupId, nodeIds, groupType, groupIndex);

        groupIndex--; // 获取所有不重复的 groupId

        if (!groupsArr.find(function (data) {
          return data.id === groupId;
        })) {
          groupsArr.push({
            id: groupId
          });
        }
      };

      for (var groupId in groupIds) {
        _loop(groupId);
      }

      this.set({
        groups: groupsArr
      });
    } else {
      // 将groups的数据存到groups中
      this.set({
        groups: groups
      }); // 第二种情况，存在嵌套的群组，数据中有groups字段

      var groupNodes = Util.getAllNodeInGroups(data);

      for (var _groupId in groupNodes) {
        var tmpNodes = groupNodes[_groupId];
        this.get('customGroupControll').create(_groupId, tmpNodes, groupType, groupIndex);
        groupIndex--;
      } // 对所有Group排序


      var customGroup = this.get('customGroup');
      customGroup.sort();
    }
  }
  /**
   * 接收数据进行渲染
   * @Param {Object} data 初始化数据
   */
  ;

  _proto.read = function read(data) {
    this.data(data);
    this.render();
  }
  /**
   * 更改源数据，根据新数据重新渲染视图
   * @param {object} data 源数据
   * @return {object} this
   */
  ;

  _proto.changeData = function changeData(data) {
    var self = this;

    if (!data) {
      return this;
    }

    if (!self.get('data')) {
      self.data(data);
      self.render();
    }

    var autoPaint = this.get('autoPaint');
    var itemMap = this.get('itemMap');
    var items = {
      nodes: [],
      edges: []
    };
    this.setAutoPaint(false);

    this._diffItems(NODE, items, data.nodes);

    this._diffItems(EDGE, items, data.edges);

    Util.each(itemMap, function (item, id) {
      if (items.nodes.indexOf(item) < 0 && items.edges.indexOf(item) < 0) {
        delete itemMap[id];
        self.remove(item);
      }
    });
    this.set({
      nodes: items.nodes,
      edges: items.edges
    });
    var layoutController = this.get('layoutController');
    layoutController.changeData();
    this.setAutoPaint(autoPaint);
    return this;
  };

  _proto._diffItems = function _diffItems(type, items, models) {
    var self = this;
    var item;
    var itemMap = this.get('itemMap');
    Util.each(models, function (model) {
      item = itemMap[model.id];

      if (item) {
        if (self.get('animate') && type === NODE) {
          var containerMatrix = item.getContainer().getMatrix();
          item.set('originAttrs', {
            x: containerMatrix[6],
            y: containerMatrix[7]
          });
        }

        self.updateItem(item, model);
      } else {
        item = self.addItem(type, model);
      }

      items[type + 's'].push(item);
    });
  }
  /**
   * 仅画布重新绘制
   */
  ;

  _proto.paint = function paint() {
    this.emit('beforepaint');
    this.get('canvas').draw();
    this.emit('afterpaint');
  }
  /**
   * 自动重绘
   * @internal 仅供内部更新机制调用，外部根据需求调用 render 或 paint 接口
   */
  ;

  _proto.autoPaint = function autoPaint() {
    if (this.get('autoPaint')) {
      this.paint();
    }
  }
  /**
   * 导出图数据
   * @return {object} data
   */
  ;

  _proto.save = function save() {
    var nodes = [];
    var edges = [];
    Util.each(this.get('nodes'), function (node) {
      nodes.push(node.getModel());
    });
    Util.each(this.get('edges'), function (edge) {
      edges.push(edge.getModel());
    });
    return {
      nodes: nodes,
      edges: edges,
      groups: this.get('groups')
    };
  }
  /**
   * 改变画布大小
   * @param  {number} width  画布宽度
   * @param  {number} height 画布高度
   * @return {object} this
   */
  ;

  _proto.changeSize = function changeSize(width, height) {
    this.get('viewController').changeSize(width, height);
    this.autoPaint();
    return this;
  }
  /**
   * 平移画布
   * @param {number} dx 水平方向位移
   * @param {number} dy 垂直方向位移
   */
  ;

  _proto.translate = function translate(dx, dy) {
    var group = this.get('group');
    group.translate(dx, dy);
    this.emit('viewportchange', {
      action: 'translate',
      matrix: group.getMatrix()
    });
    this.autoPaint();
  }
  /**
   * 平移画布到某点
   * @param {number} x 水平坐标
   * @param {number} y 垂直坐标
   */
  ;

  _proto.moveTo = function moveTo(x, y) {
    var group = this.get('group');
    group.move(x, y);
    this.emit('viewportchange', {
      action: 'move',
      matrix: group.getMatrix()
    });
    this.autoPaint();
  }
  /**
   * 调整视口适应视图
   * @param {object} padding 四周围边距
   */
  ;

  _proto.fitView = function fitView(padding) {
    if (padding) {
      this.set('fitViewPadding', padding);
    }

    this.get('viewController')._fitView();

    this.paint();
  }
  /**
   * 新增行为
   * @param {string|array} behaviors 添加的行为
   * @param {string|array} modes 添加到对应的模式
   * @return {object} this
   */
  ;

  _proto.addBehaviors = function addBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, true);
    return this;
  }
  /**
   * 移除行为
   * @param {string|array} behaviors 移除的行为
   * @param {string|array} modes 从指定的模式中移除
   * @return {object} this
   */
  ;

  _proto.removeBehaviors = function removeBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, false);
    return this;
  }
  /**
   * 切换行为模式
   * @param {string} mode 指定模式
   * @return {object} this
   */
  ;

  _proto.setMode = function setMode(mode) {
    this.set('mode', mode);
    this.get('modeController').setMode(mode);
    return this;
  }
  /**
   * 获取当前的行为模式
   * @return {string} 当前行为模式
   */
  ;

  _proto.getCurrentMode = function getCurrentMode() {
    return this.get('mode');
  }
  /**
   * 获取当前视口伸缩比例
   * @return {number} 比例
   */
  ;

  _proto.getZoom = function getZoom() {
    return this.get('group').getMatrix()[0];
  }
  /**
   * 获取当前图中所有节点的item实例
   * @return {array} item数组
   */
  ;

  _proto.getNodes = function getNodes() {
    return this.get('nodes');
  }
  /**
   * 获取当前图中所有边的item实例
   * @return {array} item数组
   */
  ;

  _proto.getEdges = function getEdges() {
    return this.get('edges');
  }
  /**
   * 伸缩视口
   * @param {number} ratio 伸缩比例
   * @param {object} center 以center的x, y坐标为中心缩放
   */
  ;

  _proto.zoom = function zoom(ratio, center) {
    var matrix = Util.clone(this.get('group').getMatrix());
    var minZoom = this.get('minZoom');
    var maxZoom = this.get('maxZoom');

    if (center) {
      Util.mat3.translate(matrix, matrix, [-center.x, -center.y]);
      Util.mat3.scale(matrix, matrix, [ratio, ratio]);
      Util.mat3.translate(matrix, matrix, [center.x, center.y]);
    } else {
      Util.mat3.scale(matrix, matrix, [ratio, ratio]);
    }

    if (minZoom && matrix[0] < minZoom) {
      return;
    }

    if (maxZoom && matrix[0] > maxZoom) {
      return;
    }

    this.get('group').setMatrix(matrix);
    this.emit('viewportchange', {
      action: 'zoom',
      matrix: matrix
    });
    this.autoPaint();
  }
  /**
   * 伸缩视口到一固定比例
   * @param {number} toRatio 伸缩比例
   * @param {object} center 以center的x, y坐标为中心缩放
   */
  ;

  _proto.zoomTo = function zoomTo(toRatio, center) {
    var ratio = toRatio / this.getZoom();
    this.zoom(ratio, center);
  }
  /**
   * 根据 graph 上的 animateCfg 进行视图中节点位置动画接口
   */
  ;

  _proto.positionsAnimate = function positionsAnimate() {
    var self = this;
    self.emit('beforeanimate');
    var animateCfg = self.get('animateCfg');
    var _onFrame = animateCfg.onFrame;
    var nodes = self.getNodes();
    var toNodes = nodes.map(function (node) {
      var model = node.getModel();
      return {
        id: model.id,
        x: model.x,
        y: model.y
      };
    });

    if (self.isAnimating()) {
      self.stopAnimate();
    }

    self.get('canvas').animate({
      onFrame: function onFrame(ratio) {
        Util.each(toNodes, function (data) {
          var node = self.findById(data.id);

          if (!node || node.destroyed) {
            return;
          }

          var originAttrs = node.get('originAttrs');
          var model = node.get('model');

          if (!originAttrs) {
            var containerMatrix = node.getContainer().getMatrix();
            originAttrs = {
              x: containerMatrix[6],
              y: containerMatrix[7]
            };
            node.set('originAttrs', originAttrs);
          }

          if (_onFrame) {
            var attrs = _onFrame(node, ratio, data, originAttrs);

            node.set('model', Util.mix(model, attrs));
          } else {
            model.x = originAttrs.x + (data.x - originAttrs.x) * ratio;
            model.y = originAttrs.y + (data.y - originAttrs.y) * ratio;
          }
        });
        self.refreshPositions();
      }
    }, animateCfg.duration, animateCfg.easing, function () {
      Util.each(nodes, function (node) {
        node.set('originAttrs', null);
      });

      if (animateCfg.callback) {
        animateCfg.callback();
      }

      self.emit('afteranimate');
      self.animating = false;
    });
  };

  _proto.stopAnimate = function stopAnimate() {
    this.get('canvas').stopAnimate();
  };

  _proto.isAnimating = function isAnimating() {
    return this.animating;
  }
  /**
   * 将元素移动到视口中心
   * @param {string|object} item 指定元素
   */
  ;

  _proto.focusItem = function focusItem(item) {
    this.get('viewController').focus(item);
    this.autoPaint();
  }
  /**
   * 将屏幕坐标转换为视口坐标
   * @param {number} clientX 屏幕x坐标
   * @param {number} clientY 屏幕y坐标
   * @return {object} 视口坐标
   */
  ;

  _proto.getPointByClient = function getPointByClient(clientX, clientY) {
    return this.get('viewController').getPointByClient(clientX, clientY);
  }
  /**
   * 将视口坐标转换为屏幕坐标
   * @param {number} x 视口x坐标
   * @param {number} y 视口y坐标
   * @return {object} 视口坐标
   */
  ;

  _proto.getClientByPoint = function getClientByPoint(x, y) {
    return this.get('viewController').getClientByPoint(x, y);
  }
  /**
   * 将画布坐标转换为视口坐标
   * @param {number} canvasX 屏幕x坐标
   * @param {number} canvasY 屏幕y坐标
   * @return {object} 视口坐标
   */
  ;

  _proto.getPointByCanvas = function getPointByCanvas(canvasX, canvasY) {
    return this.get('viewController').getPointByCanvas(canvasX, canvasY);
  }
  /**
   * 将视口坐标转换为画布坐标
   * @param {number} x 屏幕x坐标
   * @param {number} y 屏幕y坐标
   * @return {object} 画布坐标
   */
  ;

  _proto.getCanvasByPoint = function getCanvasByPoint(x, y) {
    return this.get('viewController').getCanvasByPoint(x, y);
  }
  /**
   * 显示元素
   * @param {string|object} item 指定元素
   */
  ;

  _proto.showItem = function showItem(item) {
    this.get('itemController').changeItemVisibility(item, true);
  }
  /**
   * 隐藏元素
   * @param {string|object} item 指定元素
   */
  ;

  _proto.hideItem = function hideItem(item) {
    this.get('itemController').changeItemVisibility(item, false);
  }
  /**
   * 查找对应id的元素
   * @param {string} id 元素id
   * @return {object} 元素实例
   */
  ;

  _proto.findById = function findById(id) {
    return this.get('itemMap')[id];
  }
  /**
   * 根据对应规则查找单个元素
   * @param {string} type 元素类型(node|edge)
   * @param {string} fn 指定规则
   * @return {object} 元素实例
   */
  ;

  _proto.find = function find(type, fn) {
    var result;
    var items = this.get(type + 's');
    Util.each(items, function (item, i) {
      if (fn(item, i)) {
        result = item;
        return false;
      }
    });
    return result;
  }
  /**
   * 查找所有满足规则的元素
   * @param {string} type 元素类型(node|edge)
   * @param {string} fn 指定规则
   * @return {array} 元素实例
   */
  ;

  _proto.findAll = function findAll(type, fn) {
    var result = [];
    Util.each(this.get(type + 's'), function (item, i) {
      if (fn(item, i)) {
        result.push(item);
      }
    });
    return result;
  }
  /**
   * 查找所有处于指定状态的元素
   * @param {string} type 元素类型(node|edge)
   * @param {string} state z状态
   * @return {object} 元素实例
   */
  ;

  _proto.findAllByState = function findAllByState(type, state) {
    return this.findAll(type, function (item) {
      return item.hasState(state);
    });
  }
  /**
   * 设置是否在更新/刷新后自动重绘
   * @param {boolean} auto 自动重绘
   */
  ;

  _proto.setAutoPaint = function setAutoPaint(auto) {
    this.set('autoPaint', auto);
  }
  /**
   * 返回图表的 dataUrl 用于生成图片
   * @return {string/Object} 图片 dataURL
   */
  ;

  _proto.toDataURL = function toDataURL() {
    var canvas = this.get('canvas');
    var renderer = canvas.getRenderer();
    var canvasDom = canvas.get('el');
    var dataURL = '';

    if (renderer === 'svg') {
      var clone = canvasDom.cloneNode(true);
      var svgDocType = document.implementation.createDocumentType('svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd');
      var svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', svgDocType);
      svgDoc.replaceChild(clone, svgDoc.documentElement);
      var svgData = new XMLSerializer().serializeToString(svgDoc);
      dataURL = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgData);
    } else if (renderer === 'canvas') {
      dataURL = canvasDom.toDataURL('image/png');
    }

    return dataURL;
  }
  /**
   * 画布导出图片
   * @param {String} name 图片的名称
   */
  ;

  _proto.downloadImage = function downloadImage(name) {
    var self = this;

    if (self.isAnimating()) {
      self.stopAnimate();
    }

    var canvas = self.get('canvas');
    var renderer = canvas.getRenderer();
    var fileName = (name || 'graph') + (renderer === 'svg' ? '.svg' : '.png');
    var link = document.createElement('a');
    setTimeout(function () {
      var dataURL = self.toDataURL();

      if (typeof window !== 'undefined') {
        if (window.Blob && window.URL && renderer !== 'svg') {
          var arr = dataURL.split(',');
          var mime = arr[0].match(/:(.*?);/)[1];
          var bstr = atob(arr[1]);
          var n = bstr.length;
          var u8arr = new Uint8Array(n);

          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }

          var blobObj = new Blob([u8arr], {
            type: mime
          });

          if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blobObj, fileName);
          } else {
            link.addEventListener('click', function () {
              link.download = fileName;
              link.href = window.URL.createObjectURL(blobObj);
            });
          }
        } else {
          link.addEventListener('click', function () {
            link.download = fileName;
            link.href = dataURL;
          });
        }
      }

      var e = document.createEvent('MouseEvents');
      e.initEvent('click', false, false);
      link.dispatchEvent(e);
    }, 16);
  }
  /**
   * 添加插件
   * @param {object} plugin 插件实例
   */
  ;

  _proto.addPlugin = function addPlugin(plugin) {
    var self = this;

    if (plugin.destroyed) {
      return;
    }

    self.get('plugins').push(plugin);
    plugin.initPlugin(self);
  }
  /**
   * 添加插件
   * @param {object} plugin 插件实例
   */
  ;

  _proto.removePlugin = function removePlugin(plugin) {
    var plugins = this.get('plugins');
    var index = plugins.indexOf(plugin);

    if (index >= 0) {
      plugin.destroyPlugin();
      plugins.splice(index, 1);
    }
  }
  /**
   * 更换布局配置项
   * @param {object} cfg 新布局配置项
   * 若 cfg 含有 type 字段或为 String 类型，且与现有布局方法不同，则更换布局
   * 若 cfg 不包括 type ，则保持原有布局方法，仅更新布局配置项
   */
  ;

  _proto.updateLayout = function updateLayout(cfg) {
    var layoutController = this.get('layoutController');
    var newLayoutType;

    if (Util.isString(cfg)) {
      newLayoutType = cfg;
      cfg = {
        type: newLayoutType
      };
    } else {
      newLayoutType = cfg.type;
    }

    var oriLayoutCfg = this.get('layout');
    var oriLayoutType = oriLayoutCfg ? oriLayoutCfg.type : undefined;

    if (!newLayoutType || oriLayoutType === newLayoutType) {
      // no type or same type, update layout
      var layoutCfg = {};
      Util.mix(layoutCfg, oriLayoutCfg, cfg);
      layoutCfg.type = oriLayoutType ? oriLayoutType : 'random';
      this.set('layout', layoutCfg);
      layoutController.updateLayoutCfg(layoutCfg);
    } else {
      // has different type, change layout
      this.set('layout', cfg);
      layoutController.changeLayout(newLayoutType);
    }
  }
  /**
   * 重新以当前示例中配置的属性进行一次布局
   */
  ;

  _proto.layout = function layout() {
    var layoutController = this.get('layoutController');
    var layoutCfg = this.get('layout');

    if (layoutCfg.workerEnabled) {
      // 如果使用web worker布局
      layoutController.layout();
      return;
    }

    if (layoutController.layoutMethod) {
      layoutController.relayout();
    } else {
      layoutController.layout();
    }
  }
  /**
   * 清除画布元素
   * @return {object} this
   */
  ;

  _proto.clear = function clear() {
    var canvas = this.get('canvas');
    canvas.clear();

    this._initGroups(); // 清空画布时同时清除数据


    this.set({
      itemMap: {},
      nodes: [],
      edges: [],
      groups: []
    });
    return this;
  }
  /**
   * 销毁画布
   */
  ;

  _proto.destroy = function destroy() {
    this.clear();
    Util.each(this.get('plugins'), function (plugin) {
      plugin.destroyPlugin();
    });
    this.get('eventController').destroy();
    this.get('itemController').destroy();
    this.get('modeController').destroy();
    this.get('viewController').destroy();
    this.get('stateController').destroy();
    this.get('layoutController').destroy();
    this.get('customGroupControll').destroy();
    this.get('canvas').destroy();
    this._cfg = null;
    this.destroyed = true;
  } // group 相关方法

  /**
   * 收起分组
   * @param {string} groupId 分组ID
   */
  ;

  _proto.collapseGroup = function collapseGroup(groupId) {
    this.get('customGroupControll').collapseGroup(groupId);
  }
  /**
   * 展开分组
   * @param {string} groupId 分组ID
   */
  ;

  _proto.expandGroup = function expandGroup(groupId) {
    this.get('customGroupControll').expandGroup(groupId);
  };

  return Graph;
}(EventEmitter);

module.exports = Graph;