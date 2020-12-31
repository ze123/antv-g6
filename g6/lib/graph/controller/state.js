var Util = require('../../util');

var TIME_OUT = 16;
var timer = null;

var State =
/*#__PURE__*/
function () {
  function State(graph) {
    this.graph = graph;
    this.cachedStates = {
      enabled: {},
      disabled: {}
    };
  }

  var _proto = State.prototype;

  _proto.updateState = function updateState(item, state, enabled) {
    if (item.destroyed) {
      return;
    }

    var self = this;
    var cachedStates = self.cachedStates;
    var enabledStates = cachedStates.enabled;
    var disabledStates = cachedStates.disabled;

    if (enabled) {
      self._checkCache(item, state, disabledStates);

      self._cacheState(item, state, enabledStates);
    } else {
      self._checkCache(item, state, enabledStates);

      self._cacheState(item, state, disabledStates);
    }

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(function () {
      timer = null;
      self.updateGraphStates();
    }, TIME_OUT);
  };

  _proto.updateStates = function updateStates(item, states, enabled) {
    var self = this;

    if (Util.isString(states)) {
      self.updateState(item, states, enabled);
    } else {
      states.forEach(function (state) {
        self.updateState(item, state, enabled);
      });
    }
  };

  _proto._checkCache = function _checkCache(item, state, cache) {
    if (!cache[state]) {
      return;
    }

    var index = cache[state].indexOf(item);

    if (index >= 0) {
      cache[state].splice(index, 1);
    }
  };

  _proto._cacheState = function _cacheState(item, state, states) {
    if (!states[state]) {
      states[state] = [];
    }

    states[state].push(item);
  };

  _proto.updateGraphStates = function updateGraphStates() {
    var states = this.graph.get('states');
    var cachedStates = this.cachedStates;
    Util.each(cachedStates.disabled, function (val, key) {
      if (states[key]) {
        states[key] = states[key].filter(function (item) {
          return val.indexOf(item) < 0 && !val.destroyed;
        });
      }
    });
    Util.each(cachedStates.enabled, function (val, key) {
      if (!states[key]) {
        states[key] = val;
      } else {
        var map = {};
        states[key].forEach(function (item) {
          if (!item.destroyed) {
            map[item.get('id')] = true;
          }
        });
        val.forEach(function (item) {
          if (!item.destroyed) {
            var id = item.get('id');

            if (!map[id]) {
              map[id] = true;
              states[key].push(item);
            }
          }
        });
      }
    });
    this.graph.emit('graphstatechange', {
      states: states
    });
    this.cachedStates = {
      enabled: {},
      disabled: {}
    };
  };

  _proto.destroy = function destroy() {
    this.graph = null;
    this.cachedStates = null;

    if (timer) {
      clearTimeout(timer);
    }

    timer = null;
    this.destroyed = true;
  };

  return State;
}();

module.exports = State;