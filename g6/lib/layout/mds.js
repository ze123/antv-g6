/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var Layout = require('./layout');

var Util = require('../util/layout');

var Numeric = require('numericjs');
/**
 * mds 布局
 */


Layout.registerLayout('mds', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      center: [0, 0],
      // 布局中心
      linkDistance: 50 // 默认边长度

    };
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var edges = self.edges;
    var center = self.center;
    if (nodes.length === 0) return;else if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
    }
    var linkDistance = self.linkDistance; // the graph-theoretic distance (shortest path distance) matrix

    var adjMatrix = Util.getAdjMatrix({
      nodes: nodes,
      edges: edges
    }, false);
    var distances = Util.floydWarshall(adjMatrix);
    self.handleInfinity(distances);
    self.distances = distances; // scale the ideal edge length acoording to linkDistance

    var scaledD = Util.scaleMatrix(distances, linkDistance);
    self.scaledDistances = scaledD; // get positions by MDS

    var positions = self.runMDS();
    self.positions = positions;
    positions.forEach(function (p, i) {
      nodes[i].x = p[0] + center[0];
      nodes[i].y = p[1] + center[1];
    });
  },

  /**
   * mds 算法
   * @return {array} positions 计算后的节点位置数组
   */
  runMDS: function runMDS() {
    var self = this;
    var dimension = 2;
    var distances = self.scaledDistances; // square distances

    var M = Numeric.mul(-0.5, Numeric.pow(distances, 2)); // double centre the rows/columns

    function mean(A) {
      return Numeric.div(Numeric.add.apply(null, A), A.length);
    }

    var rowMeans = mean(M),
        colMeans = mean(Numeric.transpose(M)),
        totalMean = mean(rowMeans);

    for (var i = 0; i < M.length; ++i) {
      for (var j = 0; j < M[0].length; ++j) {
        M[i][j] += totalMean - rowMeans[i] - colMeans[j];
      }
    } // take the SVD of the double centred matrix, and return the
    // points from it


    var ret = Numeric.svd(M);
    var eigenValues = Numeric.sqrt(ret.S);
    return ret.U.map(function (row) {
      return Numeric.mul(row, eigenValues).splice(0, dimension);
    });
  },
  handleInfinity: function handleInfinity(distances) {
    var maxDistance = -999999;
    distances.forEach(function (row) {
      row.forEach(function (value) {
        if (value === Infinity) {
          return;
        }

        if (maxDistance < value) {
          maxDistance = value;
        }
      });
    });
    distances.forEach(function (row, i) {
      row.forEach(function (value, j) {
        if (value === Infinity) {
          distances[i][j] = maxDistance;
        }
      });
    });
  }
});