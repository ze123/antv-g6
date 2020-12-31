var Numeric = require('numericjs');

var MDS =
/*#__PURE__*/
function () {
  //   getDefaultCfgs() {
  //     return {
  //       distances: null,         // 停止迭代的最大迭代数
  //       demension: 2             // 中心点，默认为数据中第一个点
  //     };
  //   }
  function MDS(params) {
    /**
     * distance matrix
     * @type  {array}
     */
    this.distances = params.distances;
    /**
     * dimensions
     * @type  {number}
     */

    this.dimension = params.dimension || 2;
    /**
     * link distance
     * @type  {number}
     */

    this.linkDistance = params.linkDistance;
  }

  var _proto = MDS.prototype;

  _proto.layout = function layout() {
    var self = this;
    var dimension = self.dimension;
    var distances = self.distances;
    var linkDistance = self.linkDistance; // square distances

    var M = Numeric.mul(-0.5, Numeric.pow(distances, 2)); // double centre the rows/columns

    function mean(A) {
      return Numeric.div(Numeric.add.apply(null, A), A.length);
    }

    var rowMeans = mean(M),
        colMeans = mean(Numeric.transpose(M)),
        totalMean = mean(rowMeans);

    for (var i = 0; i < M.length; ++i) {
      for (var j = 0; j < M[0].length; ++j) {
        M[i][j] += totalMean - rowMeans[i] - colMeans[j];
      }
    } // take the SVD of the double centred matrix, and return the
    // points from it


    var ret;
    var res = [];

    try {
      ret = Numeric.svd(M);
    } catch (e) {
      var length = distances.length;

      for (var _i = 0; _i < length; _i++) {
        var x = Math.random() * linkDistance;
        var y = Math.random() * linkDistance;
        res.push([x, y]);
      }
    }

    if (res.length === 0) {
      var eigenValues = Numeric.sqrt(ret.S);
      res = ret.U.map(function (row) {
        return Numeric.mul(row, eigenValues).splice(0, dimension);
      });
    }

    return res;
  };

  return MDS;
}();

module.exports = MDS;