/**
 * @fileoverview util for layout
 * @author changzhe.zb@antfin.com
 */
var layoutUtil = {
  mix: require('@antv/util/lib/mix'),
  augment: require('@antv/util/lib/augment'),
  isString: require('@antv/util/lib/type/is-string'),
  getAdjMatrix: function getAdjMatrix(data, directed) {
    var nodes = data.nodes;
    var edges = data.edges;
    var matrix = []; // map node with index in data.nodes

    var nodeMap = new Map();
    nodes.forEach(function (node, i) {
      nodeMap.set(node.id, i);
      var row = [];
      matrix.push(row);
    }); // const n = nodes.length;

    edges.forEach(function (e) {
      var source = e.source;
      var target = e.target;
      var sIndex = nodeMap.get(source);
      var tIndex = nodeMap.get(target);
      matrix[sIndex][tIndex] = 1;
      if (!directed) matrix[tIndex][sIndex] = 1;
    });
    return matrix;
  },

  /**
   * Floyd Warshall algorithm for shortest path distances matrix
   * @param  {array} adjMatrix   adjacency matrix
   * @return {array} distances   shortest path distances matrix
   */
  floydWarshall: function floydWarshall(adjMatrix) {
    // initialize
    var dist = [];
    var size = adjMatrix.length;

    for (var i = 0; i < size; i += 1) {
      dist[i] = [];

      for (var j = 0; j < size; j += 1) {
        if (i === j) {
          dist[i][j] = 0;
        } else if (adjMatrix[i][j] === 0 || !adjMatrix[i][j]) {
          dist[i][j] = Infinity;
        } else {
          dist[i][j] = adjMatrix[i][j];
        }
      }
    } // floyd


    for (var k = 0; k < size; k += 1) {
      for (var _i = 0; _i < size; _i += 1) {
        for (var _j = 0; _j < size; _j += 1) {
          if (dist[_i][_j] > dist[_i][k] + dist[k][_j]) {
            dist[_i][_j] = dist[_i][k] + dist[k][_j];
          }
        }
      }
    }

    return dist;
  },
  getEDistance: function getEDistance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
  },
  scaleMatrix: function scaleMatrix(matrix, scale) {
    var result = [];
    matrix.forEach(function (row) {
      var newRow = [];
      row.forEach(function (v) {
        newRow.push(v * scale);
      });
      result.push(newRow);
    });
    return result;
  }
};
module.exports = layoutUtil;