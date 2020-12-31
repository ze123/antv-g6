/**
 * @fileOverview util
 * @author huangtonger@aliyun.com
 */
var Util = {};

var MathUtil = require('./math');

var PathUtil = require('./path');

var BaseUtil = require('./base');

var GraphicUtil = require('./graphic');

var GroupUtil = require('./groupData');

var TextUtil = require('./text');

BaseUtil.deepMix(Util, BaseUtil, GraphicUtil, PathUtil, MathUtil, GroupUtil, TextUtil);
module.exports = Util;