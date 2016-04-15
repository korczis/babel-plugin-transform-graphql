'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.default = function () {
  return {
    visitor: {
      Program: function Program(path, state) {
        if (state.opts.strict === false) return;

        var node = path.node;


        for (var i in node.directives.length) {
          var directive = node.directives[i];

          if (directive.value.value === "use strict") {
            return;
          }
        }

        path.unshiftContainer("directives", t.directive(t.directiveLiteral("use strict")));
      }
    }
  };
};

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

var _graphqlParser = require('graphql-parser');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GraphQLVisitor = function () {
  function GraphQLVisitor(refs) {
    (0, _classCallCheck3.default)(this, GraphQLVisitor);

    this.refs = refs;
  }

  (0, _createClass3.default)(GraphQLVisitor, [{
    key: 'Query',
    value: function Query(node) {
      var props = [];
      var query = t.objectExpression(props);

      if (node.fields.length > 0) {
        props.push(compileFields(node.fields));
      }

      return query;
    }
  }, {
    key: 'Field',
    value: function Field(node) {
      var props = [];

      if (node.alias) {
        props.push(t.property('init', t.identifier('alias'), t.valueToNode(node.alias)));
      }

      if (node.params.length > 0) {
        props.push(t.property('init', t.identifier('params'), t.objectExpression(node.params)));
      }

      if (node.fields.length > 0) {
        props.push(compileFields(node.fields));
      }

      return t.property('init', t.identifier(node.name), t.objectExpression(props));
    }
  }, {
    key: 'Argument',
    value: function Argument(node) {
      return t.property('init', t.identifier(node.name), node.value);
    }
  }, {
    key: 'Literal',
    value: function Literal(node) {
      return t.valueToNode(node.value);
    }
  }, {
    key: 'Variable',
    value: function Variable(node) {
      return t.memberExpression(t.identifier('params'), t.identifier(node.name));
    }
  }, {
    key: 'Reference',
    value: function Reference(node) {
      return this.refs[node.name];
    }
  }]);
  return GraphQLVisitor;
}();

function compileFields(fields) {
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    if (t.isCallExpression(field)) {
      fields[i] = t.spreadProperty(t.memberExpression(field, t.identifier('fields')));
    }
  }

  return t.property('init', t.identifier('fields'), t.objectExpression(fields));
}

function compile(node) {
  var source = '';
  for (var i = 0; i < node.quasis.length; i++) {
    if (i > 0) source += '&' + (i - 1);
    source += node.quasis[i].value.raw;
  }

  return t.functionExpression(null, [t.identifier('params')], t.blockStatement([t.returnStatement((0, _graphqlParser.traverse)((0, _graphqlParser.parse)(source), new GraphQLVisitor(node.expressions)))]));
}