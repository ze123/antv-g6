function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var Shape = require('../shape');

var deepMix = require('@antv/util/lib/deep-mix');

var Util = require('../../util');

Shape.registerNode('modelRect', {
  // labelPosition: 'center',
  // 自定义节点时的配置
  options: {
    size: [185, 70],
    style: {
      radius: 5,
      stroke: '#69c0ff',
      fill: '#ffffff',
      lineWidth: 1,
      fillOpacity: 1
    },
    // 文本样式配置
    labelCfg: {
      style: {
        fill: '#595959',
        fontSize: 14
      },
      offset: 30
    },
    stateStyles: {
      // hover状态下的配置
      hover: {
        lineWidth: 2,
        stroke: '#1890ff',
        fill: '#e6f7ff'
      },
      // 节点选中状态下的配置
      selected: {
        lineWidth: 3,
        stroke: '#1890ff',
        fill: '#e6f7ff'
      }
    },
    preRect: {
      show: true,
      width: 4,
      fill: '#40a9ff',
      radius: 2
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
    logoIcon: {
      // 是否显示icon，值为 false 则不渲染icon
      show: true,
      x: 0,
      y: 0,
      // icon的地址，字符串类型
      img: 'https://gw.alipayobjects.com/zos/basement_prod/4f81893c-1806-4de4-aff3-9a6b266bc8a2.svg',
      width: 16,
      height: 16,
      // 用于调整图标的左右位置
      offset: 0
    },
    // 节点中表示状态的icon配置
    stateIcon: {
      // 是否显示icon，值为 false 则不渲染icon
      show: true,
      x: 0,
      y: 0,
      // icon的地址，字符串类型
      img: 'https://gw.alipayobjects.com/zos/basement_prod/300a2523-67e0-4cbf-9d4a-67c077b40395.svg',
      width: 16,
      height: 16,
      // 用于调整图标的左右位置
      offset: -5
    },
    // 连接点，默认为左右
    anchorPoints: [[0, 0.5], [1, 0.5]]
  },
  shapeType: 'modelRect',
  drawShape: function drawShape(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultPreRect = this.options.preRect;
    var customPreRect = customOptions.preRect;
    var style = this.getShapeStyle(cfg);
    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];
    var keyShape = group.addShape('rect', {
      attrs: style
    });
    var preRect = deepMix({}, defaultPreRect, customPreRect, cfg.preRect);

    var preRectShow = preRect.show,
        preRectStyle = _objectWithoutPropertiesLoose(preRect, ["show"]);

    if (preRectShow) {
      group.addShape('rect', {
        attrs: _extends({
          x: -width / 2,
          y: -height / 2,
          height: height
        }, preRectStyle),
        className: 'pre-rect'
      });
    }

    this.drawLogoIcon(cfg, group);
    this.drawStateIcon(cfg, group);
    this.drawLinkPoints(cfg, group);
    return keyShape;
  },

  /**
   * 绘制模型矩形左边的logo图标
   * @param {Object} cfg 数据配置项
   * @param {Group} group Group实例
   */
  drawLogoIcon: function drawLogoIcon(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultLogoIcon = this.options.logoIcon;
    var customLogoIcon = customOptions.logoIcon;
    var logoIcon = deepMix({}, defaultLogoIcon, customLogoIcon, cfg.logoIcon);
    var size = this.getSize(cfg);
    var width = size[0];

    if (logoIcon.show) {
      var w = logoIcon.width,
          h = logoIcon.height,
          x = logoIcon.x,
          y = logoIcon.y,
          offset = logoIcon.offset,
          logoIconStyle = _objectWithoutPropertiesLoose(logoIcon, ["width", "height", "x", "y", "offset"]);

      var image = group.addShape('image', {
        attrs: _extends({}, logoIconStyle, {
          x: x || -width / 2 + w + offset,
          y: y || -h / 2,
          width: w,
          height: h
        }),
        className: 'rect-logo-icon'
      });
      image.set('capture', false);
    }
  },

  /**
   * 绘制模型矩形右边的状态图标
   * @param {Object} cfg 数据配置项
   * @param {Group} group Group实例
   */
  drawStateIcon: function drawStateIcon(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultStateIcon = this.options.stateIcon;
    var customStateIcon = customOptions.stateIcon;
    var stateIcon = deepMix({}, defaultStateIcon, customStateIcon, cfg.stateIcon);
    var size = this.getSize(cfg);
    var width = size[0];

    if (stateIcon.show) {
      var w = stateIcon.width,
          h = stateIcon.height,
          x = stateIcon.x,
          y = stateIcon.y,
          offset = stateIcon.offset,
          iconStyle = _objectWithoutPropertiesLoose(stateIcon, ["width", "height", "x", "y", "offset"]);

      var image = group.addShape('image', {
        attrs: _extends({}, iconStyle, {
          x: x || width / 2 - w + offset,
          y: y || -h / 2,
          width: w,
          height: h
        }),
        className: 'rect-state-icon'
      });
      image.set('capture', false);
    }
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
  drawLabel: function drawLabel(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var _this$options = this.options,
        defaultLabelCfg = _this$options.labelCfg,
        defaultLogoIcon = _this$options.logoIcon;
    var customLabelCfg = customOptions.labelCfg,
        customLogoIcon = customOptions.logoIcon;
    var logoIcon = deepMix({}, defaultLogoIcon, customLogoIcon, cfg.logoIcon);
    var labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var size = this.getSize(cfg);
    var width = size[0];
    var label = null;
    var show = logoIcon.show,
        w = logoIcon.width;
    var offsetX = -width / 2 + labelCfg.offset;

    if (show) {
      offsetX = -width / 2 + w + labelCfg.offset;
    }

    var fontStyle = labelCfg.style;

    if (cfg.description) {
      label = group.addShape('text', {
        attrs: _extends({}, fontStyle, {
          y: -5,
          x: offsetX,
          text: cfg.label
        })
      });
      group.addShape('text', {
        attrs: {
          text: cfg.description,
          fontSize: 12,
          x: offsetX,
          y: 17,
          fill: '#bfbfbf'
        },
        className: 'rect-description'
      });
    } else {
      label = group.addShape('text', {
        attrs: _extends({}, fontStyle, {
          x: offsetX,
          y: 7,
          text: cfg.label
        })
      });
    }

    return label;
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
    var _this$options2 = this.options,
        defaultStyle = _this$options2.style,
        defaultLabelCfg = _this$options2.labelCfg,
        defaultPreRect = _this$options2.preRect,
        defaultLogoIcon = _this$options2.logoIcon,
        defaultStateIcon = _this$options2.stateIcon;
    var customStyle = customOptions.style,
        customLabelCfg = customOptions.labelCfg,
        customPreRect = customOptions.preRect,
        customLogoIcon = customOptions.logoIcon,
        customStateIcon = customOptions.stateIcon;
    var style = deepMix({}, defaultStyle, customStyle, cfg.style);
    var size = this.getSize(cfg);
    var width = size[0];
    var height = size[1];
    var keyShape = item.get('keyShape');
    keyShape.attr(_extends({}, style, {
      x: -width / 2,
      y: -height / 2,
      width: width,
      height: height
    }));
    var group = item.getContainer();
    var labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var text = group.findByClassName('node-label');
    var logoIcon = deepMix({}, defaultLogoIcon, customLogoIcon, cfg.logoIcon);
    var show = logoIcon.show,
        w = logoIcon.width;
    var offset = labelCfg.offset,
        fontStyle = labelCfg.style;
    var offsetX = -width / 2 + offset;

    if (show) {
      offsetX = -width / 2 + w + offset;
    }

    var descriptionText = group.findByClassName('rect-description');

    if (descriptionText) {
      // 正常情况下，如果descriptionText存在，text一定会存在，为了保证起见，多加一层判断
      if (text) {
        text.attr(_extends({}, fontStyle, {
          y: -5,
          x: offsetX
        }));
      }

      descriptionText.attr({
        x: offsetX,
        y: 17
      });
    } else {
      if (text) {
        text.attr(_extends({}, fontStyle, {
          x: offsetX,
          y: -5
        }));
      }
    }

    var preRectShape = group.findByClassName('pre-rect');

    if (preRectShape) {
      var preRect = deepMix({}, defaultPreRect, customPreRect, cfg.preRect);
      preRectShape.attr(_extends({}, preRect, {
        x: -width / 2,
        y: -height / 2,
        height: height
      }));
    }

    var logoIconShape = group.findByClassName('rect-logo-icon');

    if (logoIconShape) {
      var _w = logoIcon.width,
          h = logoIcon.height,
          x = logoIcon.x,
          y = logoIcon.y,
          _offset = logoIcon.offset,
          logoIconStyle = _objectWithoutPropertiesLoose(logoIcon, ["width", "height", "x", "y", "offset"]);

      logoIconShape.attr(_extends({}, logoIconStyle, {
        x: x || -width / 2 + _w + _offset,
        y: y || -h / 2,
        width: _w,
        height: h
      }));
    }

    var stateIconShape = group.findByClassName('rect-state-icon');

    if (stateIconShape) {
      var stateIcon = deepMix({}, defaultStateIcon, customStateIcon, cfg.stateIcon);

      var _w2 = stateIcon.width,
          _h = stateIcon.height,
          _x = stateIcon.x,
          _y = stateIcon.y,
          _offset2 = stateIcon.offset,
          stateIconStyle = _objectWithoutPropertiesLoose(stateIcon, ["width", "height", "x", "y", "offset"]);

      stateIconShape.attr(_extends({}, stateIconStyle, {
        x: _x || width / 2 - _w2 + _offset2,
        y: _y || -_h / 2,
        width: _w2,
        height: _h
      }));
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