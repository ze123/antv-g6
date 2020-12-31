function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/*
 * @Author: moyee
 * @Date: 2019-06-27 18:12:06
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-23 13:54:53
 * @Description: 有group的情况下，拖动节点的Behavior
 */
var deepMix = require('@antv/util/lib/deep-mix');

var _require = require('../global'),
    delegateStyle = _require.delegateStyle;

var body = document.body;
module.exports = {
  getDefaultCfg: function getDefaultCfg() {
    return {
      updateEdge: true,
      delegate: true,
      delegateStyle: {},
      maxMultiple: 1.1,
      minMultiple: 1
    };
  },
  getEvents: function getEvents() {
    return {
      'node:dragstart': 'onDragStart',
      'node:drag': 'onDrag',
      'node:dragend': 'onDragEnd',
      'canvas:mouseleave': 'onOutOfRange',
      mouseenter: 'onMouseEnter',
      mouseleave: 'onMouseLeave'
    };
  },
  onMouseEnter: function onMouseEnter(evt) {
    var target = evt.target;
    var groupId = target.get('groupId');

    if (groupId && this.origin) {
      var graph = this.graph;
      var customGroupControll = graph.get('customGroupControll');
      var customGroup = customGroupControll.getDeletageGroupById(groupId);

      if (customGroup) {
        var currentGroup = customGroup.nodeGroup;
        var keyShape = currentGroup.get('keyShape');
        this.inGroupId = groupId;
        customGroupControll.setGroupStyle(keyShape, 'hover');
      }
    }
  },

  /**
   * 拖动节点移除Group时的事件
   * @param {Event} evt 事件句柄
   */
  onMouseLeave: function onMouseLeave(evt) {
    var target = evt.target;
    var groupId = target.get('groupId');

    if (groupId && this.origin) {
      var graph = this.graph;
      var customGroupControll = graph.get('customGroupControll');
      var customGroup = customGroupControll.getDeletageGroupById(groupId);

      if (customGroup) {
        var currentGroup = customGroup.nodeGroup;
        var keyShape = currentGroup.get('keyShape');
        customGroupControll.setGroupStyle(keyShape, 'default');
      }
    }

    if (!groupId) {
      this.inGroupId = null;
    }
  },
  onDragStart: function onDragStart(e) {
    var _this = this;

    if (!this.shouldBegin.call(this, e)) {
      return;
    }

    var item = e.item;
    var graph = this.graph;
    this.targets = []; // 获取所有选中的元素

    var nodes = graph.findAllByState('node', 'selected');
    var currentNodeId = item.get('id'); // 当前拖动的节点是否是选中的节点

    var dragNodes = nodes.filter(function (node) {
      var nodeId = node.get('id');
      return currentNodeId === nodeId;
    }); // 只拖动当前节点

    if (dragNodes.length === 0) {
      this.target = item; // 拖动节点时，如果在Group中，则Group高亮

      var model = item.getModel();
      var groupId = model.groupId;

      if (groupId) {
        var customGroupControll = graph.get('customGroupControll');
        var customGroup = customGroupControll.getDeletageGroupById(groupId);

        if (customGroup) {
          var currentGroup = customGroup.nodeGroup;
          var keyShape = currentGroup.get('keyShape');
          customGroupControll.setGroupStyle(keyShape, 'hover'); // 初始拖动时候，如果是在当前群组中拖动，则赋值为当前groupId

          this.inGroupId = groupId;
        }
      }
    } else {
      // 拖动多个节点
      if (nodes.length > 1) {
        nodes.forEach(function (node) {
          _this.targets.push(node);
        });
      } else {
        this.targets.push(item);
      }
    }

    this.origin = {
      x: e.x,
      y: e.y
    };
    this.point = {};
    this.originPoint = {};
  },
  onDrag: function onDrag(e) {
    if (!this.origin) {
      return;
    }

    if (!this.get('shouldUpdate').call(this, e)) {
      return;
    } // 当targets中元素时，则说明拖动的是多个选中的元素


    if (this.targets.length > 0) {
      this._updateDelegate(e);
    } else {
      // 只拖动单个元素
      this._update(this.target, e, true);

      var item = e.item;
      var graph = this.graph;
      var model = item.getModel();
      var groupId = model.groupId;

      if (groupId) {
        var customGroupControll = graph.get('customGroupControll');
        var customGroup = customGroupControll.getDeletageGroupById(groupId);

        if (customGroup) {
          var currentGroup = customGroup.nodeGroup;
          var keyShape = currentGroup.get('keyShape'); // 当前

          if (this.inGroupId !== groupId) {
            customGroupControll.setGroupStyle(keyShape, 'default');
          } else {
            customGroupControll.setGroupStyle(keyShape, 'hover');
          }
        }
      }
    }
  },
  onDragEnd: function onDragEnd(e) {
    var _this2 = this;

    if (!this.origin || !this.shouldEnd.call(this, e)) {
      return;
    }

    if (this.shape) {
      this.shape.remove();
      this.shape = null;
    }

    if (this.target) {
      var delegateShape = this.target.get('delegateShape');

      if (delegateShape) {
        delegateShape.remove();
        this.target.set('delegateShape', null);
      }
    }

    if (this.targets.length > 0) {
      // 获取所有已经选中的节点
      this.targets.forEach(function (node) {
        return _this2._update(node, e);
      });
    } else if (this.target) {
      this._update(this.target, e);
    }

    this.point = {};
    this.origin = null;
    this.originPoint = {};
    this.targets.length = 0;
    this.target = null; // 终止时需要判断此时是否在监听画布外的 mouseup 事件，若有则解绑

    var fn = this.fn;

    if (fn) {
      body.removeEventListener('mouseup', fn, false);
      this.fn = null;
    }

    this.setCurrentGroupStyle(e);
  },
  setCurrentGroupStyle: function setCurrentGroupStyle(evt) {
    var item = evt.item;
    var graph = this.graph;
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);
    var model = item.getModel(); // 节点所在的GroupId

    var groupId = model.groupId,
        id = model.id;
    var customGroupControll = graph.get('customGroupControll');
    var customGroup = customGroupControll.customGroup;
    var groupNodes = graph.get('groupNodes');

    if (this.inGroupId && groupId) {
      var currentGroup = customGroup[groupId].nodeGroup;
      var keyShape = currentGroup.get('keyShape');
      var itemBBox = item.getBBox();
      var currentGroupBBox = keyShape.getBBox();
      var x = itemBBox.x,
          y = itemBBox.y;
      var minX = currentGroupBBox.minX,
          minY = currentGroupBBox.minY,
          maxX = currentGroupBBox.maxX,
          maxY = currentGroupBBox.maxY; // 在自己的group中拖动，判断是否拖出了自己的group
      // this.inGroupId !== groupId，则说明拖出了原来的group，拖到了其他group上面，
      // 则删除item中的groupId字段，同时删除group中的nodeID

      if (!(x < maxX * this.maxMultiple && x > minX * this.minMultiple && y < maxY * this.maxMultiple && y > minY * this.minMultiple) || this.inGroupId !== groupId) {
        // 拖出了group，则删除item中的groupId字段，同时删除group中的nodeID
        var currentGroupNodes = groupNodes[groupId];
        groupNodes[groupId] = currentGroupNodes.filter(function (node) {
          return node !== id;
        });
        customGroupControll.dynamicChangeGroupSize(evt, currentGroup, keyShape); // 同时删除groupID中的节点

        delete model.groupId;
      } // 拖动到其他的group上面


      if (this.inGroupId !== groupId) {
        // 拖动新的group后，更新groupNodes及model中的groupId
        var nodeInGroup = customGroup[this.inGroupId].nodeGroup;
        var targetKeyShape = nodeInGroup.get('keyShape'); // 将该节点添加到inGroupId中

        if (groupNodes[this.inGroupId].indexOf(id) === -1) {
          groupNodes[this.inGroupId].push(id);
        } // 更新节点的groupId为拖动上去的group Id


        model.groupId = this.inGroupId; // 拖入节点后，根据最新的节点数量，重新计算群组大小

        customGroupControll.dynamicChangeGroupSize(evt, nodeInGroup, targetKeyShape);
      }

      customGroupControll.setGroupStyle(keyShape, 'default');
    } else if (this.inGroupId && !groupId) {
      // 将节点拖动到群组中
      var _nodeInGroup = customGroup[this.inGroupId].nodeGroup;

      var _keyShape = _nodeInGroup.get('keyShape'); // 将该节点添加到inGroupId中


      if (groupNodes[this.inGroupId].indexOf(id) === -1) {
        groupNodes[this.inGroupId].push(id);
      } // 更新节点的groupId为拖动上去的group Id


      model.groupId = this.inGroupId; // 拖入节点后，根据最新的节点数量，重新计算群组大小

      customGroupControll.dynamicChangeGroupSize(evt, _nodeInGroup, _keyShape);
    } else if (!this.inGroupId && groupId) {
      // 拖出到群组之外了，则删除数据中的groupId
      for (var gnode in groupNodes) {
        var _currentGroupNodes = groupNodes[gnode];
        groupNodes[gnode] = _currentGroupNodes.filter(function (node) {
          return node !== id;
        });
      }

      var _currentGroup = customGroup[groupId].nodeGroup;

      var _keyShape2 = _currentGroup.get('keyShape');

      customGroupControll.dynamicChangeGroupSize(evt, _currentGroup, _keyShape2);
      delete model.groupId;
    }

    this.inGroupId = null;
    graph.paint();
    graph.setAutoPaint(autoPaint);
  },
  // 若在拖拽时，鼠标移出画布区域，此时放开鼠标无法终止 drag 行为。在画布外监听 mouseup 事件，放开则终止
  onOutOfRange: function onOutOfRange(e) {
    var self = this;

    if (this.origin) {
      var canvasElement = self.graph.get('canvas').get('el');

      var fn = function fn(ev) {
        if (ev.target !== canvasElement) {
          self.onDragEnd(e);
        }
      };

      this.fn = fn;
      body.addEventListener('mouseup', fn, false);
    }
  },
  _update: function _update(item, e, force) {
    var origin = this.origin;
    var model = item.get('model');
    var nodeId = item.get('id');

    if (!this.point[nodeId]) {
      this.point[nodeId] = {
        x: model.x,
        y: model.y
      };
    }

    var x = e.x - origin.x + this.point[nodeId].x;
    var y = e.y - origin.y + this.point[nodeId].y; // 拖动单个未选中元素

    if (force) {
      this._updateDelegate(e, x, y);

      return;
    }

    var pos = {
      x: x,
      y: y
    };

    if (this.get('updateEdge')) {
      this.graph.updateItem(item, pos);
    } else {
      item.updatePosition(pos);
      this.graph.paint();
    }
  },

  /**
   * 更新拖动元素时的delegate
   * @param {Event} e 事件句柄
   * @param {number} x 拖动单个元素时候的x坐标
   * @param {number} y 拖动单个元素时候的y坐标
   */
  _updateDelegate: function _updateDelegate(e, x, y) {
    var item = e.item;
    var graph = this.graph;
    var groupType = graph.get('groupType');
    var bbox = item.get('keyShape').getBBox();

    if (!this.shape) {
      var parent = graph.get('group');
      var attrs = deepMix({}, delegateStyle, this.delegateStyle); // 拖动多个

      if (this.targets.length > 0) {
        var nodes = graph.findAllByState('node', 'selected');

        if (nodes.length === 0) {
          nodes.push(item);
        }

        var customGroupControll = graph.get('customGroupControll');

        var _customGroupControll$ = customGroupControll.calculationGroupPosition(nodes),
            _x = _customGroupControll$.x,
            _y = _customGroupControll$.y,
            width = _customGroupControll$.width,
            height = _customGroupControll$.height;

        this.originPoint = {
          x: _x,
          y: _y,
          width: width,
          height: height
        }; // model上的x, y是相对于图形中心的，delegateShape是g实例，x,y是绝对坐标

        this.shape = parent.addShape('rect', {
          attrs: _extends({
            width: width,
            height: height,
            x: _x,
            y: _y
          }, attrs)
        });
      } else if (this.target) {
        this.shape = parent.addShape('rect', {
          attrs: _extends({
            width: bbox.width,
            height: bbox.height,
            x: x - bbox.width / 2,
            y: y - bbox.height / 2
          }, attrs)
        });
        this.target.set('delegateShape', this.shape);
      }

      this.shape.set('capture', false);
    }

    if (this.targets.length > 0) {
      var clientX = e.x - this.origin.x + this.originPoint.minX;
      var clientY = e.y - this.origin.y + this.originPoint.minY;
      this.shape.attr({
        x: clientX,
        y: clientY
      });
    } else if (this.target) {
      if (groupType === 'circle') {
        this.shape.attr({
          x: x - bbox.width / 2,
          y: y - bbox.height / 2
        });
      } else if (groupType === 'rect') {
        this.shape.attr({
          x: x,
          y: y
        });
      }
    }

    this.graph.paint();
  }
};