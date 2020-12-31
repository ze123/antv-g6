function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Hierarchy = require('@antv/hierarchy');

var Util = require('../util');

var Graph = require('./graph');

function indexOfChild(children, child) {
  var index = -1;
  Util.each(children, function (former, i) {
    if (child.id === former.id) {
      index = i;
      return false;
    }
  });
  return index;
}

var TreeGraph =
/*#__PURE__*/
function (_Graph) {
  _inheritsLoose(TreeGraph, _Graph);

  function TreeGraph(cfg) {
    var _this;

    _this = _Graph.call(this, cfg) || this; // 用于缓存动画结束后需要删除的节点

    _this.set('removeList', []);

    _this.set('layoutMethod', _this._getLayout());

    return _this;
  }

  var _proto = TreeGraph.prototype;

  _proto.getDefaultCfg = function getDefaultCfg() {
    var cfg = _Graph.prototype.getDefaultCfg.call(this); // 树图默认打开动画


    cfg.animate = true;
    return cfg;
  }
  /**
   * 根据data接口的数据渲染视图
   */
  ;

  _proto.render = function render() {
    var self = this;
    var data = self.get('data');

    if (!data) {
      throw new Error('data must be defined first');
    }

    self.clear();
    self.emit('beforerender');
    self.refreshLayout(this.get('fitView'));
    self.emit('afterrender');
  }
  /**
   * 添加子树到对应 id 的节点
   * @param {object} data 子树数据模型
   * @param {string} parent 子树的父节点id
   */
  ;

  _proto.addChild = function addChild(data, parent) {
    var self = this; // 将数据添加到源数据中，走changeData方法

    if (!Util.isString(parent)) {
      parent = parent.get('id');
    }

    var parentData = self.findDataById(parent);

    if (!parentData.children) {
      parentData.children = [];
    }

    parentData.children.push(data);
    self.changeData();
  } // 计算好layout的数据添加到graph中
  ;

  _proto._addChild = function _addChild(data, parent, animate) {
    var self = this;
    var model = data.data; // model 中应存储真实的数据，特别是真实的 children

    model.x = data.x;
    model.y = data.y;
    model.depth = data.depth;
    var node = self.addItem('node', model);

    if (parent) {
      node.set('parent', parent);

      if (animate) {
        var origin = parent.get('origin');

        if (origin) {
          node.set('origin', origin);
        } else {
          var parentModel = parent.getModel();
          node.set('origin', {
            x: parentModel.x,
            y: parentModel.y
          });
        }
      }

      var childrenList = parent.get('children');

      if (!childrenList) {
        parent.set('children', [node]);
      } else {
        childrenList.push(node);
      }

      self.addItem('edge', {
        source: parent,
        target: node,
        id: parent.get('id') + ':' + node.get('id')
      });
    } // 渲染到视图上应参考布局的children, 避免多绘制了收起的节点


    Util.each(data.children, function (child) {
      self._addChild(child, node, animate);
    });
    return node;
  }
  /**
   * 更新数据模型，差量更新并重新渲染
   * @param {object} data 数据模型
   */
  ;

  _proto.changeData = function changeData(data) {
    var self = this;

    if (data) {
      self.data(data);
      self.render();
    } else {
      self.refreshLayout(this.get('fitView'));
    }
  }
  /**
   * 更新源数据，差量更新子树
   * @param {object} data 子树数据模型
   * @param {string} parent 子树的父节点id
   */
  ;

  _proto.updateChild = function updateChild(data, parent) {
    var self = this; // 如果没有父节点或找不到该节点，是全量的更新，直接重置data

    if (!parent || !self.findById(parent)) {
      self.changeData(data);
      return;
    }

    var parentModel = self.findById(parent).getModel();
    var current = self.findById(data.id); // 如果不存在该节点，则添加

    if (!current) {
      if (!parentModel.children) {
        parentModel.children = [current];
      } else {
        parentModel.children.push(data);
      }
    } else {
      var index = indexOfChild(parentModel.children, data);
      parentModel.children[index] = data;
    }

    self.changeData();
  } // 将数据上的变更转换到视图上
  ;

  _proto._updateChild = function _updateChild(data, parent, animate) {
    var self = this;
    var current = self.findById(data.id); // 若子树不存在，整体添加即可

    if (!current) {
      self._addChild(data, parent, animate);

      return;
    } // 更新新节点下所有子节点


    Util.each(data.children, function (child) {
      self._updateChild(child, current, animate);
    }); // 用现在节点的children实例来删除移除的子节点

    var children = current.get('children');

    if (children) {
      var len = children.length;

      if (len > 0) {
        var child;

        for (var i = children.length - 1; i >= 0; i--) {
          child = children[i].getModel();

          if (indexOfChild(data.children, child) === -1) {
            self._removeChild(child.id, {
              x: data.x,
              y: data.y
            }, animate); // 更新父节点下缓存的子节点 item 实例列表


            children.splice(i, 1);
          }
        }
      }
    }

    var model = current.getModel();

    if (animate) {
      // 如果有动画，先缓存节点运动再更新节点
      current.set('origin', {
        x: model.x,
        y: model.y
      });
    }

    current.set('model', data.data);
    current.updatePosition({
      x: data.x,
      y: data.y
    });
  }
  /**
   * 删除子树
   * @param {string} id 子树根节点id
   */
  ;

  _proto.removeChild = function removeChild(id) {
    var self = this;
    var node = self.findById(id);

    if (!node) {
      return;
    }

    var parent = node.get('parent');

    if (parent && !parent.destroyed) {
      var siblings = self.findDataById(parent.get('id')).children;
      var index = indexOfChild(siblings, node.getModel());
      siblings.splice(index, 1);
    }

    self.changeData();
  } // 删除子节点Item对象
  ;

  _proto._removeChild = function _removeChild(id, to, animate) {
    var self = this;
    var node = self.findById(id);

    if (!node) {
      return;
    }

    Util.each(node.get('children'), function (child) {
      self._removeChild(child.getModel().id, to, animate);
    });

    if (animate) {
      var model = node.getModel();
      node.set('to', to);
      node.set('origin', {
        x: model.x,
        y: model.y
      });
      self.get('removeList').push(node);
    } else {
      self.removeItem(node);
    }
  }
  /**
   * 导出图数据
   * @return {object} data
   */
  ;

  _proto.save = function save() {
    return this.get('data');
  }
  /**
   * 根据id获取对应的源数据
   * @param {string|object} id 元素id
   * @param {object} parent 从哪个节点开始寻找，为空时从根节点开始查找
   * @return {object} 对应源数据
   */
  ;

  _proto.findDataById = function findDataById(id, parent) {
    var self = this;

    if (!parent) {
      parent = self.get('data');
    }

    if (id === parent.id) {
      return parent;
    }

    var result = null;
    Util.each(parent.children, function (child) {
      if (child.id === id) {
        result = child;
        return false;
      }

      result = self.findDataById(id, child);

      if (result) {
        return false;
      }
    });
    return result;
  }
  /**
   * 更改并应用树布局算法
   * @param {object} layout 布局算法
   */
  ;

  _proto.changeLayout = function changeLayout(layout) {
    var self = this;

    if (!layout) {
      console.warn('layout cannot be null');
      return;
    }

    self.set('layout', layout);
    self.set('layoutMethod', self._getLayout());
    self.refreshLayout();
  }
  /**
   * 根据目前的 data 刷新布局，更新到画布上。用于变更数据之后刷新视图。
   * @param {boolean} fitView 更新布局时是否需要适应窗口
   */
  ;

  _proto.refreshLayout = function refreshLayout(fitView) {
    var self = this;
    var data = self.get('data');
    var layoutData = self.get('layoutMethod')(data, self.get('layout'));
    var animate = self.get('animate');
    var autoPaint = self.get('autoPaint');
    self.emit('beforerefreshlayout', {
      data: data,
      layoutData: layoutData
    });
    self.setAutoPaint(false);

    self._updateChild(layoutData, null, animate);

    if (fitView) {
      self.get('viewController')._fitView();
    }

    if (!animate) {
      // 如果没有动画，目前仅更新了节点的位置，刷新一下边的样式
      self.refresh();
      self.paint();
    } else {
      self.layoutAnimate(layoutData, null);
    }

    self.setAutoPaint(autoPaint);
    self.emit('afterrefreshlayout', {
      data: data,
      layoutData: layoutData
    });
  }
  /**
   * 布局动画接口，用于数据更新时做节点位置更新的动画
   * @param {object} data 更新的数据
   * @param {function} onFrame 定义节点位置更新时如何移动
   * @param {number} duration 动画时间
   * @param {string} ease 指定动效
   * @param {function} callback 动画结束的回调
   * @param {number} delay 动画延迟执行(ms)
   */
  ;

  _proto.layoutAnimate = function layoutAnimate(data, _onFrame) {
    var _this2 = this;

    var self = this;
    this.setAutoPaint(false);
    var animateCfg = this.get('animateCfg');
    self.emit('beforeanimate', {
      data: data
    }); // 如果边中没有指定锚点，但是本身有锚点控制，在动画过程中保持锚点不变

    self.getEdges().forEach(function (edge) {
      var model = edge.get('model');

      if (!model.sourceAnchor) {
        model.sourceAnchor = edge.get('sourceAnchorIndex');
      }
    });
    this.get('canvas').animate({
      onFrame: function onFrame(ratio) {
        Util.traverseTree(data, function (child) {
          var node = self.findById(child.id); // 只有当存在node的时候才执行

          if (node) {
            var origin = node.get('origin');
            var model = node.get('model');

            if (!origin) {
              origin = {
                x: model.x,
                y: model.y
              };
              node.set('origin', origin);
            }

            if (_onFrame) {
              var attrs = _onFrame(node, ratio, origin, data);

              node.set('model', Util.mix(model, attrs));
            } else {
              model.x = origin.x + (child.x - origin.x) * ratio;
              model.y = origin.y + (child.y - origin.y) * ratio;
            }
          }
        });
        Util.each(self.get('removeList'), function (node) {
          var model = node.getModel();
          var from = node.get('origin');
          var to = node.get('to');
          model.x = from.x + (to.x - from.x) * ratio;
          model.y = from.y + (to.y - from.y) * ratio;
        });
        self.refreshPositions();
      }
    }, animateCfg.duration, animateCfg.ease, function () {
      Util.each(self.getNodes(), function (node) {
        node.set('origin', null);
      });
      Util.each(self.get('removeList'), function (node) {
        self.removeItem(node);
      });
      self.set('removeList', []);

      if (animateCfg.callback) {
        animateCfg.callback();
      }

      self.paint();

      _this2.setAutoPaint(true);

      self.emit('afteranimate', {
        data: data
      });
    }, animateCfg.delay);
  }
  /**
   * 立即停止布局动画
   */
  ;

  _proto.stopLayoutAnimate = function stopLayoutAnimate() {
    this.get('canvas').stopAnimate();
    this.emit('layoutanimateend', {
      data: this.get('data')
    });
    this.layoutAnimating = false;
  }
  /**
   * 是否在布局动画
   * @return {boolean} 是否有布局动画
   */
  ;

  _proto.isLayoutAnimating = function isLayoutAnimating() {
    return this.layoutAnimating;
  };

  _proto._getLayout = function _getLayout() {
    var layout = this.get('layout');

    if (!layout) {
      return null;
    }

    if (typeof layout === 'function') {
      return layout;
    }

    if (!layout.type) {
      layout.type = 'dendrogram';
    }

    if (!layout.direction) {
      layout.direction = 'TB';
    }

    if (layout.radial) {
      return function (data) {
        var layoutData = Hierarchy[layout.type](data, layout);
        Util.radialLayout(layoutData);
        return layoutData;
      };
    }

    return function (data) {
      return Hierarchy[layout.type](data, layout);
    };
  };

  return TreeGraph;
}(Graph);

module.exports = TreeGraph;