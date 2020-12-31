/*
 * @Author: moyee
 * @Date: 2019-07-30 10:39:59
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-20 17:04:25
 * @Description: 群组数据格式转换
 */
var _require = require('lodash'),
    cloneDeep = _require.cloneDeep,
    groupBy = _require.groupBy,
    merge = _require.merge;

module.exports = {
  groupMapNodes: {},
  nodeArr: [],

  /**
  * 扁平的数据格式转成树形
  * @param {array} data 扁平结构的数据
  * @param {string} value 树状结构的唯一标识
  * @param {string} parentId 父节点的键值
  * @return {array} 转成的树形结构数据
  */
  flatToTree: function flatToTree(data, value, parentId) {
    if (value === void 0) {
      value = 'id';
    }

    if (parentId === void 0) {
      parentId = 'parentId';
    }

    var children = 'children';
    var valueMap = [];
    var tree = [];
    var groups = data.groups;
    groups.forEach(function (v) {
      valueMap[v[value]] = v;
    });
    groups.forEach(function (v) {
      var parent = valueMap[v[parentId]];

      if (parent) {
        !parent[children] && (parent[children] = []);
        parent[children].push(v);
      } else {
        tree.push(v);
      }
    });
    return tree;
  },
  addNodesToParentNode: function addNodesToParentNode(originData, nodes) {
    var _this = this;

    var calcNodes = function calcNodes(data) {
      data.forEach(function (row) {
        if (row.children) {
          _this.nodeArr.push({
            id: row.id,
            parentId: row.parentId
          });

          _this.addNodesToParentNode(row.children, nodes);
        } else {
          _this.nodeArr.push({
            id: row.id,
            parentId: row.parentId
          });
        }
      });

      if (_this.nodeArr.length > 0) {
        var nodeMap = function nodeMap(groupIds) {
          if (groupIds.length === 0) {
            return;
          } // const selfIds = groupIds.map(node => node.id);
          // const parentIds = groupIds.map(node => node.parentId);
          // const ids = new Set(selfIds);
          // parentIds.forEach(pid => ids.add(pid));


          var first = groupIds.shift();
          var x = cloneDeep(groupIds);
          _this.groupMapNodes[first.id] = x;
          nodeMap(groupIds);
        };

        nodeMap(_this.nodeArr);
      }

      _this.nodeArr.length = 0;
    };

    calcNodes(originData);
    return this.groupMapNodes;
  },

  /**
   * 获取各个group中的节点
   * @param {object} data G6的数据模型
   * @return {object} 各个group中的节点
   */
  getAllNodeInGroups: function getAllNodeInGroups(data) {
    var groupById = groupBy(data.groups, 'id');
    var groupByParentId = groupBy(data.groups, 'parentId');
    var result = {};

    for (var parentId in groupByParentId) {
      if (!parentId) {
        continue;
      } // 获取当前parentId的所有子group ID


      var subGroupIds = groupByParentId[parentId]; // 获取在parentid群组中的节点

      var nodeInParentGroup = groupById[parentId];

      if (nodeInParentGroup && subGroupIds) {
        // 合并
        var parentGroupNodes = [].concat(subGroupIds, nodeInParentGroup);
        result[parentId] = parentGroupNodes;
      } else if (subGroupIds) {
        result[parentId] = subGroupIds;
      }
    }

    var allGroupsId = merge({}, groupById, result); // 缓存所有group包括的groupID

    var groupIds = {};

    for (var groupId in allGroupsId) {
      if (!groupId || groupId === 'undefined') {
        continue;
      }

      var _subGroupIds = allGroupsId[groupId].map(function (node) {
        return node.id;
      }); // const nodesInGroup = data.nodes.filter(node => node.groupId === groupId).map(node => node.id);


      groupIds[groupId] = _subGroupIds;
    } // 缓存所有groupID对应的Node


    var groupNodes = {};

    var _loop = function _loop(_groupId) {
      if (!_groupId || _groupId === 'undefined') {
        return "continue";
      }

      var subGroupIds = groupIds[_groupId]; // const subGroupIds = allGroupsId[groupId].map(node => node.id);
      // 解析所有子群组

      var parentSubGroupIds = [];

      for (var _iterator = subGroupIds, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var subId = _ref;
        var tmpGroupId = allGroupsId[subId].map(function (node) {
          return node.id;
        }); // const tmpNodes = data.nodes.filter(node => node.groupId === subId).map(node => node.id);

        parentSubGroupIds.push.apply(parentSubGroupIds, tmpGroupId);
      }

      var nodesInGroup = data.nodes.filter(function (node) {
        return parentSubGroupIds.indexOf(node.groupId) > -1;
      }).map(function (node) {
        return node.id;
      });
      groupNodes[_groupId] = nodesInGroup;
    };

    for (var _groupId in groupIds) {
      var _ret = _loop(_groupId);

      if (_ret === "continue") continue;
    }

    return groupNodes;
  }
};