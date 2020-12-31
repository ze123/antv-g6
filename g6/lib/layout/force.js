/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var d3Force = require('d3-force');

var isArray = require('@antv/util/lib/type/is-array');

var isNumber = require('@antv/util/lib/type/is-number');

var isFunction = require('@antv/util/lib/type/is-function');

var Layout = require('./layout');

var Util = require('../util/layout');

var layoutConst = require('./worker/layoutConst');

var LAYOUT_MESSAGE = layoutConst.LAYOUT_MESSAGE;
/**
 * 经典力导布局 force-directed
 */

Layout.registerLayout('force', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      center: [0, 0],
      // 向心力作用点
      nodeStrength: null,
      // 节点作用力
      preventOverlap: false,
      // 是否防止节点相互覆盖
      nodeSize: undefined,
      // 节点大小 / 直径，用于防止重叠时的碰撞检测
      nodeSpacing: undefined,
      // 节点间距，防止节点重叠时节点之间的最小距离（两节点边缘最短距离）
      edgeStrength: null,
      // 边的作用力, 默认为根据节点的入度出度自适应
      linkDistance: 50,
      // 默认边长度
      forceSimulation: null,
      // 自定义 force 方法
      alphaDecay: 0.028,
      // 迭代阈值的衰减率 [0, 1]，0.028 对应最大迭代数为 300
      alphaMin: 0.001,
      // 停止迭代的阈值
      alpha: 0.3,
      // 当前阈值
      collideStrength: 1,
      // 防止重叠的力强度
      tick: function tick() {},
      onLayoutEnd: function onLayoutEnd() {},
      // 布局完成回调
      onTick: function onTick() {},
      // 每一迭代布局回调
      // 是否启用web worker。前提是在web worker里执行布局，否则无效
      workerEnabled: false
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
    self.ticking = false;
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var edges = self.edges; // 如果正在布局，忽略布局请求

    if (self.ticking) {
      return;
    }

    var simulation = self.forceSimulation;
    var alphaMin = self.alphaMin;
    var alphaDecay = self.alphaDecay;
    var alpha = self.alpha;

    if (!simulation) {
      try {
        // 定义节点的力
        var nodeForce = d3Force.forceManyBody();

        if (self.nodeStrength) {
          nodeForce.strength(self.nodeStrength);
        }

        simulation = d3Force.forceSimulation().nodes(nodes).force('center', d3Force.forceCenter(self.center[0], self.center[1])).force('charge', nodeForce).alpha(alpha).alphaDecay(alphaDecay).alphaMin(alphaMin);

        if (self.preventOverlap) {
          self.overlapProcess(simulation);
        } // 如果有边，定义边的力


        if (edges) {
          // d3 的 forceLayout 会重新生成边的数据模型，为了避免污染源数据
          var d3Edges = edges.map(function (edge) {
            return {
              id: edge.id,
              source: edge.source,
              target: edge.target
            };
          });
          var edgeForce = d3Force.forceLink().id(function (d) {
            return d.id;
          }).links(d3Edges);

          if (self.edgeStrength) {
            edgeForce.strength(self.edgeStrength);
          }

          if (self.linkDistance) {
            edgeForce.distance(self.linkDistance);
          }

          simulation.force('link', edgeForce);
        }

        if (self.workerEnabled && !isInWorker()) {
          // 如果不是运行在web worker里，不用web worker布局
          self.workerEnabled = false;
          console.warn('workerEnabled option is only supported when running in web worker.');
        }

        if (!self.workerEnabled) {
          simulation.on('tick', function () {
            self.tick();
          }).on('end', function () {
            self.ticking = false;
            self.onLayoutEnd && self.onLayoutEnd();
          });
          self.ticking = true;
        } else {
          simulation.stop();
          var totalTicks = getSimulationTicks(simulation);

          for (var currentTick = 1; currentTick <= totalTicks; currentTick++) {
            simulation.tick(); // currentTick starts from 1.

            postMessage({
              type: LAYOUT_MESSAGE.TICK,
              currentTick: currentTick,
              totalTicks: totalTicks,
              nodes: nodes
            });
          }

          self.ticking = false;
        }

        self.forceSimulation = simulation;
      } catch (e) {
        self.ticking = false;
        console.warn(e);
      }
    } else {
      if (self.preventOverlap) {
        self.overlapProcess(simulation);
      }

      simulation.alpha(alpha).restart();
      this.ticking = true;
    }
  },

  /**
   * 防止重叠
   * @param {object} simulation 力模拟模型
   */
  overlapProcess: function overlapProcess(simulation) {
    var self = this;
    var nodeSize = self.nodeSize;
    var nodeSizeFunc;
    var nodeSpacing = self.nodeSpacing;
    var nodeSpacingFunc;
    var collideStrength = self.collideStrength;

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
            return res / 2 + nodeSpacingFunc(d);
          }

          return d.size / 2 + nodeSpacingFunc(d);
        }

        return 10 + nodeSpacingFunc(d);
      };
    } else if (isFunction(nodeSize)) {
      nodeSizeFunc = nodeSize;
    } else if (!isNaN(nodeSize)) {
      var radius = nodeSize / 2;

      nodeSizeFunc = function nodeSizeFunc(d) {
        return radius + nodeSpacingFunc(d);
      };
    } else if (isArray(nodeSize)) {
      var larger = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];

      var _radius = larger / 2;

      nodeSizeFunc = function nodeSizeFunc(d) {
        return _radius + nodeSpacingFunc(d);
      };
    } // forceCollide's parameter is a radius


    simulation.force('collisionForce', d3Force.forceCollide(nodeSizeFunc).strength(collideStrength));
  },

  /**
   * 更新布局配置，但不执行布局
   * @param {object} cfg 需要更新的配置项
   */
  updateCfg: function updateCfg(cfg) {
    var self = this;

    if (self.ticking) {
      self.forceSimulation.stop();
      self.ticking = false;
    }

    self.forceSimulation = null;
    Util.mix(self, cfg);
  },
  destroy: function destroy() {
    var self = this;

    if (self.ticking) {
      self.forceSimulation.stop();
      self.ticking = false;
    }

    self.nodes = null;
    self.edges = null;
    self.destroyed = true;
  }
}); // Return total ticks of d3-force simulation

function getSimulationTicks(simulation) {
  var alphaMin = simulation.alphaMin();
  var alphaTarget = simulation.alphaTarget();
  var alpha = simulation.alpha();
  var totalTicksFloat = Math.log((alphaMin - alphaTarget) / (alpha - alphaTarget)) / Math.log(1 - simulation.alphaDecay());
  var totalTicks = Math.ceil(totalTicksFloat);
  return totalTicks;
} // 判断是否运行在web worker里


function isInWorker() {
  // eslint-disable-next-line no-undef
  return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}