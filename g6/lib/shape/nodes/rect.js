function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var Shape = require('../shape');

var deepMix = require('@antv/util/lib/deep-mix');

var Util = require('../../util');

var Global = require('../../global');

Shape.registerNode('rect', {
  // 自定义节点时的配置
  options: {
    size: [100, 30],
    style: {
      radius: 0,
      stroke: Global.defaultShapeStrokeColor,
      fill: Global.defaultShapeFillColor,
      lineWidth: 1,
      fillOpacity: 1
    },
    // 文本样式配置
    labelCfg: {
      style: {
        fill: '#595959',
        fontSize: 12
      }
    },
    stateStyles: {
      // hover状态下的配置
      hover: {
        fillOpacity: 0.8
      },
      // 节点选中状态下的配置
      selected: {
        lineWidth: 3
      }
    },
    // 节点上左右上下四个方向上的链接circle配置
    linkPoints: {
      top: false,
      right: false,
      bottom: false,
      left: false,
      // circle的大小
      size: 3,
      lineWidth: 1,
      fill: '#72CC4A',
      stroke: '#72CC4A'
    },
    // 连接点，默认为左右
    markPoints: [[0, 0.5], [1, 0.5]]
  },
  shapeType: 'rect',
  drawShape: function drawShape(cfg, group) {
    var style = this.getShapeStyle(cfg);
    var keyShape = group.addShape('rect', {
      attrs: style,
      className: 'rect-keyShape'
    });
    this.drawLinkPoints(cfg, group);
    return keyShape;
  },

  /**
   * 绘制节点上的LinkPoints
   * @param {Object} cfg data数据配置项
   * @param {Group} group Group实例
   */
  drawLinkPoints: function drawLinkPoints(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultLinkPoints = this.options.linkPoints;
    var customLinkPoints = customOptions.linkPoints;
    var linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints);

    var top = linkPoints.top,
        left = linkPoints.left,
        right = linkPoints.right,
        bottom = linkPoints.bottom,
        markSize = linkPoints.size,
        markStyle = _objectWithoutPropertiesLoose(linkPoints, ["top", "left", "right", "bottom", "size"]);

    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];

    if (left) {
      // left circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: -width / 2,
          y: 0,
          r: markSize
        }),
        className: 'rect-mark-left',
        isAnchorPoint: true
      });
    }

    if (right) {
      // right circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: width / 2,
          y: 0,
          r: markSize
        }),
        className: 'rect-mark-right',
        isAnchorPoint: true
      });
    }

    if (top) {
      // top circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: 0,
          y: -height / 2,
          r: markSize
        }),
        className: 'rect-mark-top',
        isAnchorPoint: true
      });
    }

    if (bottom) {
      // bottom circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: 0,
          y: height / 2,
          r: markSize
        }),
        className: 'rect-mark-bottom',
        isAnchorPoint: true
      });
    }
  },

  /**
   * 获取节点的样式，供基于该节点自定义时使用
   * @param {Object} cfg 节点数据模型
   * @return {Object} 节点的样式
   */
  getShapeStyle: function getShapeStyle(cfg) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultStyle = this.options.style;
    var customStyle = customOptions.style;
    var strokeStyle = {
      stroke: cfg.color
    }; // 如果设置了color，则覆盖默认的stroke属性

    var style = deepMix({}, defaultStyle, customStyle, strokeStyle, cfg.style);
    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];
    var styles = Util.mix({}, {
      x: -width / 2,
      y: -height / 2,
      width: width,
      height: height
    }, style);
    return styles;
  },
  update: function update(cfg, item) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var _this$options = this.options,
        defaultStyle = _this$options.style,
        defaultLabelCfg = _this$options.labelCfg;
    var customStyle = customOptions.style,
        customLabelCfg = customOptions.labelCfg;
    var style = deepMix({}, defaultStyle, customStyle, cfg.style);
    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];
    var keyShape = item.get('keyShape');
    keyShape.attr(_extends({
      x: -width / 2,
      y: -height / 2,
      width: width,
      height: height
    }, style));
    var group = item.getContainer();
    var labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var labelStyle = this.getLabelStyle(cfg, labelCfg, group);
    var text = group.findByClassName('node-label');

    if (text) {
      text.attr(_extends({}, labelStyle));
    }

    this.updateLinkPoints(cfg, group);
  },

  /**
   * 更新linkPoints
   * @param {Object} cfg 节点数据配置项
   * @param {Group} group Item所在的group
   */
  updateLinkPoints: function updateLinkPoints(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultLinkPoints = this.options.linkPoints;
    var customLinkPoints = customOptions.linkPoints;
    var linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints);
    var markSize = linkPoints.size,
        markFill = linkPoints.fill,
        markStroke = linkPoints.stroke,
        borderWidth = linkPoints.lineWidth;
    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];
    var markLeft = group.findByClassName('rect-mark-left');

    if (markLeft) {
      markLeft.attr({
        x: -width / 2,
        y: 0,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      });
    }

    var markRight = group.findByClassName('rect-mark-right');

    if (markRight) {
      markRight.attr({
        x: width / 2,
        y: 0,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      });
    }

    var markTop = group.findByClassName('rect-mark-top');

    if (markTop) {
      markTop.attr({
        x: 0,
        y: -height / 2,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      });
    }

    var markBottom = group.findByClassName('rect-mark-bottom');

    if (markBottom) {
      markBottom.attr({
        x: 0,
        y: height / 2,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      });
    }
  }
}, 'single-shape');