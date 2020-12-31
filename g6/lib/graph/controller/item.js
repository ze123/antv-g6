var Util = require('../../util');

var Item = require('../../item');

var deepMix = require('@antv/util/lib/deep-mix');

var NODE = 'node';
var EDGE = 'edge';
var CFG_PREFIX = 'default';
var MAPPER_SUFFIX = 'Mapper';
var STATE_SUFFIX = 'stateStyles';
var hasOwnProperty = Object.hasOwnProperty;

var ItemController =
/*#__PURE__*/
function () {
  function ItemController(graph) {
    this.graph = graph;
  }

  var _proto = ItemController.prototype;

  _proto.addItem = function addItem(type, model) {
    var graph = this.graph;
    var parent = graph.get(type + 'Group') || graph.get('group');
    var upperType = Util.upperFirst(type);
    var item;
    var styles = graph.get(type + Util.upperFirst(STATE_SUFFIX)) || {};
    var defaultModel = graph.get(CFG_PREFIX + upperType);
    var mapper = graph.get(type + MAPPER_SUFFIX);

    if (mapper) {
      var mappedModel = mapper(model);

      if (mappedModel[STATE_SUFFIX]) {
        styles = mappedModel[STATE_SUFFIX];
        delete mappedModel[STATE_SUFFIX];
      } // 如果配置了 defaultEdge 或 defaultNode，则将默认配置的数据也合并进去


      model = deepMix({}, defaultModel, model, mappedModel);
    } else if (defaultModel) {
      // 很多布局会直接修改原数据模型，所以不能用 merge 的形式，逐个写入原 model 中
      Util.each(defaultModel, function (val, cfg) {
        if (!hasOwnProperty.call(model, cfg)) {
          if (Util.isObject(val)) {
            model[cfg] = Util.clone(val);
          } else {
            model[cfg] = defaultModel[cfg];
          }
        }
      });
    }

    graph.emit('beforeadditem', {
      type: type,
      model: model
    });

    if (type === EDGE) {
      var source = model.source;
      var target = model.target;

      if (source && Util.isString(source)) {
        source = graph.findById(source);
      }

      if (target && Util.isString(target)) {
        target = graph.findById(target);
      }

      if (!source || !target) {
        console.warn('The source or target node of edge ' + model.id + ' does not exist!');
        return;
      }

      item = new Item[upperType]({
        model: model,
        source: source,
        target: target,
        styles: styles,
        linkCenter: graph.get('linkCenter'),
        group: parent.addGroup()
      });
    } else {
      item = new Item[upperType]({
        model: model,
        styles: styles,
        group: parent.addGroup()
      });
    }

    graph.get(type + 's').push(item);
    graph.get('itemMap')[item.get('id')] = item;
    graph.autoPaint();
    graph.emit('afteradditem', {
      item: item,
      model: model
    });
    return item;
  };

  _proto.updateItem = function updateItem(item, cfg) {
    var graph = this.graph;

    if (Util.isString(item)) {
      item = graph.findById(item);
    }

    if (!item || item.destroyed) {
      return;
    } // 如果修改了与映射属性有关的数据项，映射的属性相应也需要变化


    var mapper = graph.get(item.getType() + MAPPER_SUFFIX);
    var model = item.getModel();

    if (mapper) {
      var result = deepMix({}, model, cfg);
      var mappedModel = mapper(result); // 将 update 时候用户传入的参数与mapperModel做deepMix，以便复用之前设置的参数值

      var newModel = deepMix({}, model, mappedModel, cfg);

      if (mappedModel[STATE_SUFFIX]) {
        item.set('styles', newModel[STATE_SUFFIX]);
        delete newModel[STATE_SUFFIX];
      }

      Util.each(newModel, function (val, key) {
        cfg[key] = val;
      });
    } else {
      // merge update传进来的对象参数，model中没有的数据不做处理，对象和字符串值也不做处理，直接替换原来的
      Util.each(cfg, function (val, key) {
        if (model[key]) {
          if (Util.isObject(val) && !Util.isArray(val)) {
            cfg[key] = Util.mix({}, model[key], cfg[key]);
          }
        }
      });
    }

    graph.emit('beforeupdateitem', {
      item: item,
      cfg: cfg
    });

    if (item.getType() === EDGE) {
      // 若是边要更新source || target, 为了不影响示例内部model，并且重新计算startPoint和endPoint，手动设置
      if (cfg.source) {
        var source = cfg.source;

        if (Util.isString(source)) {
          source = graph.findById(source);
        }

        item.setSource(source);
      }

      if (cfg.target) {
        var target = cfg.target;

        if (Util.isString(target)) {
          target = graph.findById(target);
        }

        item.setTarget(target);
      }
    }

    item.update(cfg);

    if (item.getType() === NODE) {
      var autoPaint = graph.get('autoPaint');
      graph.setAutoPaint(false);
      Util.each(item.getEdges(), function (edge) {
        graph.refreshItem(edge);
      });
      graph.setAutoPaint(autoPaint);
    }

    graph.autoPaint();
    graph.emit('afterupdateitem', {
      item: item,
      cfg: cfg
    });
  };

  _proto.removeItem = function removeItem(item) {
    var graph = this.graph;

    if (Util.isString(item)) {
      item = graph.findById(item);
    }

    if (!item || item.destroyed) {
      return;
    }

    graph.emit('beforeremoveitem', {
      item: item
    });
    var type = item.getType();
    var items = graph.get(item.getType() + 's');
    var index = items.indexOf(item);
    items.splice(index, 1);
    delete graph.get('itemMap')[item.get('id')];

    if (type === NODE) {
      // 若移除的是节点，需要将与之相连的边一同删除
      var edges = item.getEdges();

      for (var i = edges.length; i >= 0; i--) {
        graph.removeItem(edges[i]);
      }
    }

    item.destroy();
    graph.autoPaint();
    graph.emit('afterremoveitem', {
      item: item
    });
  };

  _proto.setItemState = function setItemState(item, state, enabled) {
    var graph = this.graph;

    if (item.hasState(state) === enabled) {
      return;
    }

    graph.emit('beforeitemstatechange', {
      item: item,
      state: state,
      enabled: enabled
    });
    item.setState(state, enabled);
    graph.autoPaint();
    graph.emit('afteritemstatechange', {
      item: item,
      state: state,
      enabled: enabled
    });
  };

  _proto.clearItemStates = function clearItemStates(item, states) {
    var graph = this.graph;

    if (Util.isString(item)) {
      item = graph.findById(item);
    }

    graph.emit('beforeitemstatesclear', {
      item: item,
      states: states
    });
    item.clearStates(states);
    graph.autoPaint();
    graph.emit('afteritemstatesclear', {
      item: item,
      states: states
    });
  };

  _proto.refreshItem = function refreshItem(item) {
    var graph = this.graph;

    if (Util.isString(item)) {
      item = graph.findById(item);
    }

    graph.emit('beforeitemrefresh', {
      item: item
    });
    item.refresh();
    graph.autoPaint();
    graph.emit('afteritemrefresh', {
      item: item
    });
  };

  _proto.changeItemVisibility = function changeItemVisibility(item, visible) {
    var self = this;
    var graph = self.graph;

    if (Util.isString(item)) {
      item = graph.findById(item);
    }

    graph.emit('beforeitemvisibilitychange', {
      item: item,
      visible: visible
    });
    item.changeVisibility(visible);

    if (item.getType() === NODE) {
      var autoPaint = graph.get('autoPaint');
      graph.setAutoPaint(false);
      Util.each(item.getEdges(), function (edge) {
        // 若隐藏节点，则将与之关联的边也隐藏
        // 若显示节点，则将与之关联的边也显示，但是需要判断边两端的节点都是可见的
        if (visible && !(edge.get('source').isVisible() && edge.get('target').isVisible())) {
          return;
        }

        self.changeItemVisibility(edge, visible);
      });
      graph.setAutoPaint(autoPaint);
    }

    graph.autoPaint();
    graph.emit('afteritemvisibilitychange', {
      item: item,
      visible: visible
    });
  };

  _proto.destroy = function destroy() {
    this.graph = null;
    this.destroyed = true;
  };

  return ItemController;
}();

module.exports = ItemController;