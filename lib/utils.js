"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var pipeline = exports.pipeline = function pipeline(obj) {
  for (var _len = arguments.length, fns = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    fns[_key - 1] = arguments[_key];
  }

  return fns.reduce(function (obj, fn) {
    return fn(obj);
  }, obj);
};

var curry = exports.curry = function curry(fn) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  return function (arg) {
    return fn.apply(undefined, [arg].concat(args));
  };
};

var push = exports.push = function push(arr, item) {
  return arr.concat(item);
};

var flatten = exports.flatten = function flatten(arrs) {
  return arrs.reduce(function (a, b) {
    return [].concat(_toConsumableArray(a), _toConsumableArray(b));
  }, []);
};

var values = exports.values = function values(obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
};

var union = exports.union = function union() {
  for (var _len3 = arguments.length, arrs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    arrs[_key3] = arguments[_key3];
  }

  return arrs.reduce(function (a, b) {
    return [].concat(_toConsumableArray(new Set([].concat(_toConsumableArray(a), _toConsumableArray(b)))));
  });
};

var intersect = exports.intersect = function intersect() {
  for (var _len4 = arguments.length, arrs = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    arrs[_key4] = arguments[_key4];
  }

  return arrs.reduce(function (a, b) {
    var bs = new Set(b);
    return a.filter(function (n) {
      return bs.has(n);
    });
  });
};

var difference = exports.difference = function difference() {
  for (var _len5 = arguments.length, arrs = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    arrs[_key5] = arguments[_key5];
  }

  return arrs.reduce(function (a, b) {
    var bs = new Set(b);
    return a.filter(function (n) {
      return !bs.has(n);
    });
  });
};

var pick = exports.pick = function pick(obj) {
  for (var _len6 = arguments.length, keys = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
    keys[_key6 - 1] = arguments[_key6];
  }

  return into({}, Object.keys(obj).filter(function (key) {
    return keys.includes(key) && obj[key];
  }).map(function (key) {
    return [key, obj[key]];
  }));
};

var pairs = exports.pairs = function pairs(obj) {
  return Object.keys(obj).map(function (key) {
    return [key, obj[key]];
  });
};

var into = exports.into = function into(obj, kvps) {
  return kvps.reduce(function (obj, _ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var key = _ref2[0];
    var value = _ref2[1];
    return _extends({}, obj, _defineProperty({}, key, value));
  }, obj);
};

var get = exports.get = function get(obj, field, defaultValue) {
  if (obj) {
    return obj[field] || defaultValue;
  } else {
    return defaultValue;
  }
};

var getIn = exports.getIn = function getIn(obj, path, defaultValue) {
  if (path.length === 1) {
    return get(obj, path[0], defaultValue);
  } else if (obj) {
    var key = path[0];
    return getIn(obj[key], path.slice(1), defaultValue);
  } else {
    return defaultValue;
  }
};

var set = exports.set = function set(obj, key, value) {
  return _extends({}, obj, _defineProperty({}, key, value));
};

var setIn = exports.setIn = function setIn(obj, path, value) {
  if (path.length === 1) {
    return _extends({}, obj, _defineProperty({}, path[0], value));
  } else if (obj) {
    var key = path[0];
    return _extends({}, obj, _defineProperty({}, key, setIn(obj[key] || {}, path.slice(1), value)));
  } else {
    return setIn({}, path, value);
  }
};

var update = exports.update = function update(obj, field, defaultValue, updater) {
  if (!updater) {
    updater = defaultValue;
    defaultValue = undefined;
  }

  if (Array.isArray(obj)) {
    var newArray = obj.slice();
    newArray[field] = updater(obj[field] || defaultValue);
    return newArray;
  }

  return _extends({}, obj, _defineProperty({}, field, updater(obj[field] || defaultValue)));
};

var updateIn = exports.updateIn = function updateIn(obj, path, defaultValue, updater) {
  if (path.length === 1) {
    return update(obj, path[0], defaultValue, updater);
  } else {
    var key = path[0];
    if (Array.isArray(obj)) {
      var copy = obj.slice();
      copy[key] = updateIn(copy[key] || {}, path.slice(1), defaultValue, updater);
      return copy;
    } else {
      return _extends({}, obj, _defineProperty({}, key, updateIn(obj[key] || {}, path.slice(1), defaultValue, updater)));
    }
  }
};