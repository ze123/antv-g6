/**
 * 将数组展开
 * todo 和 flatten 是一个意思吧？@绝云
 * @param dataArray
 */
export default (function (dataArray) {
    var rst = [];
    for (var i = 0; i < dataArray.length; i++) {
        rst = rst.concat(dataArray[i]);
    }
    return rst;
});
//# sourceMappingURL=merge.js.map