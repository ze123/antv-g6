function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/*
 * @Author: moyee
 * @Date: 2019-07-30 12:10:26
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-23 11:44:32
 * @Description: Group Controller
 */
var isString = require('@antv/util/lib/type/is-string');

var deepMix = require('@antv/util/lib/deep-mix');

var CustomGroup =
/*#__PURE__*/
function () {
  var _proto = CustomGroup.prototype;

  _proto.getDefaultCfg = function getDefaultCfg() {
    return {
      default: {
        lineWidth: 1,
        stroke: '#A3B1BF',
        // lineDash: [ 5, 5 ],
        strokeOpacity: 0.9,
        fill: '#F3F9FF',
        fillOpacity: 0.8,
        opacity: 0.8,
        disCoefficient: 0.6,
        minDis: 40,
        maxDis: 100
      },
      hover: {
        stroke: '#faad14',
        fill: '#ffe58f',
        fillOpacity: 0.3,
        opacity: 0.3,
        lineWidth: 3
      },
      // 收起状态样式
      collapse: {
        r: 30,
        width: 80,
        height: 40,
        // lineDash: [ 5, 5 ],
        stroke: '#A3B1BF',
        lineWidth: 3,
        fill: '#F3F9FF',
        offsetX: -15,
        offsetY: 5
      },
      icon: 'https://gw.alipayobjects.com/zos/rmsportal/MXXetJAxlqrbisIuZxDO.svg',
      operatorBtn: {
        collapse: {
          img: 'https://gw.alipayobjects.com/zos/rmsportal/uZVdwjJGqDooqKLKtvGA.svg',
          width: 16,
          height: 16
        },
        expand: {
          width: 16,
          height: 16,
          img: 'https://gw.alipayobjects.com/zos/rmsportal/MXXetJAxlqrbisIuZxDO.svg'
        }
      },
      visible: false
    };
  };

  function CustomGroup(graph) {
    // const { cfg = {} } = options;
    this.graph = graph;
    var groupStyle = graph.get('groupStyle');
    this.styles = deepMix({}, this.getDefaultCfg(), groupStyle); // 创建的群组集合

    this.customGroup = {};
    this.delegateInGroup = {};
    this.nodePoint = [];
  }
  /**
   * 生成群组
   * @param {string} groupId 群组ID
   * @param {array} nodes 群组中的节点集合
   * @param {string} type 群组类型，默认为circle，支持rect
   * @param {number} zIndex 群组层级，默认为0
   * @param {boolean} updateDataModel 是否更新节点数据，默认为false，只有当手动创建group时才为true
   * @param {object} title 分组标题配置
   * @memberof ItemGroup
   * @return {object} null
   */


  _proto.create = function create(groupId, nodes, type, zIndex, updateDataModel, title) {
    if (type === void 0) {
      type = 'circle';
    }

    if (zIndex === void 0) {
      zIndex = 0;
    }

    if (updateDataModel === void 0) {
      updateDataModel = false;
    }

    if (title === void 0) {
      title = {};
    }

    var graph = this.graph;
    var customGroup = graph.get('customGroup');
    var hasGroupIds = customGroup.get('children').map(function (data) {
      return data.get('id');
    });

    if (hasGroupIds.indexOf(groupId) > -1) {
      return console.warn("\u5DF2\u7ECF\u5B58\u5728ID\u4E3A " + groupId + " \u7684\u5206\u7EC4\uFF0C\u8BF7\u91CD\u65B0\u8BBE\u7F6E\u5206\u7EC4ID\uFF01");
    }

    var nodeGroup = customGroup.addGroup({
      id: groupId,
      zIndex: zIndex
    });
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);
    var defaultStyle = this.styles.default; // 计算群组左上角左边、宽度、高度及x轴方向上的最大值

    var _this$calculationGrou = this.calculationGroupPosition(nodes),
        x = _this$calculationGrou.x,
        y = _this$calculationGrou.y,
        width = _this$calculationGrou.width,
        height = _this$calculationGrou.height,
        maxX = _this$calculationGrou.maxX;

    var paddingValue = this.getGroupPadding(groupId);
    var groupBBox = graph.get('groupBBoxs');
    groupBBox[groupId] = {
      x: x,
      y: y,
      width: width,
      height: height,
      maxX: maxX
    }; // 根据groupId获取group数据，判断是否需要添加title

    var groupTitle = null; // 只有手动创建group时执行以下逻辑

    if (updateDataModel) {
      var groups = graph.get('groups'); // 如果是手动创建group，则原始数据中是没有groupId信息的，需要将groupId添加到node中

      nodes.forEach(function (nodeId) {
        var node = graph.findById(nodeId);
        var model = node.getModel();

        if (!model.groupId) {
          model.groupId = groupId;
        }
      }); // 如果是手动创建 group，则将 group 也添加到 groups 中

      if (!groups.find(function (data) {
        return data.id === groupId;
      })) {
        groups.push({
          id: groupId,
          title: title
        });
        graph.set({
          groups: groups
        });
      }
    }

    var groupData = graph.get('groups').filter(function (data) {
      return data.id === groupId;
    });

    if (groupData && groupData.length > 0) {
      groupTitle = groupData[0].title;
    } // group title 坐标


    var titleX = 0;
    var titleY = 0; // step 1：绘制群组外框

    var keyShape = null;

    if (type === 'circle') {
      var r = width > height ? width / 2 : height / 2;
      var cx = (width + 2 * x) / 2;
      var cy = (height + 2 * y) / 2;
      var lastR = r + paddingValue;
      keyShape = nodeGroup.addShape('circle', {
        attrs: _extends({}, defaultStyle, {
          x: cx,
          y: cy,
          r: lastR
        }),
        capture: true,
        zIndex: zIndex,
        groupId: groupId
      });
      titleX = cx;
      titleY = cy - lastR; // 更新群组及属性样式

      this.setDeletageGroupByStyle(groupId, nodeGroup, {
        width: width,
        height: height,
        x: cx,
        y: cy,
        r: lastR
      });
    } else {
      var rectPadding = paddingValue * defaultStyle.disCoefficient;
      keyShape = nodeGroup.addShape('rect', {
        attrs: _extends({}, defaultStyle, {
          x: x - rectPadding,
          y: y - rectPadding,
          width: width + rectPadding * 2,
          height: height + rectPadding * 2
        }),
        capture: true,
        zIndex: zIndex,
        groupId: groupId
      });
      titleX = x - rectPadding + 15;
      titleY = y - rectPadding + 15; // 更新群组及属性样式

      this.setDeletageGroupByStyle(groupId, nodeGroup, {
        x: x - rectPadding,
        y: y - rectPadding,
        width: width + rectPadding,
        height: height + rectPadding,
        btnOffset: maxX - 3
      });
    } // 添加group标题


    if (groupTitle) {
      var _groupTitle = groupTitle,
          _groupTitle$offsetX = _groupTitle.offsetX,
          offsetX = _groupTitle$offsetX === void 0 ? 0 : _groupTitle$offsetX,
          _groupTitle$offsetY = _groupTitle.offsetY,
          offsetY = _groupTitle$offsetY === void 0 ? 0 : _groupTitle$offsetY,
          _groupTitle$text = _groupTitle.text,
          text = _groupTitle$text === void 0 ? groupTitle : _groupTitle$text,
          titleStyle = _objectWithoutPropertiesLoose(_groupTitle, ["offsetX", "offsetY", "text"]);

      var textShape = nodeGroup.addShape('text', {
        attrs: _extends({
          text: text,
          stroke: '#444',
          x: titleX + offsetX,
          y: titleY + offsetY
        }, titleStyle),
        className: 'group-title'
      });
      textShape.set('capture', false);
    }

    nodeGroup.set('keyShape', keyShape); // 设置graph中groupNodes的值

    graph.get('groupNodes')[groupId] = nodes;
    graph.setAutoPaint(autoPaint);
    graph.paint();
  }
  /**
   * 修改Group样式
   * @param {Item} keyShape 群组的keyShape
   * @param {Object | String} style 样式
   */
  ;

  _proto.setGroupStyle = function setGroupStyle(keyShape, style) {
    if (!keyShape || keyShape.get('destroyed')) {
      return;
    }

    var styles = {};
    var _this$styles = this.styles,
        hoverStyle = _this$styles.hover,
        defaultStyle = _this$styles.default;

    if (isString(style)) {
      if (style === 'default') {
        styles = deepMix({}, defaultStyle);
      } else if (style === 'hover') {
        styles = deepMix({}, hoverStyle);
      }
    } else {
      styles = deepMix({}, defaultStyle, style);
    }

    for (var s in styles) {
      keyShape.attr(s, styles[s]);
    }
  }
  /**
   * 根据GroupID计算群组位置，包括左上角左边及宽度和高度
   *
   * @param {object} nodes 符合条件的node集合：选中的node或具有同一个groupID的node
   * @return {object} 根据节点计算出来的包围盒坐标
   * @memberof ItemGroup
   */
  ;

  _proto.calculationGroupPosition = function calculationGroupPosition(nodes) {
    var graph = this.graph;
    var minx = Infinity;
    var maxx = -Infinity;
    var miny = Infinity;
    var maxy = -Infinity; // 获取已节点的所有最大最小x y值

    for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var id = _ref;
      var element = isString(id) ? graph.findById(id) : id;
      var bbox = element.getBBox();
      var minX = bbox.minX,
          minY = bbox.minY,
          maxX = bbox.maxX,
          maxY = bbox.maxY;

      if (minX < minx) {
        minx = minX;
      }

      if (minY < miny) {
        miny = minY;
      }

      if (maxX > maxx) {
        maxx = maxX;
      }

      if (maxY > maxy) {
        maxy = maxY;
      }
    }

    var x = Math.floor(minx);
    var y = Math.floor(miny);
    var width = Math.ceil(maxx) - x;
    var height = Math.ceil(maxy) - y;
    return {
      x: x,
      y: y,
      width: width,
      height: height,
      maxX: Math.ceil(maxx)
    };
  }
  /**
   * 当group中含有group时，获取padding值
   * @param {string} groupId 节点分组ID
   * @return {number} 在x和y方向上的偏移值
   */
  ;

  _proto.getGroupPadding = function getGroupPadding(groupId) {
    var graph = this.graph;
    var defaultStyle = this.styles.default; // 检测操作的群组中是否包括子群组

    var groups = graph.get('groups');
    var hasSubGroup = !!groups.filter(function (g) {
      return g.parentId === groupId;
    }).length > 0;
    var paddingValue = hasSubGroup ? defaultStyle.maxDis : defaultStyle.minDis;
    return paddingValue;
  }
  /**
   * 设置群组对象及属性值
   *
   * @param {string} groupId 群组ID
   * @param {Group} deletage 群组元素
   * @param {object} property 属性值，里面包括width、height和maxX
   * @memberof ItemGroup
   */
  ;

  _proto.setDeletageGroupByStyle = function setDeletageGroupByStyle(groupId, deletage, property) {
    var width = property.width,
        height = property.height,
        x = property.x,
        y = property.y,
        r = property.r,
        btnOffset = property.btnOffset;
    var customGroupStyle = this.customGroup[groupId];

    if (!customGroupStyle) {
      // 首次赋值
      this.customGroup[groupId] = {
        nodeGroup: deletage,
        groupStyle: {
          width: width,
          height: height,
          x: x,
          y: y,
          r: r,
          btnOffset: btnOffset
        }
      };
    } else {
      // 更新时候merge配置项
      var groupStyle = customGroupStyle.groupStyle;
      var styles = deepMix({}, groupStyle, property);
      this.customGroup[groupId] = {
        nodeGroup: deletage,
        groupStyle: styles
      };
    }
  }
  /**
   * 根据群组ID获取群组及属性对象
   *
   * @param {string} groupId 群组ID
   * @return {Item} 群组
   * @memberof ItemGroup
   */
  ;

  _proto.getDeletageGroupById = function getDeletageGroupById(groupId) {
    return this.customGroup[groupId];
  }
  /**
   * 收起和展开群组
   * @param {string} groupId 群组ID
   */
  ;

  _proto.collapseExpandGroup = function collapseExpandGroup(groupId) {
    var customGroup = this.getDeletageGroupById(groupId);
    var nodeGroup = customGroup.nodeGroup;
    var hasHidden = nodeGroup.get('hasHidden'); // 该群组已经处于收起状态，需要展开

    if (hasHidden) {
      nodeGroup.set('hasHidden', false);
      this.expandGroup(groupId);
    } else {
      nodeGroup.set('hasHidden', true);
      this.collapseGroup(groupId);
    }
  }
  /**
   * 将临时节点递归地设置到groupId及父节点上
   * @param {string} groupId 群组ID
   * @param {string} tmpNodeId 临时节点ID
   */
  ;

  _proto.setGroupTmpNode = function setGroupTmpNode(groupId, tmpNodeId) {
    var graph = this.graph;
    var graphNodes = graph.get('groupNodes');
    var groups = graph.get('groups');

    if (graphNodes[groupId].indexOf(tmpNodeId) < 0) {
      graphNodes[groupId].push(tmpNodeId);
    } // 获取groupId的父群组


    var parentGroup = groups.filter(function (g) {
      return g.id === groupId;
    });
    var parentId = null;

    if (parentGroup.length > 0) {
      parentId = parentGroup[0].parentId;
    } // 如果存在父群组，则把临时元素也添加到父群组中


    if (parentId) {
      this.setGroupTmpNode(parentId, tmpNodeId);
    }
  }
  /**
   * 收起群组，隐藏群组中的节点及边，群组外部相邻的边都连接到群组上
   *
   * @param {string} id 群组ID
   * @memberof ItemGroup
   */
  ;

  _proto.collapseGroup = function collapseGroup(id) {
    var _this = this;

    var customGroup = this.getDeletageGroupById(id);
    var nodeGroup = customGroup.nodeGroup; // 收起群组后的默认样式

    var collapse = this.styles.collapse;
    var graph = this.graph;
    var groupType = graph.get('groupType');
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);
    var nodesInGroup = graph.get('groupNodes')[id];

    var _this$calculationGrou2 = this.calculationGroupPosition(nodesInGroup),
        w = _this$calculationGrou2.width,
        h = _this$calculationGrou2.height; // 更新Group的大小


    var keyShape = nodeGroup.get('keyShape');

    var r = collapse.r,
        width = collapse.width,
        height = collapse.height,
        offsetX = collapse.offsetX,
        offsetY = collapse.offsetY,
        otherStyle = _objectWithoutPropertiesLoose(collapse, ["r", "width", "height", "offsetX", "offsetY"]);

    for (var style in otherStyle) {
      keyShape.attr(style, otherStyle[style]);
    }

    var options = {
      groupId: id,
      id: id + "-custom-node",
      x: keyShape.attr('x'),
      y: keyShape.attr('y'),
      style: {
        r: r
      },
      shape: 'circle'
    };
    var titleShape = nodeGroup.findByClassName('group-title'); // 收起群组时候动画

    if (groupType === 'circle') {
      var radius = keyShape.attr('r');
      keyShape.animate({
        onFrame: function onFrame(ratio) {
          return {
            r: radius - ratio * (radius - r)
          };
        }
      }, 500, 'easeCubic');

      if (titleShape) {
        titleShape.attr({
          x: keyShape.attr('x') + offsetX,
          y: keyShape.attr('y') + offsetY
        });
      }
    } else if (groupType === 'rect') {
      keyShape.animate({
        onFrame: function onFrame(ratio) {
          return {
            width: w - ratio * (w - width),
            height: h - ratio * (h - height)
          };
        }
      }, 500, 'easeCubic');

      if (titleShape) {
        titleShape.attr({
          x: keyShape.attr('x') + 10,
          y: keyShape.attr('y') + height / 2 + 5
        });
      }

      options = {
        groupId: id,
        id: id + "-custom-node",
        x: keyShape.attr('x') + width / 2,
        y: keyShape.attr('y') + height / 2,
        size: [width, height],
        shape: 'rect'
      };
    }

    var edges = graph.getEdges(); // 获取所有source在群组外，target在群组内的边

    var sourceOutTargetInEdges = edges.filter(function (edge) {
      var model = edge.getModel();
      return !nodesInGroup.includes(model.source) && nodesInGroup.includes(model.target);
    }); // 获取所有source在群组外，target在群组内的边

    var sourceInTargetOutEdges = edges.filter(function (edge) {
      var model = edge.getModel();
      return nodesInGroup.includes(model.source) && !nodesInGroup.includes(model.target);
    }); // 获取群组中节点之间的所有边

    var edgeAllInGroup = edges.filter(function (edge) {
      var model = edge.getModel();
      return nodesInGroup.includes(model.source) && nodesInGroup.includes(model.target);
    }); // 隐藏群组中的所有节点

    nodesInGroup.forEach(function (nodeId) {
      var node = graph.findById(nodeId);
      var model = node.getModel();
      var groupId = model.groupId;

      if (groupId && groupId !== id) {
        // 存在群组，则隐藏
        var currentGroup = _this.getDeletageGroupById(groupId);

        var _nodeGroup = currentGroup.nodeGroup;

        _nodeGroup.hide();
      }

      node.hide();
    });
    edgeAllInGroup.forEach(function (edge) {
      var source = edge.getSource();
      var target = edge.getTarget();

      if (source.isVisible() && target.isVisible()) {
        edge.show();
      } else {
        edge.hide();
      }
    }); // 群组中存在source和target其中有一个在群组内，一个在群组外的情况

    if (sourceOutTargetInEdges.length > 0 || sourceInTargetOutEdges.length > 0) {
      var delegateNode = graph.add('node', options);
      delegateNode.set('capture', false);
      delegateNode.hide();
      this.delegateInGroup[id] = {
        delegateNode: delegateNode
      }; // 将临时添加的节点加入到群组中，以便拖动节点时候线跟着拖动

      this.setGroupTmpNode(id, id + "-custom-node");
      this.updateEdgeInGroupLinks(id, sourceOutTargetInEdges, sourceInTargetOutEdges);
    }

    graph.paint();
    graph.setAutoPaint(autoPaint);
  }
  /**
   * 收起群组时生成临时的节点，用于连接群组外的节点
   *
   * @param {string} groupId 群组ID
   * @param {array} sourceOutTargetInEdges 出度的边
   * @param {array} sourceInTargetOutEdges 入度的边
   * @memberof ItemGroup
   */
  ;

  _proto.updateEdgeInGroupLinks = function updateEdgeInGroupLinks(groupId, sourceOutTargetInEdges, sourceInTargetOutEdges) {
    var graph = this.graph; // 更新source在外的节点

    var edgesOuts = {};
    sourceOutTargetInEdges.map(function (edge) {
      var model = edge.getModel();
      var id = edge.get('id');
      var target = model.target;
      edgesOuts[id] = target;
      graph.updateItem(edge, {
        target: groupId + "-custom-node"
      });
      return true;
    }); // 更新target在外的节点

    var edgesIn = {};
    sourceInTargetOutEdges.map(function (edge) {
      var model = edge.getModel();
      var id = edge.get('id');
      var source = model.source;
      edgesIn[id] = source;
      graph.updateItem(edge, {
        source: groupId + "-custom-node"
      });
      return true;
    }); // 缓存群组groupId下的edge和临时生成的node节点

    this.delegateInGroup[groupId] = deepMix({
      sourceOutTargetInEdges: sourceOutTargetInEdges,
      sourceInTargetOutEdges: sourceInTargetOutEdges,
      edgesOuts: edgesOuts,
      edgesIn: edgesIn
    }, this.delegateInGroup[groupId]);
  }
  /**
   * 展开群组，恢复群组中的节点及边
   *
   * @param {string} id 群组ID
   * @memberof ItemGroup
   */
  ;

  _proto.expandGroup = function expandGroup(id) {
    var _this2 = this;

    var graph = this.graph;
    var groupType = graph.get('groupType');
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false); // 显示之前隐藏的节点和群组

    var nodesInGroup = graph.get('groupNodes')[id];
    var noCustomNodes = nodesInGroup.filter(function (node) {
      return node.indexOf('custom-node') === -1;
    });

    var _this$calculationGrou3 = this.calculationGroupPosition(noCustomNodes),
        width = _this$calculationGrou3.width,
        height = _this$calculationGrou3.height;

    var _this$getDeletageGrou = this.getDeletageGroupById(id),
        nodeGroup = _this$getDeletageGrou.nodeGroup;

    var keyShape = nodeGroup.get('keyShape');
    var _this$styles2 = this.styles,
        defaultStyle = _this$styles2.default,
        collapse = _this$styles2.collapse;

    for (var style in defaultStyle) {
      keyShape.attr(style, defaultStyle[style]);
    }

    var titleShape = nodeGroup.findByClassName('group-title'); // 检测操作的群组中是否包括子群组

    var paddingValue = this.getGroupPadding(id);

    if (groupType === 'circle') {
      var r = width > height ? width / 2 : height / 2;
      keyShape.animate({
        onFrame: function onFrame(ratio) {
          return {
            r: collapse.r + ratio * (r - collapse.r + paddingValue)
          };
        }
      }, 500, 'easeCubic');
    } else if (groupType === 'rect') {
      var w = collapse.width,
          h = collapse.height;
      keyShape.animate({
        onFrame: function onFrame(ratio) {
          return {
            width: w + ratio * (width - w + paddingValue * defaultStyle.disCoefficient * 2),
            height: h + ratio * (height - h + paddingValue * defaultStyle.disCoefficient * 2)
          };
        }
      }, 500, 'easeCubic');
    }

    if (titleShape) {
      // 根据groupId获取group数据，判断是否需要添加title
      var groupTitle = null;
      var groupData = graph.get('groups').filter(function (data) {
        return data.id === id;
      });

      if (groupData && groupData.length > 0) {
        groupTitle = groupData[0].title;
      }

      var _groupTitle2 = groupTitle,
          _groupTitle2$offsetX = _groupTitle2.offsetX,
          offsetX = _groupTitle2$offsetX === void 0 ? 0 : _groupTitle2$offsetX,
          _groupTitle2$offsetY = _groupTitle2.offsetY,
          offsetY = _groupTitle2$offsetY === void 0 ? 0 : _groupTitle2$offsetY;

      if (groupType === 'circle') {
        titleShape.animate({
          onFrame: function onFrame(ratio) {
            return {
              x: keyShape.attr('x') + offsetX,
              y: keyShape.attr('y') - ratio * keyShape.attr('r') + offsetY
            };
          }
        }, 600, 'easeCubic');
      } else if (groupType === 'rect') {
        titleShape.animate({
          onFrame: function onFrame(ratio) {
            return {
              x: keyShape.attr('x') + ratio * (15 + offsetX),
              y: keyShape.attr('y') + ratio * (15 + offsetY)
            };
          }
        }, 600, 'easeCubic');
      }
    } // 群组动画一会后再显示节点和边


    setTimeout(function () {
      nodesInGroup.forEach(function (nodeId) {
        var node = graph.findById(nodeId);
        var model = node.getModel();
        var groupId = model.groupId;

        if (groupId && groupId !== id) {
          // 存在群组，则显示
          var currentGroup = _this2.getDeletageGroupById(groupId);

          var _nodeGroup2 = currentGroup.nodeGroup;

          _nodeGroup2.show();

          var hasHidden = _nodeGroup2.get('hasHidden');

          if (!hasHidden) {
            node.show();
          }
        } else {
          node.show();
        }
      });
      var edges = graph.getEdges(); // 获取群组中节点之间的所有边

      var edgeAllInGroup = edges.filter(function (edge) {
        var model = edge.getModel();
        return nodesInGroup.includes(model.source) || nodesInGroup.includes(model.target);
      });
      edgeAllInGroup.forEach(function (edge) {
        var source = edge.getSource();
        var target = edge.getTarget();

        if (source.isVisible() && target.isVisible()) {
          edge.show();
        }
      });
    }, 300);
    var delegates = this.delegateInGroup[id];

    if (delegates) {
      var sourceOutTargetInEdges = delegates.sourceOutTargetInEdges,
          sourceInTargetOutEdges = delegates.sourceInTargetOutEdges,
          edgesOuts = delegates.edgesOuts,
          edgesIn = delegates.edgesIn,
          delegateNode = delegates.delegateNode; // 恢复source在外的节点

      sourceOutTargetInEdges.map(function (edge) {
        var id = edge.get('id');
        var sourceOuts = edgesOuts[id];
        graph.updateItem(edge, {
          target: sourceOuts
        });
        return true;
      }); // 恢复target在外的节点

      sourceInTargetOutEdges.map(function (edge) {
        var id = edge.get('id');
        var sourceIn = edgesIn[id];
        graph.updateItem(edge, {
          source: sourceIn
        });
        return true;
      }); // 删除群组中的临时节点ID

      var tmpNodeModel = delegateNode.getModel();
      this.deleteTmpNode(id, tmpNodeModel.id);
      graph.remove(delegateNode);
      delete this.delegateInGroup[id];
    }

    graph.setAutoPaint(autoPaint);
    graph.paint();
  };

  _proto.deleteTmpNode = function deleteTmpNode(groupId, tmpNodeId) {
    var graph = this.graph;
    var groups = graph.get('groups');
    var nodesInGroup = graph.get('groupNodes')[groupId];
    var index = nodesInGroup.indexOf(tmpNodeId);
    nodesInGroup.splice(index, 1); // 获取groupId的父群组

    var parentGroup = groups.filter(function (g) {
      return g.id === groupId;
    });
    var parentId = null;

    if (parentGroup.length > 0) {
      parentId = parentGroup[0].parentId;
    } // 如果存在父群组，则把临时元素也添加到父群组中


    if (parentId) {
      this.deleteTmpNode(parentId, tmpNodeId);
    }
  }
  /**
   * 删除节点分组
   * @param {string} groupId 节点分组ID
   * @memberof ItemGroup
   */
  ;

  _proto.remove = function remove(groupId) {
    var graph = this.graph;
    var customGroup = this.getDeletageGroupById(groupId);

    if (!customGroup) {
      console.warn("\u8BF7\u786E\u8BA4\u8F93\u5165\u7684groupId " + groupId + " \u662F\u5426\u6709\u8BEF\uFF01");
      return;
    }

    var nodeGroup = customGroup.nodeGroup;
    var autoPaint = graph.get('autoPaint');
    graph.setAutoPaint(false);
    var groupNodes = graph.get('groupNodes');
    var nodes = groupNodes[groupId]; // 删除原群组中node中的groupID

    nodes.forEach(function (nodeId) {
      var node = graph.findById(nodeId);
      var model = node.getModel();
      var gId = model.groupId;

      if (!gId) {
        return;
      }

      if (groupId === gId) {
        delete model.groupId; // 使用没有groupID的数据更新节点

        graph.updateItem(node, model);
      }
    });
    nodeGroup.destroy(); // 删除customGroup中groupId的数据

    delete this.customGroup[groupId]; // 删除groups数据中的groupId

    var groups = graph.get('groups');

    if (groups.length > 0) {
      var filterGroup = groups.filter(function (group) {
        return group.id !== groupId;
      });
      graph.set('groups', filterGroup);
    }

    var parentGroupId = null;
    var parentGroupData = null;

    for (var _iterator2 = groups, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var group = _ref2;

      if (groupId !== group.id) {
        continue;
      }

      parentGroupId = group.parentId;
      parentGroupData = group;
      break;
    }

    if (parentGroupData) {
      delete parentGroupData.parentId;
    } // 删除groupNodes中的groupId数据


    delete groupNodes[groupId];

    if (parentGroupId) {
      groupNodes[parentGroupId] = groupNodes[parentGroupId].filter(function (node) {
        return !nodes.includes(node);
      });
    }

    graph.setAutoPaint(autoPaint);
    graph.paint();
  }
  /**
   * 更新节点分组位置及里面的节点和边的位置
   * @param {string} groupId 节点分组ID
   * @param {object} position delegate的坐标位置
   */
  ;

  _proto.updateGroup = function updateGroup(groupId, position) {
    var graph = this.graph;
    var groupType = graph.get('groupType'); // 更新群组里面节点和线的位置

    this.updateItemInGroup(groupId, position); // 判断是否拖动出了parent group外面，如果拖出了parent Group外面，则更新数据，去掉group关联
    // 获取groupId的父Group的ID

    var _graph$save = graph.save(),
        groups = _graph$save.groups;

    var parentGroupId = null;
    var parentGroupData = null;

    for (var _iterator3 = groups, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var group = _ref3;

      if (groupId !== group.id) {
        continue;
      }

      parentGroupId = group.parentId;
      parentGroupData = group;
      break;
    }

    if (parentGroupId) {
      var _this$getDeletageGrou2 = this.getDeletageGroupById(parentGroupId),
          parentGroup = _this$getDeletageGrou2.nodeGroup; // const parentGroup = customGroup[parentGroupId].nodeGroup;


      var parentKeyShape = parentGroup.get('keyShape');
      this.setGroupStyle(parentKeyShape, 'default');
      var parentGroupBBox = parentKeyShape.getBBox();
      var minX = parentGroupBBox.minX,
          minY = parentGroupBBox.minY,
          maxX = parentGroupBBox.maxX,
          maxY = parentGroupBBox.maxY; // 检查是否拖出了父Group

      var _this$getDeletageGrou3 = this.getDeletageGroupById(groupId),
          currentGroup = _this$getDeletageGrou3.nodeGroup; // const currentGroup = customGroup[groupId].nodeGroup;


      var currentKeyShape = currentGroup.get('keyShape');
      var currentKeyShapeBBox = currentKeyShape.getBBox();
      var x = currentKeyShapeBBox.x,
          y = currentKeyShapeBBox.y;

      if (!(x < maxX && x > minX && y < maxY && y > minY)) {
        // 拖出了parent group，则取消parent group ID
        delete parentGroupData.parentId; // 同时删除groupID中的节点

        var groupNodes = graph.get('groupNodes');
        var currentGroupNodes = groupNodes[groupId];
        var parentGroupNodes = groupNodes[parentGroupId];
        groupNodes[parentGroupId] = parentGroupNodes.filter(function (node) {
          return currentGroupNodes.indexOf(node) === -1;
        });

        var _this$calculationGrou4 = this.calculationGroupPosition(groupNodes[parentGroupId]),
            x1 = _this$calculationGrou4.x,
            y1 = _this$calculationGrou4.y,
            width = _this$calculationGrou4.width,
            height = _this$calculationGrou4.height;

        var paddingValue = this.getGroupPadding(parentGroupId);
        var groupTitleShape = parentGroup.findByClassName('group-title');
        var titleX = 0;
        var titleY = 0;

        if (groupType === 'circle') {
          var r = width > height ? width / 2 : height / 2;
          var cx = (width + 2 * x1) / 2;
          var cy = (height + 2 * y1) / 2;
          parentKeyShape.attr({
            r: r + paddingValue,
            x: cx,
            y: cy
          });
          titleX = cx;
          titleY = cy - parentKeyShape.attr('r');
        } else if (groupType === 'rect') {
          var defaultStyle = this.styles.default;
          var rectPadding = paddingValue * defaultStyle.disCoefficient;
          parentKeyShape.attr({
            x: x1 - rectPadding,
            y: y1 - rectPadding
          });
          titleX = x1 - rectPadding + 15;
          titleY = y1 - rectPadding + 15;
        }

        if (groupTitleShape) {
          var titleConfig = parentGroupData.title;
          var offsetX = 0;
          var offsetY = 0;

          if (titleConfig) {
            offsetX = titleConfig.offsetX;
            offsetY = titleConfig.offsetY;
          }

          groupTitleShape.attr({
            x: titleX + offsetX,
            y: titleY + offsetY
          });
        }
      }
    }
  }
  /**
   * 更新节点分组中节点和边的位置
   * @param {string} groupId 节点分组ID
   * @param {object} position delegate的坐标位置
   */
  ;

  _proto.updateItemInGroup = function updateItemInGroup(groupId, position) {
    var _this3 = this;

    var graph = this.graph;
    var groupType = graph.get('groupType');
    var groupNodes = graph.get('groupNodes'); // step 1：先修改groupId中的节点位置

    var nodeInGroup = groupNodes[groupId];

    var _this$getDeletageGrou4 = this.getDeletageGroupById(groupId),
        nodeGroup = _this$getDeletageGrou4.nodeGroup;

    var originBBox = nodeGroup.getBBox();
    var otherGroupId = [];
    nodeInGroup.forEach(function (nodeId, index) {
      var node = graph.findById(nodeId);
      var model = node.getModel();
      var nodeGroupId = model.groupId;

      if (nodeGroupId && !otherGroupId.includes(nodeGroupId)) {
        otherGroupId.push(nodeGroupId);
      }

      if (!_this3.nodePoint[index]) {
        _this3.nodePoint[index] = {
          x: model.x,
          y: model.y
        };
      } // 群组拖动后节点的位置：deletateShape的最终位置-群组起始位置+节点位置


      var x = position.x - originBBox.x + _this3.nodePoint[index].x;
      var y = position.y - originBBox.y + _this3.nodePoint[index].y;
      _this3.nodePoint[index] = {
        x: x,
        y: y
      };
      graph.updateItem(node, {
        x: x,
        y: y
      });
    }); // step 2：修改父group中其他节点的位置
    // otherGroupId中是否包括当前groupId，如果不包括，则添加进去

    if (!otherGroupId.includes(groupId)) {
      otherGroupId.push(groupId);
    } // 更新完群组位置后，重新设置群组起始位置


    otherGroupId.forEach(function (id) {
      // 更新群组位置
      var _this3$getDeletageGro = _this3.getDeletageGroupById(id),
          nodeGroup = _this3$getDeletageGro.nodeGroup;

      var groupKeyShape = nodeGroup.get('keyShape');
      var noCustomNodes = groupNodes[id].filter(function (node) {
        return node.indexOf('custom-node') === -1;
      });

      var _this3$calculationGro = _this3.calculationGroupPosition(noCustomNodes),
          x = _this3$calculationGro.x,
          y = _this3$calculationGro.y,
          width = _this3$calculationGro.width,
          height = _this3$calculationGro.height;

      var titleX = 0;
      var titleY = 0;

      if (groupType === 'circle') {
        var cx = (width + 2 * x) / 2;
        var cy = (height + 2 * y) / 2;
        groupKeyShape.attr({
          x: cx,
          y: cy
        });
        titleX = cx;
        titleY = cy - groupKeyShape.attr('r');
      } else if (groupType === 'rect') {
        // 节点分组状态
        var hasHidden = nodeGroup.get('hasHidden');

        var paddingValue = _this3.getGroupPadding(id);

        var keyshapePosition = {};
        var defaultStyle = _this3.styles.default;
        var rectPadding = paddingValue * defaultStyle.disCoefficient;
        titleX = x - rectPadding + 15;
        titleY = y - rectPadding + 15;

        if (hasHidden) {
          // 无标题，或节点分组是展开的情况
          keyshapePosition = {
            x: x - rectPadding,
            y: y - rectPadding
          };
          titleY = titleY + 10;
        } else {
          keyshapePosition = {
            x: x - rectPadding,
            y: y - rectPadding,
            width: width + rectPadding * 2,
            height: height + rectPadding * 2
          };
        }

        groupKeyShape.attr(keyshapePosition);
      } // 如果存在标题，则更新标题位置


      _this3.updateGroupTitle(nodeGroup, id, titleX, titleY);
    });
  }
  /**
   * 更新节点分组的 Title
   * @param {Group} group 当前 Group 实例
   * @param {string} groupId 分组ID
   * @param {number} x x坐标
   * @param {number} y y坐标
   */
  ;

  _proto.updateGroupTitle = function updateGroupTitle(group, groupId, x, y) {
    var graph = this.graph;
    var groupTitleShape = group.findByClassName('group-title');

    if (groupTitleShape) {
      var titleConfig = null;
      var groupData = graph.get('groups').filter(function (data) {
        return data.id === groupId;
      });

      if (groupData && groupData.length > 0) {
        titleConfig = groupData[0].title;
      }

      var offsetX = 0;
      var offsetY = 0;

      if (titleConfig) {
        offsetX = titleConfig.offsetX || 0;
        offsetY = titleConfig.offsetY || 0;
      }

      groupTitleShape.attr({
        x: x + offsetX,
        y: y + offsetY
      });
    }
  }
  /**
   * 拖动节点时候动态改变节点分组大小
   * @param {Event} evt 事件句柄
   * @param {Group} currentGroup 当前操作的群组
   * @param {Item} keyShape 当前操作的keyShape
   * @description 节点拖入拖出后动态改变群组大小
   */
  ;

  _proto.dynamicChangeGroupSize = function dynamicChangeGroupSize(evt, currentGroup, keyShape) {
    var item = evt.item;
    var model = item.getModel(); // 节点所在的GroupId

    var groupId = model.groupId;
    var graph = this.graph;
    var groupType = graph.get('groupType');
    var groupNodes = graph.get('groupNodes');
    var nodes = groupNodes[groupId]; // 拖出节点后，根据最新的节点数量，重新计算群组大小
    // 如果只有一个节点，拖出后，则删除该组

    if (nodes.length === 0) {
      // step 1: 从groupNodes中删除
      delete groupNodes[groupId]; // step 2: 从groups数据中删除

      var groupsData = graph.get('groups');
      graph.set('groups', groupsData.filter(function (gdata) {
        return gdata.id !== groupId;
      })); // step 3: 删除原来的群组

      currentGroup.remove();
    } else {
      var _this$calculationGrou5 = this.calculationGroupPosition(nodes),
          x = _this$calculationGrou5.x,
          y = _this$calculationGrou5.y,
          width = _this$calculationGrou5.width,
          height = _this$calculationGrou5.height; // 检测操作的群组中是否包括子群组


      var paddingValue = this.getGroupPadding(groupId);
      var titleX = 0;
      var titleY = 0;

      if (groupType === 'circle') {
        var r = width > height ? width / 2 : height / 2;
        var cx = (width + 2 * x) / 2;
        var cy = (height + 2 * y) / 2;
        keyShape.attr({
          r: r + paddingValue,
          x: cx,
          y: cy
        });
        titleX = cx;
        titleY = cy - keyShape.attr('r');
      } else if (groupType === 'rect') {
        var defaultStyle = this.styles.default;
        var rectPadding = paddingValue * defaultStyle.disCoefficient;
        keyShape.attr({
          x: x - rectPadding,
          y: y - rectPadding,
          width: width + rectPadding * 2,
          height: height + rectPadding * 2
        });
        titleX = x - rectPadding + 15;
        titleY = y - rectPadding + 15;
      } // 如果存在标题，则更新标题位置


      this.updateGroupTitle(currentGroup, groupId, titleX, titleY);
    }

    this.setGroupStyle(keyShape, 'default');
  };

  _proto.resetNodePoint = function resetNodePoint() {
    this.nodePoint.length = 0;
  };

  _proto.destroy = function destroy() {
    this.graph = null;
    this.styles = {};
    this.customGroup = {};
    this.delegateInGroup = {};
    this.resetNodePoint();
  };

  return CustomGroup;
}();

module.exports = CustomGroup;