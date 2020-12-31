/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var Layout = require('./layout');

var SPEED_DIVISOR = 800;
/**
 * fruchterman 布局
 */

Layout.registerLayout('fruchterman', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      maxIteration: 1000,
      // 停止迭代的最大迭代数
      center: [0, 0],
      // 布局中心
      gravity: 10,
      // 重力大小，影响图的紧凑程度
      speed: 1,
      // 速度
      clustering: false,
      // 是否产生聚类力
      clusterGravity: 10 // 聚类力大小

    };
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
  },
  run: function run() {
    var self = this;
    var nodes = self.nodes;
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
    var clustering = self.clustering;
    var clusterMap = new Map();

    if (clustering) {
      nodes.forEach(function (n) {
        if (clusterMap.get(n.cluster) === undefined) {
          var cluster = {
            name: n.cluster,
            cx: 0,
            cy: 0,
            count: 0
          };
          clusterMap.set(n.cluster, cluster);
        }

        var c = clusterMap.get(n.cluster);
        c.cx += n.x;
        c.cy += n.y;
        c.count++;
      });
      clusterMap.forEach(function (c) {
        c.cx /= c.count;
        c.cy /= c.count;
      });
    }

    var _loop = function _loop(i) {
      var disp = [];
      nodes.forEach(function (n, i) {
        disp[i] = {
          x: 0,
          y: 0
        };
      });
      self.getDisp(nodes, edges, nodeMap, nodeIndexMap, disp, k); // gravity for clusters

      if (clustering) {
        var clusterGravity = self.clusterGravity || gravity;
        nodes.forEach(function (n, i) {
          var c = clusterMap.get(n.cluster);
          var distLength = Math.sqrt((n.x - c.cx) * (n.x - c.cx) + (n.y - c.cy) * (n.y - c.cy));
          var gravityForce = k * clusterGravity;
          disp[i].x -= gravityForce * (n.x - c.cx) / distLength;
          disp[i].y -= gravityForce * (n.y - c.cy) / distLength;
        });
        clusterMap.forEach(function (c) {
          c.cx = 0;
          c.cy = 0;
          c.count = 0;
        });
        nodes.forEach(function (n) {
          var c = clusterMap.get(n.cluster);
          c.cx += n.x;
          c.cy += n.y;
          c.count++;
        });
        clusterMap.forEach(function (c) {
          c.cx /= c.count;
          c.cy /= c.count;
        });
      } // gravity


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
  },
  calRepulsive: function calRepulsive(nodes, disp, k) {
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
        var common = k * k / vecLengthSqr;
        disp[i].x += vecx * common;
        disp[i].y += vecy * common;
      });
    });
  },
  calAttractive: function calAttractive(edges, nodeMap, nodeIndexMap, disp, k) {
    edges.forEach(function (e) {
      var uIndex = nodeIndexMap.get(e.source);
      var vIndex = nodeIndexMap.get(e.target);
      if (uIndex === vIndex) return;
      var u = nodeMap.get(e.source);
      var v = nodeMap.get(e.target);
      var vecx = v.x - u.x;
      var vecy = v.y - u.y;
      var vecLength = Math.sqrt(vecx * vecx + vecy * vecy);
      var common = vecLength * vecLength / k;
      disp[vIndex].x -= vecx / vecLength * common;
      disp[vIndex].y -= vecy / vecLength * common;
      disp[uIndex].x += vecx / vecLength * common;
      disp[uIndex].y += vecy / vecLength * common;
    });
  }
});