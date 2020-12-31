function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Shape = require('../shape');

var deepMix = require('@antv/util/lib/deep-mix');

var Global = require('../../global'); // 菱形shape


Shape.registerNode('triangle', {
  // 自定义节点时的配置
  options: {
    size: 40,
    direction: 'up',
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
      offset: 15
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
      size: 5,
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
      height: 16,
      offset: 6
    }
  },
  shapeType: 'triangle',
  // 文本位置
  labelPosition: 'bottom',
  drawShape: function drawShape(cfg, group) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var _this$options = this.options,
        defaultIcon = _this$options.icon,
        defaultDirection = _this$options.direction;
    var customIcon = customOptions.icon,
        customDirection = customOptions.direction;
    var style = this.getShapeStyle(cfg);
    var icon = deepMix({}, defaultIcon, customIcon, cfg.icon);
    var direction = cfg.direction || customDirection || defaultDirection;
    var keyShape = group.addShape('path', {
      attrs: style
    });
    var w = icon.width,
        h = icon.height,
        show = icon.show,
        offset = icon.offset;

    if (show) {
      var iconW = -w / 2;
      var iconH = -h / 2;

      if (direction === 'up' || direction === 'down') {
        iconH += offset;
      }

      if (direction === 'left' || direction === 'right') {
        iconW += offset;
      }

      var image = group.addShape('image', {
        attrs: _extends({
          x: iconW,
          y: iconH
        }, icon),
        className: 'triangle-icon'
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
    var _this$options2 = this.options,
        defaultLinkPoints = _this$options2.linkPoints,
        defaultDirection = _this$options2.direction;
    var customLinkPoints = customOptions.linkPoints,
        customDirection = customOptions.direction;
    var linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints);
    var direction = cfg.direction || customDirection || defaultDirection;

    var top = linkPoints.top,
        left = linkPoints.left,
        right = linkPoints.right,
        bottom = linkPoints.bottom,
        markSize = linkPoints.size,
        markStyle = _objectWithoutPropertiesLoose(linkPoints, ["top", "left", "right", "bottom", "size"]);

    var size = this.getSize(cfg);
    var len = size[0];

    if (left) {
      // up down left right 四个方向的坐标均不相同
      var leftPos = null;
      var diffY = len * Math.sin(1 / 3 * Math.PI);
      var r = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        leftPos = [-r, diffY];
      } else if (direction === 'down') {
        leftPos = [-r, -diffY];
      } else if (direction === 'left') {
        leftPos = [-r, r - diffY];
      }

      if (leftPos) {
        // left circle
        group.addShape('circle', {
          attrs: _extends({}, markStyle, {
            x: leftPos[0],
            y: leftPos[1],
            r: markSize
          }),
          className: 'triangle-mark-left'
        });
      }
    }

    if (right) {
      // right circle
      // up down left right 四个方向的坐标均不相同
      var rightPos = null;

      var _diffY = len * Math.sin(1 / 3 * Math.PI);

      var _r = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        rightPos = [_r, _diffY];
      } else if (direction === 'down') {
        rightPos = [_r, -_diffY];
      } else if (direction === 'right') {
        rightPos = [_r, _r - _diffY];
      }

      if (rightPos) {
        group.addShape('circle', {
          attrs: _extends({}, markStyle, {
            x: rightPos[0],
            y: rightPos[1],
            r: markSize
          }),
          className: 'triangle-mark-right'
        });
      }
    }

    if (top) {
      // up down left right 四个方向的坐标均不相同
      var topPos = null;

      var _diffY2 = len * Math.sin(1 / 3 * Math.PI);

      var _r2 = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        topPos = [_r2 - _diffY2, -_diffY2];
      } else if (direction === 'left') {
        topPos = [_r2, -_diffY2];
      } else if (direction === 'right') {
        topPos = [-_r2, -_diffY2];
      }

      if (topPos) {
        // top circle
        group.addShape('circle', {
          attrs: _extends({}, markStyle, {
            x: topPos[0],
            y: topPos[1],
            r: markSize
          }),
          className: 'triangle-mark-top'
        });
      }
    }

    if (bottom) {
      // up down left right 四个方向的坐标均不相同
      var bottomPos = null;

      var _diffY3 = len * Math.sin(1 / 3 * Math.PI);

      var _r3 = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'down') {
        bottomPos = [-_r3 + _diffY3, _diffY3];
      } else if (direction === 'left') {
        bottomPos = [_r3, _diffY3];
      } else if (direction === 'right') {
        bottomPos = [-_r3, _diffY3];
      }

      if (bottomPos) {
        // bottom circle
        group.addShape('circle', {
          attrs: _extends({}, markStyle, {
            x: bottomPos[0],
            y: bottomPos[1],
            r: markSize
          }),
          className: 'triangle-mark-bottom'
        });
      }
    }
  },
  getPath: function getPath(cfg) {
    var customOptions = this.getCustomConfig(cfg) || {};
    var defaultDirection = this.options.direction;
    var customDirection = customOptions.direction;
    var direction = cfg.direction || customDirection || defaultDirection;
    var size = this.getSize(cfg);
    var len = size[0];
    var diffY = len * Math.sin(1 / 3 * Math.PI);
    var r = len * Math.sin(1 / 3 * Math.PI);
    var path = [['M', -r, diffY], ['L', 0, -diffY], ['L', r, diffY], ['Z'] // 封闭
    ];

    if (direction === 'down') {
      path = [['M', -r, -diffY], ['L', r, -diffY], ['L', 0, diffY], ['Z'] // 封闭
      ];
    } else if (direction === 'left') {
      path = [['M', -r, r - diffY], ['L', r, -r], ['L', r, r], ['Z'] // 封闭
      ];
    } else if (direction === 'right') {
      path = [['M', r, r - diffY], ['L', -r, r], ['L', -r, -r], ['Z'] // 封闭
      ];
    }

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
    var _this$options3 = this.options,
        defaultStyle = _this$options3.style,
        defaultIcon = _this$options3.icon,
        defaultLabelCfg = _this$options3.labelCfg;
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

    var triangleIcon = group.findByClassName('triangle-icon');

    if (triangleIcon) {
      var w = icon.width,
          h = icon.height;
      triangleIcon.attr(_extends({
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
    var _this$options4 = this.options,
        defaultLinkPoints = _this$options4.linkPoints,
        defaultDirection = _this$options4.direction;
    var customLinkPoints = customOptions.linkPoints,
        customDirection = customOptions.direction;
    var linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints);
    var direction = cfg.direction || customDirection || defaultDirection;

    var markSize = linkPoints.size,
        markStyle = _objectWithoutPropertiesLoose(linkPoints, ["size"]);

    var size = this.getSize(cfg);
    var len = size[0];
    var markLeft = group.findByClassName('triangle-mark-left');

    if (markLeft) {
      var leftPos = null;
      var diffY = len * Math.sin(1 / 3 * Math.PI);
      var r = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        leftPos = [-r, diffY];
      } else if (direction === 'down') {
        leftPos = [-r, -diffY];
      } else if (direction === 'left') {
        leftPos = [-r, r - diffY];
      }

      if (leftPos) {
        // left circle
        markLeft.attr(_extends({}, markStyle, {
          x: leftPos[0],
          y: leftPos[1],
          r: markSize
        }));
      }
    }

    var markRight = group.findByClassName('triangle-mark-right');

    if (markRight) {
      var rightPos = null;

      var _diffY4 = len * Math.sin(1 / 3 * Math.PI);

      var _r4 = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        rightPos = [_r4, _diffY4];
      } else if (direction === 'down') {
        rightPos = [_r4, -_diffY4];
      } else if (direction === 'right') {
        rightPos = [_r4, _r4 - _diffY4];
      }

      if (rightPos) {
        markRight.attr(_extends({}, markStyle, {
          x: rightPos[0],
          y: rightPos[1],
          r: markSize
        }));
      }
    }

    var markTop = group.findByClassName('triangle-mark-top');

    if (markTop) {
      var topPos = null;

      var _diffY5 = len * Math.sin(1 / 3 * Math.PI);

      var _r5 = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'up') {
        topPos = [_r5 - _diffY5, -_diffY5];
      } else if (direction === 'left') {
        topPos = [_r5, -_diffY5];
      } else if (direction === 'right') {
        topPos = [-_r5, -_diffY5];
      }

      if (topPos) {
        // top circle
        markTop.attr(_extends({}, markStyle, {
          x: topPos[0],
          y: topPos[1],
          r: markSize
        }));
      }
    }

    var markBottom = group.findByClassName('triangle-mark-bottom');

    if (markBottom) {
      var bottomPos = null;

      var _diffY6 = len * Math.sin(1 / 3 * Math.PI);

      var _r6 = len * Math.sin(1 / 3 * Math.PI);

      if (direction === 'down') {
        bottomPos = [-_r6 + _diffY6, _diffY6];
      } else if (direction === 'left') {
        bottomPos = [_r6, _diffY6];
      } else if (direction === 'right') {
        bottomPos = [-_r6, _diffY6];
      }

      if (bottomPos) {
        // bottom circle
        markBottom.attr(_extends({}, markStyle, {
          x: bottomPos[0],
          y: bottomPos[1],
          r: markSize
        }));
      }
    }
  }
}, 'single-shape');