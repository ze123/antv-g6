/**
 * 计算字符串的长度
 * @param {string} str 指定的字符串
 * @return {number} 字符串长度
 */
export var calcStrLen = function calcStrLen(str) {
  var len = 0;

  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0 && str.charCodeAt(i) < 128) {
      len++;
    } else {
      len += 2;
    }
  }

  return len;
};
/**
 * 计算显示的字符串
 * @param {string} str 要裁剪的字符串
 * @param {number} maxWidth 最大宽度
 * @param {number} fontSize 字体大小
 * @return {string} 显示的字符串
 */

export var fittingString = function fittingString(str, maxWidth, fontSize) {
  var fontWidth = fontSize * 1.3; // 字号+边距

  maxWidth = maxWidth * 2; // 需要根据自己项目调整

  var width = calcStrLen(str) * fontWidth;
  var ellipsis = '…';

  if (width > maxWidth) {
    var actualLen = Math.floor((maxWidth - 10) / fontWidth);
    var result = str.substring(0, actualLen) + ellipsis;
    return result;
  }

  return str;
};