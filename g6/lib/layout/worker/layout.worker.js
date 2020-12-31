/**
 * @fileoverview web worker for layout
 * @author changzhe.zb@antfin.com
 */
var Layout = require('..');

var layoutConst = require('./layoutConst');

var LAYOUT_MESSAGE = layoutConst.LAYOUT_MESSAGE;

function isLayoutMessage(event) {
  var type = event.data.type;
  return type === LAYOUT_MESSAGE.RUN;
}

function handleLayoutMessage(event) {
  var type = event.data.type;

  switch (type) {
    case LAYOUT_MESSAGE.RUN:
      {
        var _event$data = event.data,
            nodes = _event$data.nodes,
            edges = _event$data.edges,
            _event$data$layoutCfg = _event$data.layoutCfg,
            layoutCfg = _event$data$layoutCfg === void 0 ? {} : _event$data$layoutCfg;
        var layoutType = layoutCfg.type;
        var LayoutClass = Layout[layoutType];

        if (!LayoutClass) {
          postMessage({
            type: LAYOUT_MESSAGE.ERROR,
            message: "layout " + layoutType + " not found"
          });
          break;
        }

        var layoutMethod = new LayoutClass(layoutCfg);
        layoutMethod.init({
          nodes: nodes,
          edges: edges
        });
        layoutMethod.execute();
        postMessage({
          type: LAYOUT_MESSAGE.END,
          nodes: nodes
        });
        layoutMethod.destroy();
        break;
      }

    default:
      break;
  }
} // listen to message posted to web worker


self.onmessage = function (event) {
  if (isLayoutMessage(event)) {
    handleLayoutMessage(event);
  }
};