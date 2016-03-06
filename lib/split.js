'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMutationRequest = exports.createCompositeRequest = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _RelayQuery = require('react-relay/lib/RelayQuery');

var _RelayQuery2 = _interopRequireDefault(_RelayQuery);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ANY_SCHEMA = '__ANY__';

// CompositeRequest = {
//   queries: [CompositeQuery],
//   request
// }

var createCompositeRequest = exports.createCompositeRequest = function createCompositeRequest(request, context) {
  var query = request.getQuery();
  var queries = splitBySchema(query, context);

  return {
    queries: queries,
    request: request
  };
};

var createMutationRequest = exports.createMutationRequest = function createMutationRequest(request, context) {
  var mutation = request.getMutation();

  return {
    mutation: splitBySchema(mutation, context),
    request: request
  };
};

var splitBySchema = function splitBySchema(query, context) {
  if (query instanceof _RelayQuery2.default.Root) {
    return createCompositeQuery(query, context);
  } else if (query instanceof _RelayQuery2.default.Field) {
    return createCompositeFieldField(query, context);
  } else if (query instanceof _RelayQuery2.default.Fragment) {
    return createCompositeFragmentField(query, context);
  } else if (query instanceof _RelayQuery2.default.Mutation) {
    return createCompositeMutation(query, context);
  } else {
    // how do I print out wtf the type is lulz
    throw new Error('unhandled RelayQuery type');
  }
};

// CompositeQuery = {
//   query: RelayQuery
//   schema,
//   dependents
// }

var createCompositeQuery = function createCompositeQuery(root, context) {
  var extensions = context.extensions;
  var queryType = context.queryType;

  var field = root.getFieldName();
  var schema = extensions[queryType][field] || ANY_SCHEMA;

  var fragments = createFragments(root.getChildren(), _extends({}, context, {
    parent: root.getType(),
    schema: schema
  }));

  // query { node }
  if (schema === ANY_SCHEMA) {
    var _ret = function () {
      var _collectFragments = collectFragments([field], schema, fragments);

      var children = _collectFragments.children;
      var dependents = _collectFragments.dependents;

      var oldFragment = children.find(function (c) {
        return c instanceof _RelayQuery2.default.Fragment;
      });

      // pop dependencies of ANY_SCHEMA up into root queries
      return {
        v: dependents.map(function (dep) {
          // inline ANY_SCHEMA fragments into each schema fragment
          var newFragment = oldFragment.clone([].concat(_toConsumableArray(oldFragment.getChildren()), _toConsumableArray(dep.fragment.children)));
          return {
            query: root.clone(children.map(function (child) {
              return child === oldFragment ? newFragment : child;
            })),
            schema: dep.fragment.schema,
            dependents: dep.fragment.dependents
          };
        })
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } else {
    var _collectFragments2 = collectFragments([field], schema, fragments);

    var children = _collectFragments2.children;
    var dependents = _collectFragments2.dependents;


    return [{
      query: root.clone(children),
      schema: schema,
      dependents: dependents
    }];
  }
};

// CompositeMutation = {
//   mutation: RelayMutation
//   schema,
//   dependents
// }

var createCompositeMutation = function createCompositeMutation(mutation, context) {
  var extensions = context.extensions;
  var mutationType = context.mutationType;

  var call = mutation.getCall();
  var field = call.name;
  var schema = extensions[mutationType][field];

  // TODO: invariant schema !== null

  var fragments = createFragments(mutation.getChildren(), _extends({}, context, {
    parent: mutation.getType(),
    schema: schema
  }));

  var _collectFragments3 = collectFragments([field], schema, fragments);

  var children = _collectFragments3.children;
  var dependents = _collectFragments3.dependents;


  return {
    mutation: mutation.clone(children),
    schema: schema,
    dependents: dependents
  };
};

// CompositeFragment = {
//   children,
//   type,
//   schema,
//   dependents
// }

var createFragments = function createFragments(children, context) {
  var parent = context.parent;
  var schema = context.schema;


  return children.map(function (child) {
    return splitBySchema(child, context);
  }).reduce(function (fragments, field) {
    var schema = field.schema;

    return (0, _utils.update)(fragments, schema, emptyFragment(parent, schema), function (fragment) {
      return addField(fragment, field);
    });
  }, {});
};

var collectFragments = function collectFragments(path, schema, fragments) {
  var children = (0, _utils.getIn)(fragments, [schema, 'children'], []);
  var dependents = Object.keys(fragments).map(function (schema) {
    return fragments[schema];
  }).reduce(function (deps, fragment) {
    if (fragment.schema === schema) {
      return [].concat(_toConsumableArray(deps), _toConsumableArray(fragment.dependents.map(function (d) {
        return increaseDepth(d, path);
      })));
    } else {
      return [].concat(_toConsumableArray(deps), [createDependentQuery(fragment, path)]);
    }
  }, []);

  return { children: children, dependents: dependents, schema: schema };
};

var emptyFragment = function emptyFragment(type, schema) {
  return {
    type: type,
    schema: schema,
    children: [],
    dependents: []
  };
};

var addField = function addField(fragment, field) {
  return _extends({}, fragment, {
    children: [].concat(_toConsumableArray(fragment.children), [field.node]),
    dependents: [].concat(_toConsumableArray(fragment.dependents), _toConsumableArray(field.dependents))
  });
};

// CompositeField = {
//   node,
//   schema,
//   dependents
// }

var createCompositeFieldField = function createCompositeFieldField(field, context) {
  var schema = context.schema;
  var parent = context.parent;
  var extensions = context.extensions;


  var fieldSchema = (0, _utils.getIn)(extensions, [parent, field.getSchemaName()], schema);

  var fragments = createFragments(field.getChildren(), _extends({}, context, {
    parent: field.getType(),
    schema: fieldSchema
  }));

  var key = field.getSerializationKey();

  var _collectFragments4 = collectFragments([key], fieldSchema, fragments);

  var children = _collectFragments4.children;
  var dependents = _collectFragments4.dependents;


  return {
    node: field.clone(children),
    schema: fieldSchema,
    dependents: dependents
  };
};

var createCompositeFragmentField = function createCompositeFragmentField(fragment, context) {
  var schema = context.schema;


  var fragments = createFragments(fragment.getChildren(), _extends({}, context, {
    parent: fragment.getType()
  }));

  var _collectFragments5 = collectFragments([], schema, fragments);

  var children = _collectFragments5.children;
  var dependents = _collectFragments5.dependents;


  return {
    node: fragment.clone(children),
    schema: schema,
    dependents: dependents
  };
};

// CompositeDependentQuery = {
//   fragment,
//   path
// }

var createDependentQuery = function createDependentQuery(fragment, path) {
  return {
    path: path,
    // sorta unsure if this covers it all ...
    fragment: (0, _utils.update)(fragment, 'dependents', function (deps) {
      return deps.map(function (d) {
        return increaseDepth(d, ['node']);
      });
    })
  };
};

var increaseDepth = function increaseDepth(dep, path) {
  return _extends({}, dep, {
    path: [].concat(_toConsumableArray(path), _toConsumableArray(dep.path))
  });
};