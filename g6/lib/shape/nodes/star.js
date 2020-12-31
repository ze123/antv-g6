function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Shape = require('../shape');

var deepMix = require('@antv/util/lib/deep-mix');

var Global = require('../../global'); // 五角星shape


Shape.registerNode('star', {
  // 自定义节点时的配置
  options: {
    size: 60,
    style: {
      stroke: Global.defaultShapeStrokeColor,
      fill: Global.defaultShapeFillColor,
      lineWidth: 1
    },
    // 文本样式配置
    labelCfg: {
      style: {
        fill: '#595959'
      },
      offset: 0
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
      left: false,
      leftBottom: false,
      rightBottom: false,
      // circle的大小
      size: 3,
      lineWidth: 1,
      fill: '#fff',
      stroke: '#72CC4A'
    },
    // 节点中icon配置
    icon: {
      // 是否显示icon，值为 false 则不渲染icon
      show: false,
      // icon的地址，字符串类型
      img: 'https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg',
      width: 16,
      height: 16
    }
  },
  shapeType: 'star',
  // 文本位置
  labelPosition: 'center',
  drawShape: function drawShape(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultIcon = this.options.icon;
    var customIcon = customOptions.icon;
    var style = this.getShapeStyle(cfg);
    var icon = deepMix({}, defaultIcon, customIcon, cfg.icon);
    var keyShape = group.addShape('path', {
      attrs: style
    });
    var w = icon.width,
        h = icon.height,
        show = icon.show;

    if (show) {
      var image = group.addShape('image', {
        attrs: _extends({
          x: -w / 2,
          y: -h / 2
        }, icon),
        className: 'star-icon'
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
        leftBottom = linkPoints.leftBottom,
        rightBottom = linkPoints.rightBottom,
        markSize = linkPoints.size,
        markStyle = _objectWithoutPropertiesLoose(linkPoints, ["top", "left", "right", "leftBottom", "rightBottom", "size"]);

    var size = this.getSize(cfg);
    var outerR = size[0];

    if (right) {
      // right circle
      // up down left right 四个方向的坐标均不相同
      var x1 = Math.cos((18 + 72 * 0) / 180 * Math.PI) * outerR;
      var y1 = Math.sin((18 + 72 * 0) / 180 * Math.PI) * outerR;
      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: x1,
          y: -y1,
          r: markSize
        }),
        className: 'star-mark-right'
      });
    }

    if (top) {
      // up down left right 四个方向的坐标均不相同
      var _x = Math.cos((18 + 72 * 1) / 180 * Math.PI) * outerR;

      var _y = Math.sin((18 + 72 * 1) / 180 * Math.PI) * outerR; // top circle


      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: _x,
          y: -_y,
          r: markSize
        }),
        className: 'star-mark-top'
      });
    }

    if (left) {
      // up down left right 四个方向的坐标均不相同
      var _x2 = Math.cos((18 + 72 * 2) / 180 * Math.PI) * outerR;

      var _y2 = Math.sin((18 + 72 * 2) / 180 * Math.PI) * outerR; // left circle


      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: _x2,
          y: -_y2,
          r: markSize
        }),
        className: 'star-mark-left'
      });
    }

    if (leftBottom) {
      // up down left right 四个方向的坐标均不相同
      var _x3 = Math.cos((18 + 72 * 3) / 180 * Math.PI) * outerR;

      var _y3 = Math.sin((18 + 72 * 3) / 180 * Math.PI) * outerR; // left bottom circle


      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: _x3,
          y: -_y3,
          r: markSize
        }),
        className: 'star-mark-left-bottom'
      });
    }

    if (rightBottom) {
      // up down left right 四个方向的坐标均不相同
      var _x4 = Math.cos((18 + 72 * 4) / 180 * Math.PI) * outerR;

      var _y4 = Math.sin((18 + 72 * 4) / 180 * Math.PI) * outerR; // left bottom circle


      group.addShape('circle', {
        attrs: _extends({}, markStyle, {
          x: _x4,
          y: -_y4,
          r: markSize
        }),
        className: 'star-mark-right-bottom'
      });
    }
  },
  getPath: function getPath(cfg) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var customInnerR = customOptions.innerR;
    var size = this.getSize(cfg);
    var outerR = size[0];
    var defaultInnerR = outerR * 3 / 8;
    var innerR = cfg.innerR || customInnerR || defaultInnerR;
    var path = [];

    for (var i = 0; i < 5; i++) {
      var x1 = Math.cos((18 + 72 * i) / 180 * Math.PI) * outerR;
      var y1 = Math.sin((18 + 72 * i) / 180 * Math.PI) * outerR;
      var x2 = Math.cos((54 + 72 * i) / 180 * Math.PI) * innerR;
      var y2 = Math.sin((54 + 72 * i) / 180 * Math.PI) * innerR;

      if (i === 0) {
        path.push(['M', x1, -y1]);
      } else {
        path.push(['L', x1, -y1]);
      }

      path.push(['L', x2, -y2]);
    }

    path.push(['Z']);
    return path;
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
    var path = this.getPath(cfg);

    var styles = _extends({
      path: path
    }, style);

    return styles;
  },
  update: function update(cfg, item) {
    var group = item.getContainer();
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
    var keyShape = item.get('keyShape');
    var path = this.getPath(cfg);
    keyShape.attr(_extends({
      path: path
    }, style));
    var labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg);
    var labelStyle = this.getLabelStyle(cfg, labelCfg, group);
    var text = group.findByClassName('node-label');

    if (text) {
      text.attr(_extends({}, labelStyle));
    }

    var starIcon = group.findByClassName('star-icon');

    if (starIcon) {
      var w = icon.width,
          h = icon.height;
      starIcon.attr(_extends({
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
        markStyle = _objectWithoutPropertiesLoose(linkPoints, ["size"]);

    var size = this.getSize(cfg);
    var outerR = size[0];
    var markRight = group.findByClassName('star-mark-right');

    if (markRight) {
      var x = Math.cos((18 + 72 * 0) / 180 * Math.PI) * outerR;
      var y = Math.sin((18 + 72 * 0) / 180 * Math.PI) * outerR;
      markRight.attr(_extends({}, markStyle, {
        x: x,
        y: -y,
        r: markSize
      }));
    }

    var markTop = group.findByClassName('star-mark-top');

    if (markTop) {
      var _x5 = Math.cos((18 + 72 * 1) / 180 * Math.PI) * outerR;

      var _y5 = Math.sin((18 + 72 * 1) / 180 * Math.PI) * outerR; // top circle


      markTop.attr(_extends({}, markStyle, {
        x: _x5,
        y: -_y5,
        r: markSize
      }));
    }

    var markLeft = group.findByClassName('star-mark-left');

    if (markLeft) {
      var _x6 = Math.cos((18 + 72 * 2) / 180 * Math.PI) * outerR;

      var _y6 = Math.sin((18 + 72 * 2) / 180 * Math.PI) * outerR; // left circle


      markLeft.attr(_extends({}, markStyle, {
        x: _x6,
        y: -_y6,
        r: markSize
      }));
    }

    var markLeftBottom = group.findByClassName('star-mark-left-bottom');

    if (markLeftBottom) {
      var _x7 = Math.cos((18 + 72 * 3) / 180 * Math.PI) * outerR;

      var _y7 = Math.sin((18 + 72 * 3) / 180 * Math.PI) * outerR; // bottom circle


      markLeftBottom.attr(_extends({}, markStyle, {
        x: _x7,
        y: -_y7,
        r: markSize
      }));
    }

    var markRightBottom = group.findByClassName('star-mark-right-bottom');

    if (markRightBottom) {
      var _x8 = Math.cos((18 + 72 * 4) / 180 * Math.PI) * outerR;

      var _y8 = Math.sin((18 + 72 * 4) / 180 * Math.PI) * outerR; // bottom circle


      markRightBottom.attr(_extends({}, markStyle, {
        x: _x8,
        y: -_y8,
        r: markSize
      }));
    }
  }
}, 'single-shape');