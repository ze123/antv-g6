/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var d3Force = require('d3-force');

var Layout = require('./layout');

var isArray = require('@antv/util/lib/type/is-array');

var SPEED_DIVISOR = 800;
/**
 * fruchterman 布局
 */

Layout.registerLayout('fruchtermanGroup', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      maxIteration: 1000,
      // 停止迭代的最大迭代数
      center: [0, 0],
      // 布局中心
      gravity: 1,
      // 重力大小，影响图的紧凑程度
      speed: 1,
      // 速度
      groupGravity: 1,
      // 聚类力大小
      nodeRepulsiveCoefficient: 50,
      groupRepulsiveCoefficient: 10,
      nodeAttractiveCoefficient: 1,
      groupAttractiveCoefficient: 1,
      preventGroupOverlap: true,
      groupCollideStrength: 0.7 // 防止重叠的力强度

    };
  },

  /**
   * 初始化
   * @param {object} data 数据
   */
  init: function init(data) {
    var self = this;
    self.nodes = data.nodes;
    self.edges = data.edges;
    self.graph = data.graph;
    self.groupsData = self.graph.get('groups'); // group data

    self.customGroup = self.graph.get('customGroup'); // shape group

    self.groupController = self.graph.get('customGroupControll'); // controller
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var center = self.center;

    if (nodes.length === 0) {
      return;
    } else if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      return;
    }

    var nodeMap = new Map();
    var nodeIndexMap = new Map();
    nodes.forEach(function (node, i) {
      nodeMap.set(node.id, node);
      nodeIndexMap.set(node.id, i);
    });
    self.nodeMap = nodeMap;
    self.nodeIndexMap = nodeIndexMap; // layout

    self.run();
    self.graph.refreshPositions(); // refresh groups' positions

    var customGroup = self.customGroup;
    var groupItems = customGroup.get('children');
    var groupController = self.groupController;
    var groupType = self.graph.get('groupType');
    groupItems.forEach(function (gItem) {
      var gid = gItem.get('id');
      var group = self.groupMap.get(gid);
      group.item = gItem;
      var paddingValue = groupController.getGroupPadding(gid);

      var _groupController$calc = groupController.calculationGroupPosition(group.nodeIds),
          x1 = _groupController$calc.x,
          y1 = _groupController$calc.y,
          width = _groupController$calc.width,
          height = _groupController$calc.height;

      var groupTitleShape = gItem.findByClassName('group-title');
      var gItemKeyShape = gItem.get('children')[0];
      var titleX = 0;
      var titleY = 0;

      if (groupType === 'circle') {
        var r = width > height ? width / 2 : height / 2;
        var x = (width + 2 * x1) / 2;
        var y = (height + 2 * y1) / 2;
        gItemKeyShape.attr({
          x: x,
          y: y,
          r: r + paddingValue
        });
        group.x = x;
        group.y = y;
        group.size = (r + paddingValue) * 2;
        titleX = x;
        titleY = y - r - paddingValue;
      } else if (groupType === 'rect') {
        var defaultStyle = groupController.styles.default;
        var rectPadding = paddingValue * defaultStyle.disCoefficient;
        var rectWidth = width + rectPadding * 2;
        var rectHeight = height + rectPadding * 2;

        var _x = x1 - rectPadding;

        var _y = y1 - rectPadding;

        gItemKeyShape.attr({
          x: _x,
          y: _y,
          width: rectWidth,
          height: rectHeight
        });
        group.x = _x;
        group.y = _y;
        group.size = [rectWidth, rectHeight];
        titleX = x1;
        titleY = y1; // - rectHeight / 2;
      }

      if (groupTitleShape) {
        var titleConfig = group.groupData.title;
        var offsetX = 0;
        var offsetY = 0;

        if (titleConfig) {
          offsetX = titleConfig.offsetox || 0;
          offsetY = titleConfig.offsetoy || 0;
          titleConfig.offsetX = offsetX;
          titleConfig.offsetY = offsetY;

          if (groupType === 'rect') {
            titleConfig.offsetX = 0;
            titleConfig.offsetY = 0;
          }
        }

        var _x2 = titleX + offsetX;

        var _y2 = titleY + offsetY;

        if (groupType === 'rect') {
          _x2 = titleX;
          _y2 = titleY;
        }

        groupTitleShape.attr({
          x: _x2,
          y: _y2
        });
        group.titlePos = [_x2, _y2];
      }
    }); // // find the levels of groups
    // const roots = [];
    // const groupMarks = {};
    // self.groupsData.forEach(gd => {
    //   const group = self.groupMap.get(gd.id);
    //   if (!gd.parentId) {
    //     const groupNodes = [];
    //     group.nodeIds.forEach(nid => {
    //       groupNodes.push(nodeMap.get(nid));
    //     });
    //     roots.push({
    //       id: gd.id,
    //       children: [],
    //       x: group.cx,
    //       y: group.cy,
    //       ox: group.cx,
    //       oy: group.cy,
    //       nodes: groupNodes,
    //       item: group.item,
    //       size: group.size
    //     });
    //     groupMarks[gd.id] = 1;
    //   }
    // });
    // const graphWidth = self.graph.get('width');
    // const graphHeight = self.graph.get('height');
    // self.BFSDivide(graphWidth, graphHeight, roots);
    // according to group's size to divide the canvas

    self.graph.paint();
  },
  run: function run() {
    var self = this;
    var nodes = self.nodes;
    var groups = self.groupsData;
    var edges = self.edges;
    var maxIteration = self.maxIteration;
    var width = self.width;

    if (!width && typeof window !== 'undefined') {
      width = window.innerWidth;
    }

    var height = self.height;

    if (!height && typeof height !== 'undefined') {
      height = window.innerHeight;
    }

    var center = self.center;
    var nodeMap = self.nodeMap;
    var nodeIndexMap = self.nodeIndexMap;
    var maxDisplace = width / 10;
    var k = Math.sqrt(width * height / (nodes.length + 1));
    var gravity = self.gravity;
    var speed = self.speed;
    var groupMap = new Map();
    self.groupMap = groupMap;
    nodes.forEach(function (n) {
      if (groupMap.get(n.groupId) === undefined) {
        var parentId;
        var groupData;
        groups.forEach(function (g) {
          if (g.id === n.groupId) {
            parentId = g.parentId;
            groupData = g;
          }
        });
        var group = {
          name: n.groupId,
          cx: 0,
          cy: 0,
          count: 0,
          parentId: parentId,
          nodeIds: [],
          groupData: groupData
        };
        groupMap.set(n.groupId, group);
      }

      var c = groupMap.get(n.groupId);
      c.nodeIds.push(n.id);
      c.cx += n.x;
      c.cy += n.y;
      c.count++;
    });
    groupMap.forEach(function (c) {
      c.cx /= c.count;
      c.cy /= c.count;
    });
    self.DFSSetGroups();

    var _loop = function _loop(i) {
      var disp = [];
      nodes.forEach(function (n, i) {
        disp[i] = {
          x: 0,
          y: 0
        };
      });
      self.getDisp(nodes, edges, nodeMap, nodeIndexMap, disp, k); // gravity for one group

      var groupGravity = self.groupGravity || gravity;
      nodes.forEach(function (n, i) {
        var c = groupMap.get(n.groupId);
        var distLength = Math.sqrt((n.x - c.cx) * (n.x - c.cx) + (n.y - c.cy) * (n.y - c.cy));
        var gravityForce = self.groupAttractiveCoefficient * k * groupGravity;
        disp[i].x -= gravityForce * (n.x - c.cx) / distLength;
        disp[i].y -= gravityForce * (n.y - c.cy) / distLength;
      });
      groupMap.forEach(function (c) {
        c.cx = 0;
        c.cy = 0;
        c.count = 0;
      });
      nodes.forEach(function (n) {
        var c = groupMap.get(n.groupId);
        c.cx += n.x;
        c.cy += n.y;
        c.count++;
      });
      groupMap.forEach(function (c) {
        c.cx /= c.count;
        c.cy /= c.count;
      }); // gravity

      nodes.forEach(function (n, i) {
        var gravityForce = 0.01 * k * gravity;
        disp[i].x -= gravityForce * (n.x - center[0]);
        disp[i].y -= gravityForce * (n.y - center[1]);
      }); // speed

      nodes.forEach(function (n, i) {
        disp[i].dx *= speed / SPEED_DIVISOR;
        disp[i].dy *= speed / SPEED_DIVISOR;
      }); // move

      nodes.forEach(function (n, i) {
        var distLength = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y);

        if (distLength > 0) {
          // && !n.isFixed()
          var limitedDist = Math.min(maxDisplace * (speed / SPEED_DIVISOR), distLength);
          n.x += disp[i].x / distLength * limitedDist;
          n.y += disp[i].y / distLength * limitedDist;
        }
      });
    };

    for (var i = 0; i < maxIteration; i++) {
      _loop(i);
    }
  },
  getDisp: function getDisp(nodes, edges, nodeMap, nodeIndexMap, disp, k) {
    var self = this;
    self.calRepulsive(nodes, disp, k);
    self.calAttractive(edges, nodeMap, nodeIndexMap, disp, k);
    self.calGroupRepulsive(disp, k);
  },
  calRepulsive: function calRepulsive(nodes, disp, k) {
    var self = this;
    nodes.forEach(function (v, i) {
      disp[i] = {
        x: 0,
        y: 0
      };
      nodes.forEach(function (u, j) {
        if (i === j) return;
        var vecx = v.x - u.x;
        var vecy = v.y - u.y;
        var vecLengthSqr = vecx * vecx + vecy * vecy;
        if (vecLengthSqr === 0) vecLengthSqr = 1;
        var common = self.nodeRepulsiveCoefficient * (k * k) / vecLengthSqr;
        disp[i].x += vecx * common;
        disp[i].y += vecy * common;
      });
    });
  },
  calAttractive: function calAttractive(edges, nodeMap, nodeIndexMap, disp, k) {
    var self = this;
    edges.forEach(function (e) {
      var uIndex = nodeIndexMap.get(e.source);
      var vIndex = nodeIndexMap.get(e.target);
      if (uIndex === vIndex) return;
      var u = nodeMap.get(e.source);
      var v = nodeMap.get(e.target);
      var vecx = v.x - u.x;
      var vecy = v.y - u.y;
      var vecLength = Math.sqrt(vecx * vecx + vecy * vecy);
      var common = self.nodeAttractiveCoefficient * vecLength * vecLength / k;
      disp[vIndex].x -= vecx / vecLength * common;
      disp[vIndex].y -= vecy / vecLength * common;
      disp[uIndex].x += vecx / vecLength * common;
      disp[uIndex].y += vecy / vecLength * common;
    });
  },
  calGroupRepulsive: function calGroupRepulsive(disp, k) {
    var self = this;
    var groupMap = self.groupMap;
    var nodeIndexMap = self.nodeIndexMap;
    groupMap.forEach(function (gv, i) {
      var gDisp = {
        x: 0,
        y: 0
      };
      groupMap.forEach(function (gu, j) {
        if (i === j) return;
        var vecx = gv.cx - gu.cx;
        var vecy = gv.cy - gu.cy;
        var vecLengthSqr = vecx * vecx + vecy * vecy;
        if (vecLengthSqr === 0) vecLengthSqr = 1;
        var common = self.groupRepulsiveCoefficient * (k * k) / vecLengthSqr;
        gDisp.x += vecx * common;
        gDisp.y += vecy * common;
      }); // apply group disp to the group's nodes

      var groupNodeIds = gv.nodeIds;
      groupNodeIds.forEach(function (gnid) {
        var nodeIdx = nodeIndexMap.get(gnid);
        disp[nodeIdx].x += gDisp.x;
        disp[nodeIdx].y += gDisp.y;
      });
    });
  },
  DFSSetGroups: function DFSSetGroups() {
    var self = this;
    var groupMap = self.groupMap;
    groupMap.forEach(function (group) {
      var parentGroupId = group.parentId;

      if (parentGroupId) {
        var parentParentId;
        self.groupsData.forEach(function (g) {
          if (g.id === group.groupId) {
            parentParentId = g.parentId;
          }
        });
        var parentGroup = groupMap.get(parentGroupId);

        if (!parentGroup) {
          var pgroup = {
            name: parentGroupId,
            cx: 0,
            cy: 0,
            count: 0,
            parentId: parentParentId,
            nodeIds: group.nodeIds
          };
          groupMap.set(parentGroupId, pgroup);
        } else {
          group.nodeIds.forEach(function (n) {
            parentGroup.nodeIds.push(n);
          });
        }
      }
    });
  },
  BFSDivide: function BFSDivide(width, height, children) {
    var self = this;
    var nodeForce = d3Force.forceManyBody();
    nodeForce.strength(30);
    var simulation = d3Force.forceSimulation().nodes(children).force('center', d3Force.forceCenter(width / 2, height / 2)).force('charge', nodeForce).alpha(0.3).alphaDecay(0.01).alphaMin(0.001).on('tick', function () {
      children.forEach(function (child) {
        var groupNodes = child.nodes;
        groupNodes.forEach(function (gn) {
          gn.x += child.x - child.ox;
          gn.y += child.y - child.oy;
        });
        child.ox = child.x;
        child.oy = child.y;
        var gItem = child.item;
        var gItemKeyShape = gItem.get('children')[0];
        gItemKeyShape.attr({
          x: child.x,
          y: child.y
        });
      });
      self.graph.refreshPositions();
    }).on('end', function () {});
    self.groupOverlapProcess(simulation);
  },
  groupOverlapProcess: function groupOverlapProcess(simulation) {
    var self = this;
    var nodeSize = self.nodeSize;
    var groupCollideStrength = self.groupCollideStrength;

    if (!nodeSize) {
      nodeSize = function nodeSize(d) {
        if (d.size) {
          if (isArray(d.size)) {
            return d.size[0] / 2;
          }

          return d.size / 2;
        }

        return 10;
      };
    } else if (!isNaN(nodeSize)) {
      nodeSize /= 2;
    } else if (nodeSize.length === 2) {
      var larger = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
      nodeSize = larger / 2;
    } // forceCollide's parameter is a radius


    simulation.force('collisionForce', d3Force.forceCollide(nodeSize).strength(groupCollideStrength));
  }
});