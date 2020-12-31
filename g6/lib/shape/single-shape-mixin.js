/**
 * @fileOverview 自定义节点和边的过程中，发现大量重复代码
 * @author dxq613@gmail.com
 */
var Global = require('../global');

var Util = require('../util/index');

var _require = require('lodash'),
    get = _require.get,
    cloneDeep = _require.cloneDeep,
    merge = _require.merge;

var CLS_SHAPE_SUFFIX = '-shape';
var CLS_LABEL_SUFFIX = '-label'; // 单个 shape 带有一个 label，共用这段代码

var SingleShape = {
  // 默认样式及配置
  options: {},

  /**
  * 用户自定义节点或边的样式，初始渲染时使用
  * @override
  * @param  {Object} model 节点的配置项
  */
  getCustomConfig: function getCustomConfig()
  /* model */
  {},
  itemType: '',
  // node, edge, group, anchor 等

  /**
   * 绘制节点/边，包含文本
   * @override
   * @param  {Object} cfg 节点的配置项
   * @param  {G.Group} group 节点的容器
   * @return {G.Shape} 绘制的图形
   */
  draw: function draw(cfg, group) {
    var shape = this.drawShape(cfg, group);
    shape.set('className', this.itemType + CLS_SHAPE_SUFFIX);

    if (cfg.label) {
      var label = this.drawLabel(cfg, group);
      label.set('className', this.itemType + CLS_LABEL_SUFFIX);
    }

    return shape;
  },
  drawShape: function drawShape()
  /* cfg, group */
  {},
  drawLabel: function drawLabel(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultLabelCfg = this.options.labelCfg;
    var customLabelCfg = customOptions.labelCfg;
    var labelCfg = merge({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var labelStyle = this.getLabelStyle(cfg, labelCfg, group);
    var label = group.addShape('text', {
      attrs: labelStyle
    });
    return label;
  },
  getLabelStyleByPosition: function getLabelStyleByPosition()
  /* cfg, labelCfg, group */
  {},

  /**
  * 获取文本的配置项
  * @internal 用户创建和更新节点/边时，同时会更新文本
  * @param  {Object} cfg 节点的配置项
   * @param {Object} labelCfg 文本的配置项
  * @param {G.Group} group 父容器，label 的定位可能与图形相关
  * @return {Object} 图形的配置项
  */
  getLabelStyle: function getLabelStyle(cfg, labelCfg, group) {
    var calculateStyle = this.getLabelStyleByPosition(cfg, labelCfg, group);
    calculateStyle.text = cfg.label;
    var attrName = this.itemType + 'Label'; // 取 nodeLabel，edgeLabel 的配置项

    var defaultStyle = Global[attrName] ? Global[attrName].style : null;
    var labelStyle = Util.mix({}, defaultStyle, calculateStyle, labelCfg.style);
    return labelStyle;
  },

  /**
  * 获取图形的配置项
  * @internal 仅在定义这一类节点使用，用户创建和更新节点
  * @param  {Object} cfg 节点的配置项
  * @return {Object} 图形的配置项
  */
  getShapeStyle: function getShapeStyle(cfg) {
    return cfg.style;
  },

  /**
   * 更新节点，包含文本
   * @override
   * @param  {Object} cfg 节点/边的配置项
   * @param  {G6.Item} item 节点/边
   */
  update: function update(cfg, item) {
    var group = item.getContainer();
    var shapeClassName = this.itemType + CLS_SHAPE_SUFFIX;
    var shape = group.findByClassName(shapeClassName);
    var shapeStyle = this.getShapeStyle(cfg);
    shape && shape.attr(shapeStyle);
    var labelClassName = this.itemType + CLS_LABEL_SUFFIX;
    var label = group.findByClassName(labelClassName); // 此时需要考虑之前是否绘制了 label 的场景存在三种情况
    // 1. 更新时不需要 label，但是原先存在 label，此时需要删除
    // 2. 更新时需要 label, 但是原先不存在，创建节点
    // 3. 如果两者都存在，更新

    if (!cfg.label) {
      label && label.remove();
    } else {
      if (!label) {
        var newLabel = this.drawLabel(cfg, group);
        newLabel.set('className', labelClassName);
      } else {
        var labelCfg = cfg.labelCfg || {};
        var labelStyle = this.getLabelStyle(cfg, labelCfg, group);
        /**
         * fixme g中shape的rotate是角度累加的，不是label的rotate想要的角度
         * 由于现在label只有rotate操作，所以在更新label的时候如果style中有rotate就重置一下变换
         * 后续会基于g的Text复写一个Label出来处理这一类问题
         */

        label.resetMatrix();
        label.attr(labelStyle);
      }
    }
  },

  /**
   * 设置节点的状态，主要是交互状态，业务状态请在 draw 方法中实现
   * 单图形的节点仅考虑 selected、active 状态，有其他状态需求的用户自己复写这个方法
   * @override
   * @param  {String} name 状态名称
   * @param  {Object} value 状态值
   * @param  {G6.Item} item 节点
   */
  setState: function setState(name, value, item) {
    var shape = item.get('keyShape');

    if (!shape) {
      return;
    }

    var itemStateStyle = item.getStateStyle(name);
    var stateStyle = this.getStateStyle(name, value, item);
    var styles = merge({}, stateStyle, itemStateStyle);

    if (value) {
      // 如果设置状态,在原本状态上叠加绘图属性
      shape.attr(styles);
    } else {
      // 取消状态时重置所有状态，依次叠加仍有的状态
      var style = item.getCurrentStatesStyle(); // 如果默认状态下没有设置attr，在某状态下设置了，需要重置到没有设置的状态

      Util.each(styles, function (val, attr) {
        if (!style[attr]) {
          style[attr] = null;
        }
      });
      shape.attr(style);
    }
  },

  /**
   * 获取不同状态下的样式
   *
   * @param {string} name 状态名称
   * @param {boolean} value 是否启用该状态
   * @param {Item} item Node或Edge的实例
   * @return {object} 样式
   */
  getStateStyle: function getStateStyle(name, value, item) {
    var model = item.getModel();
    var customOptions = this.getCustomConfig(model) || {};
    var _this$options = this.options,
        defaultStyle = _this$options.style,
        defaultStateStyle = _this$options.stateStyles;
    var customStyle = customOptions.style,
        customStateStyle = customOptions.stateStyles;
    var stateStyles = merge({}, defaultStateStyle, customStateStyle);
    var currentStateStyle = defaultStyle;

    if (stateStyles[name]) {
      currentStateStyle = stateStyles[name];
    }

    if (value) {
      return merge({}, currentStateStyle, model.style);
    }

    var states = item.getStates();
    var resultStyle = merge({}, defaultStyle, customStyle);
    var style = cloneDeep(resultStyle);
    states.forEach(function (state) {
      merge(style, get(defaultStyle, state, {}), get(customStyle, state, {}), model.style);
    });
    return style;
  }
};
module.exports = SingleShape;