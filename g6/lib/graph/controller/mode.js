/**
 * @fileOverview mode
 * @author wuyue.lwy <wyueliu@gmail.com>
 */
var Util = require('../../util');

var Behavior = require('../../behavior');

function mergeBehaviors(modeBehaviors, behaviors) {
  Util.each(behaviors, function (behavior) {
    if (modeBehaviors.indexOf(behavior) < 0) {
      if (Util.isString(behavior)) {
        behavior = {
          type: behavior
        };
      }

      modeBehaviors.push(behavior);
    }
  });
  return modeBehaviors;
}

function filterBehaviors(modeBehaviors, behaviors) {
  var result = [];
  modeBehaviors.forEach(function (behavior) {
    if (behaviors.indexOf(behavior.type) < 0) {
      result.push(behavior);
    }
  });
  return result;
}

var Mode =
/*#__PURE__*/
function () {
  function Mode(graph) {
    this.graph = graph;
    this.modes = graph.get('modes') || {
      default: []
    };

    this._formatModes();

    this.mode = graph.get('defaultMode') || 'default';
    this.currentBehaves = [];
    this.setMode(this.mode);
  }

  var _proto = Mode.prototype;

  _proto._formatModes = function _formatModes() {
    var modes = this.modes;
    Util.each(modes, function (mode) {
      Util.each(mode, function (behavior, i) {
        if (Util.isString(behavior)) {
          mode[i] = {
            type: behavior
          };
        }
      });
    });
  };

  _proto.setMode = function setMode(mode) {
    var modes = this.modes;
    var graph = this.graph;
    var behaviors = modes[mode];

    if (!behaviors) {
      return;
    }

    graph.emit('beforemodechange', {
      mode: mode
    });
    Util.each(this.currentBehaves, function (behave) {
      behave.unbind(graph);
    });

    this._setBehaviors(mode);

    graph.emit('aftermodechange', {
      mode: mode
    });
    this.mode = mode;
    return this;
  };

  _proto.manipulateBehaviors = function manipulateBehaviors(behaviors, modes, add) {
    var self = this;

    if (!Util.isArray(behaviors)) {
      behaviors = [behaviors];
    }

    if (Util.isArray(modes)) {
      Util.each(modes, function (mode) {
        if (!self.modes[mode]) {
          if (add) {
            self.modes[mode] = [].concat(behaviors);
          }
        } else {
          if (add) {
            self.modes[mode] = mergeBehaviors(self.modes[mode], behaviors);
          } else {
            self.modes[mode] = filterBehaviors(self.modes[mode], behaviors);
          }
        }
      });
      return this;
    }

    if (!modes) {
      modes = this.mode;
    }

    if (add) {
      self.modes[modes] = mergeBehaviors(self.modes[modes], behaviors);
    } else {
      self.modes[modes] = filterBehaviors(self.modes[modes], behaviors);
    }

    self.setMode(this.mode);
    return this;
  };

  _proto._setBehaviors = function _setBehaviors(mode) {
    var graph = this.graph;
    var behaviors = this.modes[mode];
    var behaves = [];
    var behave;
    Util.each(behaviors, function (behavior) {
      if (!Behavior.getBehavior(behavior.type)) {
        return;
      }

      behave = new (Behavior.getBehavior(behavior.type))(behavior);
      behave && behave.bind(graph);
      behaves.push(behave);
    });
    this.currentBehaves = behaves;
  };

  _proto.destroy = function destroy() {
    this.graph = null;
    this.modes = null;
    this.currentBehaves = null;
    this.destroyed = true;
  };

  return Mode;
}();

module.exports = Mode;