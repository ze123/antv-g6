function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Shape = require('../shape');

var deepMix = require('@antv/util/lib/deep-mix');

var Util = require('../../util');

var Global = require('../../global');
/**
 * 基本的椭圆，可以添加文本，默认文本居中
 */


Shape.registerNode('ellipse', {
  // 自定义节点时的配置
  options: {
    size: [120, 60],
    style: {
      x: 0,
      y: 0,
      stroke: Global.defaultShapeStrokeColor,
      fill: Global.defaultShapeFillColor,
      lineWidth: 1
    },
    // 文本样式配置
    labelCfg: {
      style: {
        fill: '#595959'
      }
    },
    stateStyles: {
      // 鼠标hover状态下的配置
      hover: {
        fillOpacity: 0.8
      },
      // 选中节点状态下的配置
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
    // 节点中icon配置
    icon: {
      // 是否显示icon，值为 false 则不渲染icon
      show: false,
      // icon的地址，字符串类型
      img: 'https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg',
      width: 36,
      height: 36
    }
  },
  shapeType: 'ellipse',
  // 文本位置
  labelPosition: 'center',
  drawShape: function drawShape(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultIcon = this.options.icon;
    var customIcon = customOptions.icon;
    var style = this.getShapeStyle(cfg);
    var icon = deepMix({}, defaultIcon, customIcon, cfg.icon);
    var keyShape = group.addShape('ellipse', {
      attrs: style
    });
    var width = icon.width,
        height = icon.height,
        show = icon.show;

    if (show) {
      var image = group.addShape('image', {
        attrs: _extends({
          x: -width / 2,
          y: -height / 2
        }, icon),
        className: 'ellipse-icon'
      });
      image.set('capture', false);
    }

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
    var rx = size[0] / 2;
    var ry = size[1] / 2;

    if (left) {
      // left circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: -rx,
          y: 0,
          r: markSize
        }),
        className: 'ellipse-mark-left',
        isAnchorPoint: true
      });
    }

    if (right) {
      // right circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: rx,
          y: 0,
          r: markSize
        }),
        className: 'ellipse-mark-right',
        isAnchorPoint: true
      });
    }

    if (top) {
      // top circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: 0,
          y: -ry,
          r: markSize
        }),
        className: 'ellipse-mark-top',
        isAnchorPoint: true
      });
    }

    if (bottom) {
      // bottom circle
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: 0,
          y: ry,
          r: markSize
        }),
        className: 'ellipse-mark-bottom',
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
    var rx = size[0] / 2;
    var ry = size[1] / 2;
    var styles = Util.mix({}, {
      x: 0,
      y: 0,
      rx: rx,
      ry: ry
    }, style);
    return styles;
  },
  update: function update(cfg, item) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var _this$options = this.options,
        defaultStyle = _this$options.style,
        defaultIcon = _this$options.icon,
        defaultLabelCfg = _this$options.labelCfg;
    var customStyle = customOptions.style,
        customIcon = customOptions.icon,
        customLabelCfg = customOptions.labelCfg;
    var style = deepMix({}, defaultStyle, customStyle, cfg.style);
    var icon = deepMix({}, defaultIcon, customIcon, cfg.icon);
    var size = this.getSize(cfg);
    var rx = size[0] / 2;
    var ry = size[1] / 2;
    var keyShape = item.get('keyShape');
    keyShape.attr(_extends({}, style, {
      rx: rx,
      ry: ry
    }));
    var group = item.getContainer();
    var labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var labelStyle = this.getLabelStyle(cfg, labelCfg, group);
    var text = group.findByClassName('node-label');

    if (text) {
      text.attr(_extends({}, labelStyle));
    }

    var ellipseIcon = group.findByClassName('ellipse-icon');
    var w = icon.width,
        h = icon.height;

    if (ellipseIcon) {
      ellipseIcon.attr(_extends({
        x: -w / 2,
        y: -h / 2
      }, icon));
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
        markStyles = _objectWithoutPropertiesLoose(linkPoints, ["size"]);

    var size = this.getSize(cfg);
    var rx = size[0] / 2;
    var ry = size[1] / 2;
    var markLeft = group.findByClassName('ellipse-mark-left');

    if (markLeft) {
      markLeft.attr(_extends({}, markStyles, {
        x: -rx,
        y: 0,
        r: markSize
      }));
    }

    var markRight = group.findByClassName('ellipse-mark-right');

    if (markRight) {
      markRight.attr(_extends({}, markStyles, {
        x: rx,
        y: 0,
        r: markSize
      }));
    }

    var markTop = group.findByClassName('ellipse-mark-top');

    if (markTop) {
      markTop.attr(_extends({}, markStyles, {
        x: 0,
        y: -ry,
        r: markSize
      }));
    }

    var markBottom = group.findByClassName('ellipse-mark-bottom');

    if (markBottom) {
      markBottom.attr(_extends({}, markStyles, {
        x: 0,
        y: ry,
        r: markSize
      }));
    }
  }
}, 'single-shape');