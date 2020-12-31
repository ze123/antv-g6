/**
 * @fileOverview concentric layout
 * @author shiwu.wyy@antfin.com
 * this algorithm refers to <cytoscape.js> - https://github.com/cytoscape/cytoscape.js/
 */
var Layout = require('./layout');

var isString = require('@antv/util/lib/type/is-string');

function getDegree(n, nodeIdxMap, edges) {
  var degrees = [];

  for (var i = 0; i < n; i++) {
    degrees[i] = 0;
  }

  edges.forEach(function (e) {
    degrees[nodeIdxMap.get(e.source)] += 1;
    degrees[nodeIdxMap.get(e.target)] += 1;
  });
  return degrees;
}
/**
 * 同心圆布局
 */


Layout.registerLayout('concentric', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      center: [0, 0],
      // 布局中心
      nodeSize: 30,
      minNodeSpacing: 10,
      // min spacing between outside of nodes (used for radius adjustment)
      preventOverlap: false,
      // prevents node overlap, may overflow boundingBox if not enough space
      sweep: undefined,
      // how many radians should be between the first and last node (defaults to full circle)
      equidistant: false,
      // whether levels have an equal radial distance betwen them, may cause bounding box overflow
      startAngle: 3 / 2 * Math.PI,
      // where nodes start in radians
      clockwise: true,
      // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
      maxLevelDiff: undefined,
      // the letiation of concentric values in each level
      sortBy: 'degree' // 根据 sortBy 指定的属性进行排布，数值高的放在中心。如果是 sortBy 则会计算节点度数，度数最高的放在中心。

    };
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var edges = self.edges;
    var n = nodes.length;
    var center = self.center;

    if (n === 0) {
      return;
    } else if (n === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      return;
    }

    var layoutNodes = [];
    var maxNodeSize;

    if (isNaN(self.nodeSize)) {
      maxNodeSize = Math.max(self.nodeSize[0], self.nodeSize[1]);
    } else {
      maxNodeSize = self.nodeSize;
    }

    nodes.forEach(function (node) {
      layoutNodes.push(node);
      var nodeSize;

      if (isNaN(node.size)) {
        nodeSize = Math.max(node.size[0], node.size[1]);
      } else {
        nodeSize = node.size;
      }

      maxNodeSize = Math.max(maxNodeSize, nodeSize);
    });
    var width = self.width;

    if (!width && typeof window !== 'undefined') {
      width = window.innerWidth;
    }

    var height = self.height;

    if (!height && typeof height !== 'undefined') {
      height = window.innerHeight;
    }

    self.clockwise = self.counterclockwise !== undefined ? !self.counterclockwise : self.clockwise; // layout

    var nodeMap = new Map();
    var nodeIdxMap = new Map();
    layoutNodes.forEach(function (node, i) {
      nodeMap.set(node.id, node);
      nodeIdxMap.set(node.id, i);
    });
    self.nodeMap = nodeMap; // get the node degrees

    if (self.sortBy === 'degree' || !isString(self.sortBy) || layoutNodes[0][self.sortBy] === undefined) {
      self.sortBy = 'degree';

      if (isNaN(nodes[0].degree)) {
        var values = getDegree(nodes.length, nodeIdxMap, edges);
        layoutNodes.forEach(function (node, i) {
          node.degree = values[i];
        });
      }
    } // sort nodes by value


    layoutNodes.sort(function (n1, n2) {
      return n2[self.sortBy] - n1[self.sortBy];
    });
    self.maxValueNode = layoutNodes[0];
    self.maxLevelDiff = self.maxLevelDiff || self.maxValueNode[self.sortBy] / 4; // 0.5;
    // put the values into levels

    var levels = [[]];
    var currentLevel = levels[0];
    layoutNodes.forEach(function (node) {
      if (currentLevel.length > 0) {
        var diff = Math.abs(currentLevel[0][self.sortBy] - node[self.sortBy]);

        if (diff >= self.maxLevelDiff) {
          currentLevel = [];
          levels.push(currentLevel);
        }
      }

      currentLevel.push(node);
    }); // create positions for levels

    var minDist = maxNodeSize + self.minNodeSpacing; // min dist between nodes

    if (!self.preventOverlap) {
      // then strictly constrain to bb
      var firstLvlHasMulti = levels.length > 0 && levels[0].length > 1;
      var maxR = Math.min(self.width, self.height) / 2 - minDist;
      var rStep = maxR / (levels.length + firstLvlHasMulti ? 1 : 0);
      minDist = Math.min(minDist, rStep);
    } // find the metrics for each level


    var r = 0;
    levels.forEach(function (level) {
      var sweep = self.sweep === undefined ? 2 * Math.PI - 2 * Math.PI / level.length : self.sweep;
      var dTheta = level.dTheta = sweep / Math.max(1, level.length - 1); // calculate the radius

      if (level.length > 1 && self.preventOverlap) {
        // but only if more than one node (can't overlap)
        var dcos = Math.cos(dTheta) - Math.cos(0);
        var dsin = Math.sin(dTheta) - Math.sin(0);
        var rMin = Math.sqrt(minDist * minDist / (dcos * dcos + dsin * dsin)); // s.t. no nodes overlapping

        r = Math.max(rMin, r);
      }

      level.r = r;
      r += minDist;
    });

    if (self.equidistant) {
      var rDeltaMax = 0;
      var _r = 0;

      for (var i = 0; i < levels.length; i++) {
        var level = levels[i];
        var rDelta = level.r - _r;
        rDeltaMax = Math.max(rDeltaMax, rDelta);
      }

      _r = 0;
      levels.forEach(function (level, i) {
        if (i === 0) {
          _r = level.r;
        }

        level.r = _r;
        _r += rDeltaMax;
      });
    } // calculate the node positions


    levels.forEach(function (level) {
      var dTheta = level.dTheta;
      var r = level.r;
      level.forEach(function (node, j) {
        var theta = self.startAngle + (self.clockwise ? 1 : -1) * dTheta * j;
        node.x = center[0] + r * Math.cos(theta);
        node.y = center[1] + r * Math.sin(theta);
      });
    });
  }
});