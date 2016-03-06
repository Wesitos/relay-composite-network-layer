'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emptySchema = exports.jsonToSchema = exports.createCompositeSchema = exports.mergeSchemas = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('../utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Schema = {
//   name: string,
//   queryType: string,
//   mutationType: string,
//   subscriptionType: string,
//   types: {[string]: GraphQLIntrospectionType}
// }

// Config = {
//   queryType: string,
//   mutationType: string,
//   subscriptionType: string,
//   extensions: {[typeName]: {[fieldName]: schemaName}}
// }

var ROOT_TYPES = ['queryType', 'mutationType', 'subscriptionType'];

var mergeSchemas = exports.mergeSchemas = function mergeSchemas(schemaMap, options) {

  assertOptionsValid(options);

  var _Object$keys$reduce = Object.keys(schemaMap).reduce(function (_ref3, key) {
    var schema = _ref3.schema;
    var extensions = _ref3.extensions;

    var source = jsonToSchema(key, schemaMap[key]);
    return Object.keys(source.types).reduce(function (_ref4, typeName) {
      var schema = _ref4.schema;
      var extensions = _ref4.extensions;

      var _mergeType = mergeType(schema, source, typeName);

      var type = _mergeType.type;
      var typeExtensions = _mergeType.extensions;

      return {
        schema: (0, _utils.setIn)(schema, ['types', type.name], type),
        extensions: (0, _utils.update)(extensions, type.name, function (exs) {
          return mergeExtensions(exs, typeExtensions);
        })
      };
    }, { schema: schema, extensions: extensions });
  }, { schema: emptySchema(options), extensions: {} });

  var schema = _Object$keys$reduce.schema;
  var extensions = _Object$keys$reduce.extensions;


  return {
    schema: {
      data: {
        __schema: _extends({}, (0, _utils.into)({}, (0, _utils.pairs)(_utils.pick.apply(undefined, [schema].concat(ROOT_TYPES))).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var type = _ref2[0];
          var name = _ref2[1];
          return [type, { name: name }];
        })), {
          types: (0, _utils.values)(schema.types)
        })
      }
    },
    config: _extends({}, _utils.pick.apply(undefined, [schema].concat(ROOT_TYPES)), {
      extensions: extensions
    })
  };
};

var createCompositeSchema = exports.createCompositeSchema = function createCompositeSchema(schemaMap, options) {
  return mergeSchemas(schemaMap, options);
};

// empty object => undefined
var mergeExtensions = function mergeExtensions(exsA, exsB) {
  var exs = _extends({}, exsA, exsB);
  if (Object.keys(exs).length > 0) {
    return exs;
  }
};

var mergeType = function mergeType(destinationSchema, sourceSchema, typeName) {
  var source = sourceSchema.types[typeName];

  if (implementsNode(source)) {
    return mergeExtendableType(destinationSchema, sourceSchema, typeName);
  } else if (source.name === sourceSchema.queryType) {
    return mergeQueryType(destinationSchema, sourceSchema, typeName);
  } else if (source.name === sourceSchema.mutationType) {
    return mergeMutationType(destinationSchema, sourceSchema, typeName);
  } else if (source.name === sourceSchema.subscriptionType) {
    return mergeSubscriptionType(destinationSchema, sourceSchema, typeName);
  } else if (source.name === 'Node') {
    return mergeNodeType(destinationSchema, sourceSchema, typeName);
  } else {
    var destination = destinationSchema.types[typeName];

    assertEquivalent(destination, source);

    return { type: source };
  }
};

var mergeExtendableType = function mergeExtendableType(destinationSchema, sourceSchema, typeName) {
  var destination = destinationSchema.types[typeName];
  var source = sourceSchema.types[typeName];

  var fields = source.fields.filter(function (f) {
    return f.name !== 'id';
  });
  var extensions = (0, _utils.into)({}, fields.map(function (f) {
    return [f.name, sourceSchema.name];
  }));

  if (destination) {
    return {
      type: mergeFields(destination, fields),
      extensions: extensions
    };
  } else {
    return {
      type: source,
      extensions: (0, _utils.into)({}, fields.map(function (f) {
        return [f.name, sourceSchema.name];
      }))
    };
  }
};

var mergeNodeType = function mergeNodeType(destinationSchema, sourceSchema, typeName) {
  // TODO: merge the possible types
  var destination = destinationSchema.types[typeName];
  var source = sourceSchema.types[typeName];

  if (destination) {
    return { type: destination };
  } else {
    return { type: source };
  }
};

var mergeQueryType = function mergeQueryType(destinationSchema, sourceSchema, sourceTypeName) {
  return extendType(destinationSchema, destinationSchema.queryType, sourceSchema, sourceTypeName, ['node']);
};

