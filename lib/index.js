'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _split = require('./split');

var _network = require('./execute/network');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RelayCompositeNetworkLayer = function () {
  function RelayCompositeNetworkLayer(config) {
    _classCallCheck(this, RelayCompositeNetworkLayer);

    this.config = config;
  }

  _createClass(RelayCompositeNetworkLayer, [{
    key: 'sendQueries',
    value: function sendQueries(queryRequests) {
      var context = _extends({}, this.config);
      var compositeRequests = queryRequests.map(function (request) {
        return (0, _split.createCompositeRequest)(request, context);
      });

      return (0, _network.executeCompositeRequests)(compositeRequests, context);
    }
  }, {
    key: 'sendMutation',
    value: function sendMutation(mutationRequest) {
      var context = _extends({}, this.config);
      var compositeMutationRequest = (0, _split.createMutationRequest)(mutationRequest, context);

      return (0, _network.executeCompositeMutation)(compositeMutationRequest, context);
    }
  }, {
    key: 'supports',
    value: function supports() {
      return false;
    }
  }]);

  return RelayCompositeNetworkLayer;
}();

exports.default = RelayCompositeNetworkLayer;