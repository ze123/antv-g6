/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */
var dagre = require('dagre');

var Layout = require('./layout');

var isArray = require('@antv/util/lib/type/is-array');
/**
 * 随机布局
 */


Layout.registerLayout('dagre', {
  getDefaultCfg: function getDefaultCfg() {
    return {
      rankdir: 'TB',
      // layout 方向, 可选 TB, BT, LR, RL
      align: undefined,
      // 节点对齐方式，可选 UL, UR, DL, DR
      nodeSize: undefined,
      // 节点大小
      nodesepFunc: function nodesepFunc() {
        return 50;
      },
      // 节点水平间距(px)
      ranksepFunc: function ranksepFunc() {
        return 50;
      },
      // 每一层节点之间间距
      nodesep: 50,
      // 节点水平间距(px)
      ranksep: 50,
      // 每一层节点之间间距
      controlPoints: true // 是否保留布局连线的控制点

    };
  },

  /**
   * 执行布局
   */
  execute: function execute() {
    var self = this;
    var nodes = self.nodes;
    var edges = self.edges;
    var g = new dagre.graphlib.Graph();
    var nodeSize = self.nodeSize;
    var nodeSizeFunc;

    if (!nodeSize) {
      nodeSizeFunc = function nodeSizeFunc(d) {
        if (d.size) {
          if (isArray(d.size)) {
            return d.size;
          }

          return [d.size, d.size];
        }

        return [40, 40];
      };
    } else if (isArray(nodeSize)) {
      nodeSizeFunc = function nodeSizeFunc() {
        return nodeSize;
      };
    } else {
      nodeSizeFunc = function nodeSizeFunc() {
        return [nodeSize, nodeSize];
      };
    }

    var horisep = self.nodesep;
    if (self.nodesepFunc) horisep = self.nodesepFunc;
    var vertisep = self.ranksep;
    if (self.ranksepFunc) vertisep = self.ranksepFunc;
    var rankdir = self.rankdir;

    if (rankdir === 'LR' || rankdir === 'RL') {
      horisep = self.ranksep;
      if (self.ranksepFunc) horisep = self.ranksepFunc;
      vertisep = self.nodesep;
      if (self.nodesepFunc) vertisep = self.nodesepFunc;
    }

    g.setDefaultEdgeLabel(function () {
      return {};
    });
    g.setGraph(self);
    nodes.forEach(function (node) {
      var size = nodeSizeFunc(node);
      var hori = horisep(node);
      var verti = vertisep(node);
      var width = size[0] + 2 * hori;
      var height = size[1] + 2 * verti;
      g.setNode(node.id, {
        width: width,
        height: height
      });
    });
    edges.forEach(function (edge) {
      g.setEdge(edge.source, edge.target);
    });
    dagre.layout(g);
    var coord;
    g.nodes().forEach(function (node, i) {
      coord = g.node(node);
      nodes[i].x = coord.x;
      nodes[i].y = coord.y;
    });
    g.edges().forEach(function (edge, i) {
      coord = g.edge(edge);
      edges[i].startPoint = coord.points[0];
      edges[i].endPoint = coord.points[coord.points.length - 1];

      if (self.controlPoints) {
        edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1);
      }
    });
  }
});