var mergeMutationType = function mergeMutationType(destinationSchema, sourceSchema, sourceTypeName) {
  return extendType(destinationSchema, destinationSchema.mutationType, sourceSchema, sourceTypeName);
};

var mergeSubscriptionType = function mergeSubscriptionType(destinationSchema, sourceSchema, sourceTypeName) {
  return extendType(destinationSchema, destinationSchema.subscriptionType, sourceSchema, sourceTypeName);
};

var extendType = function extendType(destinationSchema, destinationTypeName, sourceSchema, sourceTypeName) {
  var exclude = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];


  var destination = destinationSchema.types[destinationTypeName];
  var source = sourceSchema.types[sourceTypeName];

  var fields = source.fields.filter(function (f) {
    return !exclude.includes(f.name);
  });
  var extensions = (0, _utils.into)({}, fields.map(function (f) {
    return [f.name, sourceSchema.name];
  }));

  if (destination) {
    return {
      type: mergeFields(destination, fields),
      extensions: extensions
    };
  } else {
    return {
      type: (0, _utils.set)(source, 'name', destinationTypeName),
      extensions: extensions
    };
  }
};

var mergeFields = function mergeFields(type, fields) {
  var duplicateFields = (0, _utils.intersect)(type.fields.map(function (f) {
    return f.name;
  }), fields.map(function (f) {
    return f.name;
  }));
  if (duplicateFields.length > 0) {
    throw new Error('Invalid Merge : type ' + type.name + ' has definitions with duplicate fields: ' + duplicateFields.join(', '));
  }

  return (0, _utils.update)(type, 'fields', function (fs) {
    return [].concat(_toConsumableArray(fs), _toConsumableArray(fields));
  });
};

var jsonToSchema = exports.jsonToSchema = function jsonToSchema(name, schemaJson) {
  var schema = schemaJson.data.__schema;

  // annoying but can't object.map so wutevs
  var rootTypes = (0, _utils.into)({}, (0, _utils.pairs)(_utils.pick.apply(undefined, [schema].concat(ROOT_TYPES))).map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2);

    var k = _ref6[0];
    var v = _ref6[1];
    return [k, v.name];
  }));

  var typeMap = (0, _utils.into)({}, schema.types.map(function (type) {
    return [type.name, type];
  }));

  return _extends({
    name: name
  }, rootTypes, {
    types: typeMap
  });
};

var emptySchema = exports.emptySchema = function emptySchema(options) {
  var rootTypes = _utils.pick.apply(undefined, [options].concat(ROOT_TYPES));
  return _extends({}, rootTypes, {
    types: {}
  });
};

var implementsNode = function implementsNode(type) {
  var interfaces = type.interfaces || [];
  return interfaces.some(function (i) {
    return i.name === 'Node';
  });
};

var OPTION_KEYS = ['queryType', 'mutationType'];
var REQUIRED_OPTIONS = ['queryType'];

var assertOptionsValid = function assertOptionsValid(options) {
  var invalidOptionKeys = (0, _utils.difference)(Object.keys(options), OPTION_KEYS);

  if (invalidOptionKeys.length > 0) {
    throw new Error('Invalid Options : unknown option(s) : ' + invalidOptionKeys.join(', '));
  }

  var missingRequiredKeys = (0, _utils.difference)(REQUIRED_OPTIONS, Object.keys(options));

  if (missingRequiredKeys.length > 0) {
    throw new Error('Invalid Options : missing required option(s) : ' + missingRequiredKeys.join(', '));
  }
};

/// HIDEOUS BUT UNDERSTANDABLE ///

var assertEquivalent = function assertEquivalent(destination, source) {
  if (!destination) {
    return;
  }

  if (source.kind !== destination.kind) {
    throw new Error('Merge Exception : type ' + typeName + ' has definitions of different kinds : ' + destination.kind + ', ' + source.kind);
  }

  var kind = destination.kind;

  switch (kind) {
    case 'UNION':
      throw new Error('Merge Exception : merging UNION types is not supported : ' + destination.name);
    case 'INTERFACE':
      throw new Error('Merge Exception : merging INTERFACE types is not supported : ' + destination.name);
    case 'OBJECT':
      assertObjectsEquivalent(destination, source);
      break;
    case 'INPUT_OBJECT':
      assertInputObjectsEquivalent(destination, source);
      break;
    case 'ENUM':
      assertEnumsEquivalent(destination, source);
      break;
    case 'SCALAR':
      // nothing to assert for scalars
      break;
    default:
      throw new Error('Merge Exception : unsupported type kind ' + kind + ' : file issue please, thanks friend!');
  }
};

// OBJECT
// kind
// name
// description
// fields
// inputFields
// interfaces
// enumValues
// possibleTypes

