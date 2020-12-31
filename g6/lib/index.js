/**
 * @fileOverview entry file
 * @author huangtonger@aliyun.com
 */
var Global = require('./global');

var G = require('@antv/g/lib');

var Shape = require('./shape');

var Layout = require('./layout');

var Behaviors = require('./behavior');

var G6 = {
  Graph: require('./graph/graph'),
  TreeGraph: require('./graph/tree-graph'),
  Util: require('./util/'),
  G: G,
  Global: Global,
  Shape: Shape,
  Layout: Layout,
  registerNode: Shape.registerNode,
  registerEdge: Shape.registerEdge,
  registerBehavior: Behaviors.registerBehavior,
  registerLayout: Layout.registerLayout,
  version: Global.version
};
module.exports = G6;