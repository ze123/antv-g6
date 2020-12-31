/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var Layout = require('../layout');

var Util = require('../../util/layout');

var RadialNonoverlapForce = require('./radialNonoverlapForce');

var MDS = require('./mds');

var isArray = require('@antv/util/lib/type/is-array');

var isNumber = require('@antv/util/lib/type/is-number');

function getWeightMatrix(M) {
  var rows = M.length;
  var cols = M[0].length;
  var result = [];

  for (var i = 0; i < rows; i++) {
    var row = [];

    for (var j = 0; j < cols; j++) {
      if (M[i][j] !== 0) row.push(1 / Math.pow(M[i][j], 2));else row.push(0);
    }

    result.push(row);
  }

  return result;
}

function getIndexById(array, id) {
  var index = -1;
  array.forEach(function (a, i) {
    if (a.id === id) {
      index = i;
      return;
    }
  });
  return index;
}
/**
 * 随机布局
 */


Layout.registerLayout('radial', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      center: [0, 0],
      // 布局中心
      maxIteration: 1000,
      // 停止迭代的最大迭代数
      focusNode: null,
      // 中心点，默认为数据中第一个点
      unitRadius: null,
      // 每一圈半径
      linkDistance: 50,
      // 默认边长度
      preventOverlap: false,
      // 是否防止重叠
      nodeSize: undefined,
      // 节点直径
      nodeSpacing: undefined,
      // 节点间距，防止节点重叠时节点之间的最小距离（两节点边缘最短距离）
      strictRadial: true,
      // 是否必须是严格的 radial 布局，即每一层的节点严格布局在一个环上。preventOverlap 为 true 时生效。
      maxPreventOverlapIteration: 200 // 防止重叠步骤的最大迭代次数

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

    if (nodes.length === 0) {
      return;
    } else if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      return;
    }

    var linkDistance = self.linkDistance; // layout

    var focusNode = self.focusNode;

    if (Util.isString(focusNode)) {
      var found = false;

      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === focusNode) {
          focusNode = nodes[i];
          self.focusNode = focusNode;
          found = true;
          i = nodes.length;
        }
      }

      if (!found) focusNode = null;
    } // default focus node


    if (!focusNode) {
      focusNode = nodes[0];
      if (!focusNode) return;
      self.focusNode = focusNode;
    } // the index of the focusNode in data


    var focusIndex = getIndexById(nodes, focusNode.id);
    self.focusIndex = focusIndex; // the graph-theoretic distance (shortest path distance) matrix

    var adjMatrix = Util.getAdjMatrix({
      nodes: nodes,
      edges: edges
    }, false);
    var D = Util.floydWarshall(adjMatrix);
    var maxDistance = self.maxToFocus(D, focusIndex); // replace first node in unconnected component to the circle at (maxDistance + 1)

    self.handleInfinity(D, focusIndex, maxDistance + 1);
    self.distances = D; // the shortest path distance from each node to focusNode

    var focusNodeD = D[focusIndex];
    var width = self.width;

    if (!width && typeof window !== 'undefined') {
      width = window.innerWidth;
    }

    var height = self.height;

    if (!height && typeof height !== 'undefined') {
      height = window.innerHeight;
    }

    var semiWidth = width - center[0] > center[0] ? center[0] : width - center[0];
    var semiHeight = height - center[1] > center[1] ? center[1] : height - center[1];

    if (semiWidth === 0) {
      semiWidth = width / 2;
    }

    if (semiHeight === 0) {
      semiHeight = height / 2;
    } // the maxRadius of the graph


    var maxRadius = semiHeight > semiWidth ? semiWidth : semiHeight;
    var maxD = Math.max.apply(Math, focusNodeD); // the radius for each nodes away from focusNode

    var radii = [];
    focusNodeD.forEach(function (value, i) {
      if (!self.unitRadius) {
        self.unitRadius = maxRadius / maxD;
      }

      radii[i] = value * self.unitRadius;
    });
    self.radii = radii;
    var eIdealD = self.eIdealDisMatrix(D, linkDistance, radii); // const eIdealD = scaleMatrix(D, linkDistance);

    self.eIdealDistances = eIdealD; // the weight matrix, Wij = 1 / dij^(-2)

    var W = getWeightMatrix(eIdealD);
    self.weights = W; // the initial positions from mds

    var mds = new MDS({
      distances: eIdealD,
      linkDistance: linkDistance,
      dimension: 2
    });
    var positions = mds.layout();
    positions.forEach(function (p) {
      if (isNaN(p[0])) p[0] = Math.random() * linkDistance;
      if (isNaN(p[1])) p[1] = Math.random() * linkDistance;
    });
    self.positions = positions;
    positions.forEach(function (p, i) {
      nodes[i].x = p[0] + center[0];
      nodes[i].y = p[1] + center[1];
    }); // move the graph to origin, centered at focusNode

    positions.forEach(function (p) {
      p[0] -= positions[focusIndex][0];
      p[1] -= positions[focusIndex][1];
    });
    self.run();
    var preventOverlap = self.preventOverlap;
    var nodeSize = self.nodeSize;
    var nodeSizeFunc;
    var strictRadial = self.strictRadial; // stagger the overlapped nodes

    if (preventOverlap) {
      var nodeSpacing = self.nodeSpacing;
      var nodeSpacingFunc;

      if (isNumber(nodeSpacing)) {
        nodeSpacingFunc = function nodeSpacingFunc() {
          return nodeSpacing;
        };
      } else if (typeof nodeSpacing === 'function') {
        nodeSpacingFunc = nodeSpacing;
      } else {
        nodeSpacingFunc = function nodeSpacingFunc() {
          return 0;
        };
      }

      if (!nodeSize) {
        nodeSizeFunc = function nodeSizeFunc(d) {
          if (d.size) {
            if (isArray(d.size)) {
              var res = d.size[0] > d.size[1] ? d.size[0] : d.size[1];
              return res + nodeSpacingFunc(d);
            }

            return d.size + nodeSpacingFunc(d);
          }

          return 10 + nodeSpacingFunc(d);
        };
      } else {
        if (isArray(nodeSize)) {
          nodeSizeFunc = function nodeSizeFunc(d) {
            var res = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
            return res + nodeSpacingFunc(d);
          };
        } else {
          nodeSizeFunc = function nodeSizeFunc(d) {
            return nodeSize + nodeSpacingFunc(d);
          };
        }
      }

      var nonoverlapForce = new RadialNonoverlapForce({
        nodeSizeFunc: nodeSizeFunc,
        adjMatrix: adjMatrix,
        positions: positions,
        radii: radii,
        height: height,
        width: width,
        strictRadial: strictRadial,
        focusID: focusIndex,
        iterations: self.maxPreventOverlapIteration || 200,
        k: positions.length / 4.5,
        nodes: nodes
      });
      positions = nonoverlapForce.layout();
    } // move the graph to center


    positions.forEach(function (p, i) {
      nodes[i].x = p[0] + center[0];
      nodes[i].y = p[1] + center[1];
    });
  },
  run: function run() {
    var self = this;
    var maxIteration = self.maxIteration;
    var positions = self.positions;
    var W = self.weights;
    var eIdealDis = self.eIdealDistances;
    var radii = self.radii;

    for (var i = 0; i <= maxIteration; i++) {
      var param = i / maxIteration;
      self.oneIteration(param, positions, radii, eIdealDis, W);
    }
  },
  oneIteration: function oneIteration(param, positions, radii, D, W) {
    var self = this;
    var vparam = 1 - param;
    var focusIndex = self.focusIndex;
    positions.forEach(function (v, i) {
      // v
      var originDis = Util.getEDistance(v, [0, 0]);
      var reciODis = originDis === 0 ? 0 : 1 / originDis;
      if (i === focusIndex) return;
      var xMolecule = 0;
      var yMolecule = 0;
      var denominator = 0;
      positions.forEach(function (u, j) {
        // u
        if (i === j) return; // the euclidean distance between v and u

        var edis = Util.getEDistance(v, u);
        var reciEdis = edis === 0 ? 0 : 1 / edis;
        var idealDis = D[j][i]; // same for x and y

        denominator += W[i][j]; // x

        xMolecule += W[i][j] * (u[0] + idealDis * (v[0] - u[0]) * reciEdis); // y

        yMolecule += W[i][j] * (u[1] + idealDis * (v[1] - u[1]) * reciEdis);
      });
      var reciR = radii[i] === 0 ? 0 : 1 / radii[i];
      denominator *= vparam;
      denominator += param * Math.pow(reciR, 2); // x

      xMolecule *= vparam;
      xMolecule += param * reciR * v[0] * reciODis;
      v[0] = xMolecule / denominator; // y

      yMolecule *= vparam;
      yMolecule += param * reciR * v[1] * reciODis;
      v[1] = yMolecule / denominator;
    });
  },
  eIdealDisMatrix: function eIdealDisMatrix() {
    var self = this;
    var D = self.distances;
    var linkDis = self.linkDistance;
    var radii = self.radii;
    var unitRadius = self.unitRadius;
    var result = [];
    D.forEach(function (row, i) {
      var newRow = [];
      row.forEach(function (v, j) {
        if (i === j) newRow.push(0);else if (radii[i] === radii[j]) {
          // i and j are on the same circle
          newRow.push(v * linkDis / (radii[i] / unitRadius));
        } else {
          // i and j are on different circle
          var link = (linkDis + unitRadius) / 2;
          newRow.push(v * link);
        }
      });
      result.push(newRow);
    });
    return result;
  },
  handleAbnormalMatrix: function handleAbnormalMatrix(adMatrix, focusIndex) {
    var rows = adMatrix.length; // 空行即代表该行是离散点，将单个离散点看作 focus 的邻居

    for (var i = 0; i < rows; i++) {
      if (adMatrix[i].length === 0) {
        adMatrix[i][focusIndex] = 1;
        adMatrix[focusIndex][i] = 1;
      }
    } // 如果第一行中有
    // let hasDis = true;
    // for (let j = 0; j < matrix[focusIndex].length; j++) {
    //   if (!matrix[focusIndex][j]) hasDis = false;
    // }
    // if (hasDis) {
    //   matrix[j][focusIndex] = 1;
    //   matrix[focusIndex][j] = 1;
    // }
    // if (emptyMatrix) {
    //   let value = 0;
    //   for (let i = 0; i < rows; i++) {
    //     for (let j = 0; j < rows; j++) {
    //       if (i === focusIndex || j === focusIndex) value = 1;
    //       matrix[i][j] = value;
    //       value = 0;
    //     }
    //     value = 0;
    //   }
    // }

  },
  handleInfinity: function handleInfinity(matrix, focusIndex, step) {
    var length = matrix.length; // 遍历 matrix 中遍历 focus 对应行

    for (var i = 0; i < length; i++) {
      // matrix 关注点对应行的 Inf 项
      if (matrix[focusIndex][i] === Infinity) {
        matrix[focusIndex][i] = step;
        matrix[i][focusIndex] = step; // 遍历 matrix 中的 i 行，i 行中非 Inf 项若在 focus 行为 Inf，则替换 focus 行的那个 Inf

        for (var j = 0; j < length; j++) {
          if (matrix[i][j] !== Infinity && matrix[focusIndex][j] === Infinity) {
            matrix[focusIndex][j] = step + matrix[i][j];
            matrix[j][focusIndex] = step + matrix[i][j];
          }
        }
      }
    } // 处理其他行的 Inf。根据该行对应点与 focus 距离以及 Inf 项点 与 focus 距离，决定替换值


    for (var _i = 0; _i < length; _i++) {
      if (_i === focusIndex) {
        continue;
      }

      for (var _j = 0; _j < length; _j++) {
        if (matrix[_i][_j] === Infinity) {
          var minus = Math.abs(matrix[focusIndex][_i] - matrix[focusIndex][_j]);
          minus = minus === 0 ? 1 : minus;
          matrix[_i][_j] = minus;
        }
      }
    }
  },
  maxToFocus: function maxToFocus(matrix, focusIndex) {
    var max = 0;

    for (var i = 0; i < matrix[focusIndex].length; i++) {
      if (matrix[focusIndex][i] === Infinity) continue;
      max = matrix[focusIndex][i] > max ? matrix[focusIndex][i] : max;
    }

    return max;
  }
});