var assertObjectsEquivalent = function assertObjectsEquivalent(objectA, objectB) {
  var unmatchedFields = symmetricDifference(objectA.fields, objectB.fields, 'name');

  if (unmatchedFields.length > 0) {
    throw new Error('Invalid Merge : OBJECT type ' + objectA.name + ' has duplicate definitions with different fields : ' + unmatchedFields.join(', ') + '.');
  }

  var fieldError = objectA.fields.reduce(function (error, fieldA) {
    if (error) {
      return error;
    } else {
      var fieldB = objectB.fields.find(function (f) {
        return f.name === fieldA.name;
      });
      return validateFieldsEquivalent(fieldA, fieldB);
    }
  }, null);

  if (fieldError) {
    throw new Error('Invalid Merge : OBJECT type ' + objectA.name + ' has non-equivalent fields : ' + fieldError);
  }
};

var assertInputObjectsEquivalent = function assertInputObjectsEquivalent(objectA, objectB) {
  var unmatchedFields = symmetricDifference(objectA.inputFields, objectB.inputFields, 'name');

  if (unmatchedFields.length > 0) {
    throw new Error('Invalid Merge : INPUT_OBJECT type ' + objectA.name + ' has duplicate definitions with different fields : ' + unmatchedFields.join(', ') + '.');
  }

  var fieldError = objectA.inputFields.reduce(function (error, fieldA) {
    if (error) {
      return error;
    } else {
      var fieldB = objectB.inputFields.find(function (f) {
        return f.name === fieldA.name;
      });
      return validateFieldsEquivalent(fieldA, fieldB);
    }
  }, null);

  if (fieldError) {
    throw new Error('Invalid Merge : INPUT_OBJECT type ' + objectA.name + ' has non-equivalent fields : ' + fieldError);
  }
};

var assertEnumsEquivalent = function assertEnumsEquivalent(enumA, enumB) {
  var unmatchedValues = symmetricDifference(enumA.enumValues, enumB.enumValues, 'name');

  if (unmatchedValues.length > 0) {
    throw new Error('Invalid Merge : ENUM type ' + enumA.name + ' has duplicate definitions with different values : ' + unmatchedValues.join(', ') + '.');
  }
};

// FIELD
// name
// description
// args
// type
// isDeprecated
// deprecationReason

var validateFieldsEquivalent = function validateFieldsEquivalent(fieldA, fieldB) {
  // make sure args equivalent
  var unmatchedArgs = symmetricDifference(fieldA.args, fieldB.args, 'name');

  if (unmatchedArgs.length > 0) {
    return 'field ' + fieldA.name + ' has duplicate definitions with different args : ' + unmatchedArgs.join(', ') + '.';
  }

  var argError = fieldA.args.reduce(function (error, argA) {
    if (error) {
      return error;
    } else {
      var argB = fieldB.args.find(function (a) {
        return a.name === argA.name;
      });
      return validateArgsEquivalent(argA, argB);
    }
  }, null);

  if (argError) {
    return 'field ' + fieldA.name + ' non-equivalent args : ' + argError;
  }

  // make sure type equivalent
  var typeError = validateTypesEquivalent(fieldA.type, fieldB.type);
  if (typeError) {
    return 'field ' + fieldA.name + ' non-equivalent types : ' + typeError;
  }
};

// ARG
// name
// description
// type
// defaultValue

var validateArgsEquivalent = function validateArgsEquivalent(argA, argB) {

  if (argA.defaultValue !== argB.defaultValue) {
    return 'args have different default values : ' + argA.defaultValue + ', ' + argB.defaultValue;
  }

  var typeError = validateTypesEquivalent(argA.type, argB.type);
  if (typeError) {
    return 'args non-equivalent types : ' + typeError;
  }
};

// TYPE
// kind
// name
// ofType

var validateTypesEquivalent = function validateTypesEquivalent(typeA, typeB) {
  if (!typeA && !typeB) {
    return null;
  }

  if (!typeA || !typeB) {
    return 'types do not match : ' + typeA + ', ' + typeB;
  }

  if (typeA.kind !== typeB.kind) {
    return 'type kinds do not match : ' + typeA.kind + ', ' + typeB.kind;
  }

  if (typeA.name !== typeB.name) {
    return 'type names do not match : ' + typeA.name + ', ' + typeB.name;
  }

  var typeOfError = validateTypesEquivalent(typeA.ofType, typeB.ofType);
  if (typeOfError) {
    return 'type typeOf do not match : ' + typeOfError;
  }
};

var symmetricDifference = function symmetricDifference(thingsA, thingsB, idProp) {
  var idsA = thingsA.map(function (t) {
    return t[idProp];
  });
  var idsB = thingsB.map(function (t) {
    return t[idProp];
  });

  return (0, _utils.union)((0, _utils.difference)(idsA, idsB), (0, _utils.difference)(idsB, idsA));
};