import _assign from 'lodash/assign';
import { __spreadArrays, __extends } from 'tslib';
import _trim from 'lodash/trim';
import _isNil from 'lodash/isNil';
import _isObjectLike from 'lodash/isObjectLike';
import _castArray from 'lodash/castArray';
import _isString from 'lodash/isString';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import _mapValues from 'lodash/mapValues';
import _reduce from 'lodash/reduce';
import _isObject from 'lodash/isObject';
import _isNumber from 'lodash/isNumber';
import _isBoolean from 'lodash/isBoolean';
import _camelCase from 'lodash/camelCase';
import _keys from 'lodash/keys';
import _every from 'lodash/every';
import _isPlainObject from 'lodash/isPlainObject';
import _flatMapDeep from 'lodash/flatMapDeep';
import _concat from 'lodash/concat';
import _flatMap from 'lodash/flatMap';
import _isRegExp from 'lodash/isRegExp';
import _isFunction from 'lodash/isFunction';
import _last from 'lodash/last';
import _capitalize from 'lodash/capitalize';
import _zip from 'lodash/zip';
import _flatten from 'lodash/flatten';
import AnyPromise from 'any-promise';
import Observable from 'any-observable';
import nodeCleanup from 'node-cleanup';
import neo4j from 'neo4j-driver/lib/browser/neo4j-web';

/**
 * Converts a string to camel case and ensures it is unique in the provided
 * list.
 * @param {string} str
 * @param {Array<string>} existing
 * @return {string}
 */
function uniqueString(str, existing) {
  var camelString = _camelCase(str); // Check if the string already has a number extension


  var number = null;
  var matches = camelString.match(/[0-9]+$/);

  if (matches) {
    number = +matches[0];
    camelString = camelString.substr(0, camelString.length - matches[0].length);
  } // Compute all taken suffixes that are similar to the given string


  var regex = new RegExp("^" + camelString + "([0-9]*)$");

  var takenSuffixes = _reduce(existing, function (suffixes, existingString) {
    var matches = existingString.match(regex);

    if (matches) {
      var suffix = matches[1];
      suffixes.push(suffix ? +suffix : 1);
    }

    return suffixes;
  }, []); // If there was no suffix on the given string or it was already taken,
  // compute the new suffix.


  if (!number || takenSuffixes.indexOf(number) !== -1) {
    number = Math.max.apply(Math, __spreadArrays([0], takenSuffixes)) + 1;
  } // Append the suffix if it is not 1


  return camelString + (number === 1 ? '' : number);
}
/**
 * Converts a Javascript value into a string suitable for a cypher query.
 * @param {object|Array|string|boolean|number} value
 * @return {string}
 */

function stringifyValue(value) {
  if (_isNumber(value) || _isBoolean(value)) {
    return "" + value;
  }

  if (_isString(value)) {
    return "'" + value + "'";
  }

  if (_isArray(value)) {
    var str = _map(value, stringifyValue).join(', ');

    return "[ " + str + " ]";
  }

  if (_isObject(value)) {
    var pairs = _map(value, function (el, key) {
      return key + ": " + stringifyValue(el);
    });

    var str = pairs.join(', ');
    return "{ " + str + " }";
  }

  return '';
}
/**
 * Converts labels into a string that can be put into a pattern.
 *
 * @param {string|array<string>} labels
 * @param relation When true, joins labels by a | instead of :
 * @return {string}
 */

function stringifyLabels(labels, relation) {
  if (relation === void 0) {
    relation = false;
  }

  if (labels.length === 0) {
    return '';
  }

  return ":" + _castArray(labels).join(relation ? '|' : ':');
}
/**
 * Converts a path length bounds into a string to put into a relationship.
 * @param  {Array<int>|int} bounds An array of bounds
 * @return {string}
 */

function stringifyPathLength(bounds) {
  if (_isNil(bounds)) {
    return '';
  }

  if (bounds === '*') {
    return '*';
  }

  if (_isNumber(bounds)) {
    return "*" + bounds;
  }

  var lower = _isNil(bounds[0]) ? '' : "" + bounds[0];
  var upper = _isNil(bounds[1]) ? '' : "" + bounds[1];
  return lower || upper ? "*" + lower + ".." + upper : '*';
}

var Parameter =
/** @class */
function () {
  function Parameter(name, value) {
    this.name = name;
    this.value = value;
  }

  Parameter.prototype.toString = function () {
    return "$" + this.name;
  };

  return Parameter;
}();

var ParameterBag =
/** @class */
function () {
  function ParameterBag() {
    this.parameterMap = {};
  }
  /**
   * Constructs a unique name for this parameter bag.
   * @return {string}
   */


  ParameterBag.prototype.getName = function (name) {
    if (name === void 0) {
      name = 'p';
    }

    return uniqueString(name, _keys(this.parameterMap));
  };
  /**
   * Adds a new parameter to this bag.
   * @param {*} value
   * @param {string|undefined} name
   * @return {Parameter} Newly created parameter object.
   */


  ParameterBag.prototype.addParam = function (value, name) {
    var actualName = this.getName(name);
    var param = new Parameter(actualName, value);
    this.parameterMap[actualName] = param;
    return param;
  };
  /**
   * Adds an existing parameter to this bag. The name may be changed if
   * it is already taken, however, the Parameter object will not be recreated.
   * @param {Parameter} param
   * @return {Parameter}
   */


  ParameterBag.prototype.addExistingParam = function (param) {
    param.name = this.getName(param.name);
    this.parameterMap[param.name] = param;
    return param;
  };
  /**
   * Returns the params in a name: value object suitable for putting into a
   * query object.
   * @return {object}
   */


  ParameterBag.prototype.getParams = function () {
    return _mapValues(this.parameterMap, 'value');
  };
  /**
   * Removes a parameter from the internal map.
   * @param {string} name
   */


  ParameterBag.prototype.deleteParam = function (name) {
    delete this.parameterMap[name];
  };
  /**
   * Copies all parameters from another bag into this bag.
   */


  ParameterBag.prototype.importParams = function (other) {
    for (var key in other.parameterMap) {
      this.addExistingParam(other.parameterMap[key]);
    }
  };
  /**
   * Returns a parameter with the given name.
   */


  ParameterBag.prototype.getParam = function (name) {
    return this.parameterMap[name];
  };

  return ParameterBag;
}();

var ParameterContainer =
/** @class */
function () {
  function ParameterContainer() {
    this.parameterBag = new ParameterBag();
  }

  ParameterContainer.prototype.useParameterBag = function (newBag) {
    newBag.importParams(this.parameterBag);
    this.parameterBag = newBag;
  };

  ParameterContainer.prototype.getParams = function () {
    return this.parameterBag.getParams();
  };
  /**
   * Adds a new parameter to the bag.
   * @param {*} value
   * @param {string|undefined} name
   * @return {Parameter} Newly created parameter object.
   */


  ParameterContainer.prototype.addParam = function (value, name) {
    return this.parameterBag.addParam(value, name);
  };

  ParameterContainer.prototype.getParameterBag = function () {
    return this.parameterBag;
  };

  return ParameterContainer;
}();

var Clause =
/** @class */
function (_super) {
  __extends(Clause, _super);

  function Clause() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  /**
   * Turns the clause into a query string.
   * @return {string} Partial query string.
   */


  Clause.prototype.toString = function () {
    return this.build();
  };
  /**
   * Turns the clause into a query object.
   * @return {object} Query object with two parameters: query and params.
   */


  Clause.prototype.buildQueryObject = function () {
    return {
      query: this.build(),
      params: this.getParams()
    };
  };
  /**
   * Turns the clause into a query string with parameters
   * interpolated into the string. For debugging purposes only.
   * @return {string}
   */


  Clause.prototype.interpolate = function () {
    var query = this.build();
    var params = this.getParams();

    for (var name in params) {
      var pattern = new RegExp("\\$" + name + "(?![a-zA-Z0-9_])", 'g');
      query = query.replace(pattern, stringifyValue(params[name]));
    }

    return query;
  };

  return Clause;
}(ParameterContainer);

var Pattern =
/** @class */
function (_super) {
  __extends(Pattern, _super);

  function Pattern(name, labels, conditions, options) {
    if (options === void 0) {
      options = {
        expanded: true
      };
    }

    var _this = _super.call(this) || this;

    _this.options = options;
    _this.conditionParams = {};

    var isConditions = function (a) {
      return _isObjectLike(a) && !_isArray(a);
    };

    var tempName = name;
    var tempLabels = labels;
    var tempConditions = conditions;

    if (_isNil(tempConditions)) {
      if (isConditions(tempLabels)) {
        tempConditions = tempLabels;
        tempLabels = undefined;
      } else if (_isNil(tempLabels) && isConditions(tempName)) {
        tempConditions = tempName;
        tempName = undefined;
      } else {
        tempConditions = {};
      }
    }

    if (_isNil(tempLabels)) {
      if (_isArray(tempName)) {
        tempLabels = tempName;
        tempName = undefined;
      } else {
        tempLabels = [];
      }
    }

    if (_isNil(tempName)) {
      tempName = '';
    }

    if (!_isString(tempName)) {
      throw new TypeError('Name must be a string.');
    }

    if (!_isString(tempLabels) && !_isArray(tempLabels)) {
      throw new TypeError('Labels must be a string or an array');
    }

    if (!isConditions(tempConditions)) {
      throw new TypeError('Conditions must be an object.');
    }

    _this.labels = _castArray(tempLabels);
    _this.name = tempName;
    _this.conditions = tempConditions;

    _this.setExpandedConditions(options.expanded);

    return _this;
  }

  Pattern.prototype.setExpandedConditions = function (expanded) {
    if (this.useExpandedConditions !== expanded) {
      this.useExpandedConditions = expanded;
      this.rebindConditionParams();
    }
  };

  Pattern.prototype.rebindConditionParams = function () {
    var _this = this; // Delete old bindings


    if (this.conditionParams instanceof Parameter) {
      this.parameterBag.deleteParam(this.conditionParams.name);
    } else {
      for (var key in this.conditionParams) {
        this.parameterBag.deleteParam(this.conditionParams[key].name);
      }
    } // Rebind params


    if (!_isEmpty(this.conditions)) {
      if (this.useExpandedConditions) {
        this.conditionParams = _mapValues(this.conditions, function (value, name) {
          return _this.parameterBag.addParam(value, name);
        });
      } else {
        this.conditionParams = this.parameterBag.addParam(this.conditions, 'conditions');
      }
    } else {
      this.conditionParams = {};
    }
  };

  Pattern.prototype.getNameString = function () {
    return this.name ? this.name : '';
  };

  Pattern.prototype.getLabelsString = function (relation) {
    if (relation === void 0) {
      relation = false;
    }

    return stringifyLabels(this.labels, relation);
  };

  Pattern.prototype.getConditionsParamString = function () {
    if (_isEmpty(this.conditions)) {
      return '';
    }

    if (this.useExpandedConditions) {
      var strings = _map(this.conditionParams, function (param, name) {
        return name + ": " + param;
      });

      return "{ " + strings.join(', ') + " }";
    }

    return this.conditionParams.toString();
  };

  return Pattern;
}(Clause);

var NodePattern =
/** @class */
function (_super) {
  __extends(NodePattern, _super);

  function NodePattern(name, labels, conditions) {
    return _super.call(this, name, labels, conditions) || this;
  }

  NodePattern.prototype.build = function () {
    var query = this.getNameString();
    query += this.getLabelsString();
    query += " " + this.getConditionsParamString();
    return "(" + _trim(query) + ")";
  };

  return NodePattern;
}(Pattern);

var isPathLengthArray = function (value) {
  return _isArray(value) && _every(value, function (item) {
    return _isNumber(item) || _isNil(item);
  }) && value.length > 0;
};

var isPathLength = function (value) {
  return value === '*' || _isNumber(value) || isPathLengthArray(value);
};

var RelationPattern =
/** @class */
function (_super) {
  __extends(RelationPattern, _super);

  function RelationPattern(dir, name, labels, conditions, length) {
    var _this = this;

    var tempName = name;
    var tempLabels = labels;
    var tempConditions = conditions;
    var tempLength = length;

    if (_isNil(tempLength)) {
      if (isPathLength(tempConditions)) {
        tempLength = tempConditions;
        tempConditions = undefined;
      } else if (_isNil(tempConditions) && isPathLength(tempLabels)) {
        tempLength = tempLabels;
        tempLabels = undefined;
      } else if (_isNil(tempConditions) && _isNil(tempLabels) && isPathLength(tempName)) {
        tempLength = tempName;
        tempName = undefined;
      }
    }

    if (isPathLength(tempName) || isPathLength(tempLabels) || isPathLength(tempConditions)) {
      throw new TypeError('Invalid argument combination.');
    }

    _this = _super.call(this, tempName, tempLabels, tempConditions) || this;
    _this.dir = dir;
    _this.length = tempLength;
    return _this;
  }

  RelationPattern.prototype.build = function () {
    var name = this.getNameString();
    var labels = this.getLabelsString(true);
    var length = stringifyPathLength(this.length);
    var conditions = this.getConditionsParamString();

    var query = _trim("" + name + labels + length + " " + conditions);

    var arrows = {
      in: ['<-', '-'],
      out: ['-', '->'],
      either: ['-', '-']
    };
    return arrows[this.dir].join(query.length > 0 ? "[" + query + "]" : '');
  };

  return RelationPattern;
}(Pattern);

var PatternClause =
/** @class */
function (_super) {
  __extends(PatternClause, _super);

  function PatternClause(patterns, options) {
    if (options === void 0) {
      options = {
        useExpandedConditions: false
      };
    }

    var _this = _super.call(this) || this;

    var defaultOptions = {
      useExpandedConditions: true
    };

    var useExpandedConditions = _assign(defaultOptions, options).useExpandedConditions; // Ensure patterns is a two dimensional array.


    var arr = _castArray(patterns);

    _this.patterns = _isArray(arr[0]) ? arr : [arr]; // Add child patterns as clauses

    _this.patterns.forEach(function (arr) {
      return arr.forEach(function (pat) {
        pat.setExpandedConditions(useExpandedConditions);
        pat.useParameterBag(_this.parameterBag);
      });
    });

    return _this;
  }

  PatternClause.prototype.build = function () {
    var patternStrings = _map(this.patterns, function (pattern) {
      return _reduce(pattern, function (str, clause) {
        return str + clause.build();
      }, '');
    });

    return patternStrings.join(', ');
  };

  return PatternClause;
}(Clause);

var Create =
/** @class */
function (_super) {
  __extends(Create, _super);

  function Create(patterns, options) {
    if (options === void 0) {
      options = {};
    }

    var _this = _super.call(this, patterns, {
      useExpandedConditions: false
    }) || this;

    _this.options = options;
    return _this;
  }

  Create.prototype.build = function () {
    var unique = this.options.unique ? ' UNIQUE' : '';
    return "CREATE" + unique + " " + _super.prototype.build.call(this);
  };

  return Create;
}(PatternClause);

var TermListClause =
/** @class */
function (_super) {
  __extends(TermListClause, _super);
  /**
   * Accepts:
   *   node -> string
   *   many nodes -> string[]
   *   nodes with aliases -> Dictionary<string>
   *   node properties -> Dictionary<string[]>
   *   node properties with aliases -> Dictionary<Dictionary<string>[]>
   * or an array of any combination
   */


  function TermListClause(terms) {
    var _this = _super.call(this) || this;

    _this.terms = _castArray(terms);
    return _this;
  }

  TermListClause.prototype.toString = function () {
    var _this = this;

    return _flatMapDeep(this.terms, function (term) {
      return _this.stringifyTerm(term);
    }).join(', ');
  };

  TermListClause.prototype.stringifyTerm = function (term) {
    // Just a node
    if (_isString(term)) {
      return this.stringifyProperty(term);
    } // List of nodes


    if (_isArray(term)) {
      return this.stringifyProperties(term);
    } // Node properties or aliases


    if (_isPlainObject(term)) {
      return this.stringifyDictionary(term);
    }

    return '';
  };

  TermListClause.prototype.stringifyProperty = function (prop, alias, node) {
    var prefix = node ? node + "." : '';

    if (alias) {
      prefix += alias + " AS ";
    }

    return prefix + prop;
  };

  TermListClause.prototype.stringifyProperties = function (props, alias, node) {
    var _this = this;

    var convertToString = function (list, prop) {
      if (_isString(prop)) {
        // Single node property
        list.push(_this.stringifyProperty(prop, alias, node));
      } else {
        // Node properties with aliases
        list.push.apply(list, _map(prop, function (name, alias) {
          return _this.stringifyProperty(name, alias, node);
        }));
      }

      return list;
    };

    return _reduce(props, convertToString, []);
  };

  TermListClause.prototype.stringifyDictionary = function (node) {
    var _this = this;

    return _reduce(node, function (list, prop, key) {
      if (_isString(prop)) {
        // Alias
        list.push(_this.stringifyProperty(prop, key));
      } else {
        // Node with properties
        list.push.apply(list, _this.stringifyProperties(prop, undefined, key));
      }

      return list;
    }, []);
  };

  TermListClause.prototype.build = function () {
    return this.toString();
  };

  return TermListClause;
}(Clause);

var With =
/** @class */
function (_super) {
  __extends(With, _super);
  /**
   * Creates a with clause
   * @param  {string|object|array<string|object>} terms
   */


  function With(terms) {
    return _super.call(this, terms) || this;
  }

  With.prototype.build = function () {
    return "WITH " + _super.prototype.build.call(this);
  };

  return With;
}(TermListClause);

var Unwind =
/** @class */
function (_super) {
  __extends(Unwind, _super);

  function Unwind(list, name) {
    var _this = _super.call(this) || this;

    _this.list = list;
    _this.name = name;
    _this.listParam = _this.parameterBag.addParam(_this.list, 'list');
    return _this;
  }

  Unwind.prototype.build = function () {
    return "UNWIND " + this.listParam + " AS " + this.name;
  };

  return Unwind;
}(Clause);

var Delete =
/** @class */
function (_super) {
  __extends(Delete, _super);

  function Delete(variables, options) {
    if (options === void 0) {
      options = {};
    }

    var _this = _super.call(this) || this;

    _this.options = options;
    _this.variables = _castArray(variables);
    return _this;
  }

  Delete.prototype.build = function () {
    var detach = this.options.detach ? 'DETACH ' : '';
    return detach + "DELETE " + this.variables.join(', ');
  };

  return Delete;
}(Clause);

var Set =
/** @class */
function (_super) {
  __extends(Set, _super);

  function Set(_a, options) {
    var labels = _a.labels,
        values = _a.values,
        variables = _a.variables;

    if (options === void 0) {
      options = {};
    }

    var _this = _super.call(this) || this;

    _this.makeLabelStatement = function (labels, key) {
      return key + stringifyLabels(labels);
    };

    _this.makeValueStatement = function (value, key) {
      var valueIsObject = value instanceof Parameter ? _isObject(value.value) : _isObject(value);
      var op = _this.merge && valueIsObject ? ' += ' : ' = ';
      return key + op + value;
    };

    _this.makeVariableStatement = function (value, key) {
      var op = _this.merge ? ' += ' : ' = ';

      if (_isString(value)) {
        return key + op + value;
      }

      var operationStrings = _map(value, function (value, prop) {
        return key + "." + prop + op + value;
      });

      return operationStrings.join(', ');
    };

    _this.labels = _mapValues(labels, _castArray);
    _this.values = _mapValues(values, function (value, name) {
      return _this.parameterBag.addParam(value, name);
    });
    _this.variables = variables || {};
    _this.merge = !!options.merge;
    return _this;
  }

  Set.prototype.build = function () {
    var labels = _map(this.labels, this.makeLabelStatement);

    var values = _map(this.values, this.makeValueStatement);

    var variables = _map(this.variables, this.makeVariableStatement);

    return "SET " + _concat(labels, values, variables).join(', ');
  };

  return Set;
}(Clause);

var Match =
/** @class */
function (_super) {
  __extends(Match, _super);

  function Match(patterns, options) {
    if (options === void 0) {
      options = {
        optional: false
      };
    }

    var _this = _super.call(this, patterns, {
      useExpandedConditions: true
    }) || this;

    _this.options = options;
    return _this;
  }

  Match.prototype.build = function () {
    var str = 'MATCH ';

    if (this.options.optional) {
      str = "OPTIONAL " + str;
    }

    return str + _super.prototype.build.call(this);
  };

  return Match;
}(PatternClause);

var Remove =
/** @class */
function (_super) {
  __extends(Remove, _super);

  function Remove(_a) {
    var _b = _a.labels,
        labels = _b === void 0 ? {} : _b,
        _c = _a.properties,
        properties = _c === void 0 ? {} : _c;

    var _this = _super.call(this) || this;

    _this.labels = _mapValues(labels, _castArray);
    _this.properties = _mapValues(properties, _castArray);
    return _this;
  }

  Remove.prototype.build = function () {
    var labels = _map(this.labels, function (labels, key) {
      return key + stringifyLabels(labels);
    });

    var properties = _flatMap(this.properties, function (properties, key) {
      return _map(properties, function (property) {
        return key + "." + property;
      });
    });

    return "REMOVE " + __spreadArrays(labels, properties).join(', ');
  };

  return Remove;
}(Clause);

var Return =
/** @class */
function (_super) {
  __extends(Return, _super);

  function Return(terms, options) {
    if (options === void 0) {
      options = {};
    }

    var _this = _super.call(this, terms) || this;

    _this.options = options;
    return _this;
  }

  Return.prototype.build = function () {
    var distinct = this.options.distinct ? ' DISTINCT' : '';
    return "RETURN" + distinct + " " + _super.prototype.build.call(this);
  };

  return Return;
}(TermListClause);

var Skip =
/** @class */
function (_super) {
  __extends(Skip, _super);

  function Skip(amount) {
    var _this = _super.call(this) || this;

    _this.amount = amount;
    _this.amountParam = _this.addParam(amount, 'skipCount');
    return _this;
  }

  Skip.prototype.build = function () {
    return "SKIP " + this.amountParam;
  };

  return Skip;
}(Clause);

var Limit =
/** @class */
function (_super) {
  __extends(Limit, _super);

  function Limit(amount) {
    var _this = _super.call(this) || this;

    _this.amount = amount;
    _this.amountParam = _this.addParam(amount, 'limitCount');
    return _this;
  }

  Limit.prototype.build = function () {
    return "LIMIT " + this.amountParam;
  };

  return Limit;
}(Clause);

var comparisions = {
  equals: equals,
  greaterThan: greaterThan,
  greaterEqualTo: greaterEqualTo,
  lessThan: lessThan,
  lessEqualTo: lessEqualTo,
  startsWith: startsWith,
  endsWith: endsWith,
  contains: contains,
  inArray: inArray,
  hasLabel: hasLabel,
  exists: exists,
  between: between,
  isNull: isNull,
  regexp: regexp
};

function compare(operator, value, variable, paramName) {
  return function (params, name) {
    var baseParamName = paramName || _last(name.split('.'));

    var parts = [name, operator, variable ? value : params.addParam(value, baseParamName)];
    return parts.join(' ');
  };
}
/**
 * Equals comparator for use in where clauses. This is the default so you will
 * probably never need to use this.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: equals(18) })
 * // WHERE age = 18
 *
 * query.where({ name: equals('clientName', true) })
 * // WHERE age = clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */


function equals(value, variable) {
  return compare('=', value, variable);
}
/**
 * Greater than comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: greaterThan(18) })
 * // WHERE age > 18
 *
 * query.where({ age: greaterThan('clientAge', true) })
 * // WHERE age > clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function greaterThan(value, variable) {
  return compare('>', value, variable);
}
/**
 * Greater or equal to comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: greaterEqualTo(18) })
 * // WHERE age >= 18
 *
 * query.where({ age: greaterEqualTo('clientAge', true) })
 * // WHERE age >= clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function greaterEqualTo(value, variable) {
  return compare('>=', value, variable);
}
/**
 * Less than comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: lessThan(18) })
 * // WHERE age < 18
 *
 * query.where({ age: lessThan('clientAge', true) })
 * // WHERE age < clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function lessThan(value, variable) {
  return compare('<', value, variable);
}
/**
 * Less or equal to comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: lessEqualTo(18) })
 * // WHERE age <= 18
 *
 * query.where({ age: lessEqualTo('clientAge', true) })
 * // WHERE age >= clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function lessEqualTo(value, variable) {
  return compare('<=', value, variable);
}
/**
 * Starts with comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: startsWith('steve') })
 * // WHERE name STARTS WITH 'steve'
 *
 * query.where({ name: startsWith('clientName', true) })
 * // WHERE name STARTS WITH clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function startsWith(value, variable) {
  return compare('STARTS WITH', value, variable);
}
/**
 * Ends with comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: endsWith('steve') })
 * // WHERE name ENDS WITH 'steve'
 *
 * query.where({ name: endsWith('clientName', true) })
 * // WHERE name ENDS WITH clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function endsWith(value, variable) {
  return compare('ENDS WITH', value, variable);
}
/**
 * Contains comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: contains('steve') })
 * // WHERE name CONTAINS 'steve'
 *
 * query.where({ name: contains('clientName', true) })
 * // WHERE name CONTAINS clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function contains(value, variable) {
  return compare('CONTAINS', value, variable);
}
/**
 * In comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: inArray([ 'steve', 'william' ]) })
 * // WHERE name IN [ 'steve', 'william' ]
 *
 * query.where({ name: inArray('clientNames', true) })
 * // WHERE name IN clientNames
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */

function inArray(value, variable) {
  return compare('IN', value, variable);
}
/**
 * Regexp comparator for use in where clauses. Also accepts a case insensitive
 * to make it easier to add the `'(?i)'` flag to the start of your regexp.
 * If you are already using flags in your regexp, you should not set insensitive
 * to true because it will prepend `'(?i)'` which will make your regexp
 * malformed.
 *
 * For convenience you can also pass a Javascript RegExp object into this
 * comparator, which will then be converted into a string before it is
 * passed to cypher. *However*, beware that the cypher regexp syntax is
 * inherited from [java]{@link
 * https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html},
 * and may have slight differences to the Javascript syntax. For example,
 * Javascript RegExp flags will not be preserved when sent to cypher.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: regexp('s.*e') })
 * // WHERE name =~ 's.*e'
 *
 * query.where({ name: regexp('s.*e', true) })
 * // WHERE name =~ '(?i)s.*e'
 *
 * query.where({ name: regexp('clientPattern', false, true) })
 * // WHERE name =~ clientPattern
 * ```
 * @param exp
 * @param insensitive
 * @param {boolean} variable
 * @returns {Comparator}
 */

function regexp(exp, insensitive, variable) {
  var stringExp = exp;

  if (exp instanceof RegExp) {
    // Convert regular expression to string and strip slashes and trailing flags.
    // This regular expression will always match something so we can use the ! operator to ignore
    // type errors.
    stringExp = exp.toString().match(/\/(.*)\/[a-z]*/)[1];
  }

  return compare('=~', insensitive ? "(?i)" + stringExp : stringExp, variable);
}
/**
 * Between comparator for use in where clauses. This comparator uses Neo4j's
 * shortcut comparison syntax: `18 <= age <= 65`.
 *
 * The `lower` and `upper` are the bounds of the comparison. You can use
 * `lowerInclusive` and `upperInclusive` to control whether it uses `<=` or `<`
 * for the comparison. They both default to `true`.
 *
 * If you pass only `lowerInclusive` then it will use that value for both.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: between(18, 65) })
 * // WHERE age >= 18 AND age <= 65
 *
 * query.where({ age: between(18, 65, false) })
 * // WHERE age > 18 < AND age < 65
 *
 * query.where({ age: between(18, 65, true, false) })
 * // WHERE age >= 18 AND age < 65
 *
 * query.where({ age: between('lowerBound', 'upperBound', true, false, true) })
 * // WHERE age >= lowerBound AND age < upperBound
 * ```
 *
 * @param lower
 * @param upper
 * @param {boolean} lowerInclusive
 * @param {boolean} upperInclusive
 * @param {boolean} variables
 * @returns {Comparator}
 */

function between(lower, upper, lowerInclusive, upperInclusive, variables) {
  if (lowerInclusive === void 0) {
    lowerInclusive = true;
  }

  if (upperInclusive === void 0) {
    upperInclusive = lowerInclusive;
  }

  var lowerOp = lowerInclusive ? '>=' : '>';
  var upperOp = upperInclusive ? '<=' : '<';
  return function (params, name) {
    var paramName = _capitalize(name);

    var lowerComparator = compare(lowerOp, lower, variables, "lower" + paramName);
    var upperComparator = compare(upperOp, upper, variables, "upper" + paramName);
    var lowerConstraint = lowerComparator(params, name);
    var upperConstraint = upperComparator(params, name);
    return lowerConstraint + " AND " + upperConstraint;
  };
}
/**
 * Is null comparator for use in where clauses. Note that this comparator does
 * not accept any arguments
 *
 * ```
 * query.where({ name: isNull() })
 * // WHERE name IS NULL
 * ```
 * @returns {Comparator}
 */

function isNull() {
  return function (params, name) {
    return name + " IS NULL";
  };
}
/**
 * Has label comparator for use in where clauses.
 *
 * ```
 * query.where({ person: hasLabel('Manager') })
 * // WHERE person:Manager
 * ```
 * @param {string} label
 * @returns {Comparator}
 */

function hasLabel(label) {
  return function (params, name) {
    return name + ":" + label;
  };
}
/**
 * Exists comparator for use in where clauses. Note that this comparator does
 * not accept any arguments
 *
 * ```
 * query.where({ person: exists() })
 * // WHERE exists(person)
 * ```
 * @returns {Comparator}
 */

function exists() {
  return function (params, name) {
    return "exists(" + name + ")";
  };
}

var Precedence;

(function (Precedence) {
  Precedence[Precedence["None"] = 0] = "None";
  Precedence[Precedence["Or"] = 1] = "Or";
  Precedence[Precedence["Xor"] = 2] = "Xor";
  Precedence[Precedence["And"] = 3] = "And";
  Precedence[Precedence["Not"] = 4] = "Not";
})(Precedence || (Precedence = {}));

var WhereOp =
/** @class */
function () {
  function WhereOp() {}

  return WhereOp;
}();
function stringifyCondition(params, condition, name) {
  if (name === void 0) {
    name = '';
  }

  if (_isFunction(condition)) {
    return condition(params, name);
  }

  var conditionName = _last(name.split('.'));

  return name + " = " + params.addParam(condition, conditionName);
}
function stringCons(params, conditions, precedence, name) {
  if (precedence === void 0) {
    precedence = Precedence.None;
  }

  if (name === void 0) {
    name = '';
  }

  if (_isArray(conditions)) {
    return combineOr(params, conditions, precedence, name);
  }

  if (_isPlainObject(conditions)) {
    return combineAnd(params, conditions, precedence, name);
  }

  if (conditions instanceof WhereOp) {
    return conditions.evaluate(params, precedence, name);
  }

  if (_isRegExp(conditions)) {
    return stringifyCondition(params, regexp(conditions), name);
  }

  return stringifyCondition(params, conditions, name);
}
function combineNot(params, conditions, precedence, name) {
  if (precedence === void 0) {
    precedence = Precedence.None;
  }

  if (name === void 0) {
    name = '';
  }

  var string = "NOT " + stringCons(params, conditions, Precedence.Not, name);
  var braces = precedence !== Precedence.None && precedence > Precedence.Not;
  return braces ? "(" + string + ")" : string;
}
function combineOr(params, conditions, precedence, name) {
  if (precedence === void 0) {
    precedence = Precedence.None;
  }

  if (name === void 0) {
    name = '';
  } // If this operator will not be used, precedence should not be altered


  var newPrecedence = conditions.length < 2 ? precedence : Precedence.Or;

  var strings = _map(conditions, function (condition) {
    return stringCons(params, condition, newPrecedence, name);
  });

  var string = strings.join(' OR ');
  var braces = precedence !== Precedence.None && precedence > newPrecedence;
  return braces ? "(" + string + ")" : string;
}
function combineXor(params, conditions, precedence, name) {
  if (precedence === void 0) {
    precedence = Precedence.None;
  }

  if (name === void 0) {
    name = '';
  } // If this operator will not be used, precedence should not be altered


  var newPrecedence = conditions.length < 2 ? precedence : Precedence.Xor;

  var strings = _map(conditions, function (condition) {
    return stringCons(params, condition, newPrecedence, name);
  });

  var string = strings.join(' XOR ');
  var braces = precedence !== Precedence.None && precedence > newPrecedence;
  return braces ? "(" + string + ")" : string;
}
function combineAnd(params, conditions, precedence, name) {
  if (precedence === void 0) {
    precedence = Precedence.None;
  }

  if (name === void 0) {
    name = '';
  } // Prepare name to be joined with the key of the object


  var namePrefix = name.length > 0 ? name + "." : ''; // If this operator will not be used, precedence should not be altered

  var newPrecedence = _keys(conditions).length < 2 ? precedence : Precedence.And;

  var strings = _map(conditions, function (condition, key) {
    return stringCons(params, condition, newPrecedence, namePrefix + key);
  });

  var string = strings.join(' AND ');
  var braces = precedence !== Precedence.None && precedence > newPrecedence;
  return braces ? "(" + string + ")" : string;
}

var Where =
/** @class */
function (_super) {
  __extends(Where, _super);

  function Where(conditions) {
    var _this = _super.call(this) || this;

    _this.conditions = conditions;
    return _this;
  }

  Where.prototype.build = function () {
    return "WHERE " + stringCons(this.parameterBag, this.conditions);
  };

  return Where;
}(Clause);

var Raw =
/** @class */
function (_super) {
  __extends(Raw, _super);

  function Raw(clause) {
    var args = [];

    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }

    var _this = _super.call(this) || this;

    if (_isString(clause)) {
      _this.clause = clause;
      var params = args[0];

      if (_isObjectLike(params)) {
        for (var key in params) {
          if (Object.hasOwnProperty.call(params, key)) {
            _this.addParam(params[key], key);
          }
        }
      } else if (!_isNil(params)) {
        throw new TypeError('When passing a string clause to Raw, params should be an object');
      }
    } else if (_isArray(clause)) {
      var queryParams = _map(args, function (param) {
        return _this.addParam(param);
      });

      _this.clause = _flatten(_zip(clause, queryParams)).join('');
    } else {
      throw new TypeError('Clause should be a string or an array');
    }

    return _this;
  }

  Raw.prototype.build = function () {
    return this.clause;
  };

  return Raw;
}(Clause);

var OrderBy =
/** @class */
function (_super) {
  __extends(OrderBy, _super);

  function OrderBy(fields, dir) {
    var _this = _super.call(this) || this;

    var direction = OrderBy.normalizeDirection(dir);

    if (_isString(fields)) {
      _this.constraints = [{
        direction: direction,
        field: fields
      }];
    } else if (_isArray(fields)) {
      _this.constraints = _map(fields, function (field) {
        if (!_isArray(field)) {
          return {
            field: field,
            direction: direction
          };
        }

        var fieldDirection = field[1] ? OrderBy.normalizeDirection(field[1]) : direction;
        return {
          field: field[0],
          direction: fieldDirection
        };
      });
    } else {
      _this.constraints = _map(fields, function (fieldDirection, field) {
        return {
          field: field,
          direction: OrderBy.normalizeDirection(fieldDirection)
        };
      });
    }

    return _this;
  }

  OrderBy.prototype.build = function () {
    var constraints = _map(this.constraints, function (_a) {
      var field = _a.field,
          direction = _a.direction;
      return _trim(field + " " + direction);
    });

    return "ORDER BY " + constraints.join(', ');
  };

  OrderBy.normalizeDirection = function (dir) {
    var upperDir = typeof dir === 'string' ? dir.toUpperCase() : dir;
    var isDescending = upperDir === 'DESC' || upperDir === 'DESCENDING' || upperDir === true;
    return isDescending ? 'DESC' : '';
  };

  return OrderBy;
}(Clause);

var Merge =
/** @class */
function (_super) {
  __extends(Merge, _super);

  function Merge(patterns) {
    return _super.call(this, patterns, {
      useExpandedConditions: true
    }) || this;
  }

  Merge.prototype.build = function () {
    return "MERGE " + _super.prototype.build.call(this);
  };

  return Merge;
}(PatternClause);

var OnMatch =
/** @class */
function (_super) {
  __extends(OnMatch, _super);

  function OnMatch(clause) {
    var _this = _super.call(this) || this;

    _this.clause = clause;
    clause.useParameterBag(_this.parameterBag);
    return _this;
  }

  OnMatch.prototype.build = function () {
    return "ON MATCH " + this.clause.build();
  };

  return OnMatch;
}(Clause);

var OnCreate =
/** @class */
function (_super) {
  __extends(OnCreate, _super);

  function OnCreate(clause) {
    var _this = _super.call(this) || this;

    _this.clause = clause;
    clause.useParameterBag(_this.parameterBag);
    return _this;
  }

  OnCreate.prototype.build = function () {
    return "ON CREATE " + this.clause.build();
  };

  return OnCreate;
}(Clause);

var operators = {
  and: and,
  or: or,
  xor: xor,
  not: not
};
/**
 * `AND` operator to use in where clauses. This is the default operator when
 * using conditions so you will probably never need to use this unless you'd
 * like to make it explicit.
 *
 * ```
 * query.where(and({
 *   'person.name': 'Steve',
 *   'person.age': greaterThan(18),
 * }));
 * // WHERE person.name = 'Steve' AND person.age > 18
 * ```
 * Note that this method only accepts a dictionary of conditions.
 *
 * @param {AndConditions} conditions
 * @returns {WhereAnd}
 */

function and(conditions) {
  return new WhereAnd(conditions);
}

var WhereAnd =
/** @class */
function (_super) {
  __extends(WhereAnd, _super);

  function WhereAnd(conditions) {
    var _this = _super.call(this) || this;

    _this.conditions = conditions;
    return _this;
  }

  WhereAnd.prototype.evaluate = function (params, precedence, name) {
    if (precedence === void 0) {
      precedence = Precedence.None;
    }

    if (name === void 0) {
      name = '';
    }

    return combineAnd(params, this.conditions, precedence, name);
  };

  return WhereAnd;
}(WhereOp);
/**
 * `OR` operator to use in where clauses. This is the default operator when
 * supplying an array to where so you will probably never need to use this
 * unless you'd like to make it explicit.
 *
 * ```
 * query.where(or([
 *   { 'person.name': 'Steve' },
 *   { 'person.age': greaterThan(18) },
 * ]));
 * // WHERE person.name = 'Steve' OR person.age > 18
 * ```
 * Note that this method only accepts an array of conditions.
 *
 * @param {OrConditions} conditions
 * @returns {WhereOr}
 */

function or(conditions) {
  return new WhereOr(conditions);
}

var WhereOr =
/** @class */
function (_super) {
  __extends(WhereOr, _super);

  function WhereOr(conditions) {
    var _this = _super.call(this) || this;

    _this.conditions = conditions;
    return _this;
  }

  WhereOr.prototype.evaluate = function (params, precedence, name) {
    if (precedence === void 0) {
      precedence = Precedence.None;
    }

    if (name === void 0) {
      name = '';
    }

    return combineOr(params, this.conditions, precedence, name);
  };

  return WhereOr;
}(WhereOp);
/**
 * `XOR` operator to use in where clauses.
 *
 * ```
 * query.where(xor([
 *   { 'person.name': 'Steve' },
 *   { 'person.age': greaterThan(18) },
 * ]));
 * // WHERE person.name = 'Steve' XOR person.age > 18
 * ```
 * Note that this method only accepts an array of conditions.
 *
 * @param {OrConditions} conditions
 * @returns {WhereXor}
 */

function xor(conditions) {
  return new WhereXor(conditions);
}

var WhereXor =
/** @class */
function (_super) {
  __extends(WhereXor, _super);

  function WhereXor(conditions) {
    var _this = _super.call(this) || this;

    _this.conditions = conditions;
    return _this;
  }

  WhereXor.prototype.evaluate = function (params, precedence, name) {
    if (precedence === void 0) {
      precedence = Precedence.None;
    }

    if (name === void 0) {
      name = '';
    }

    return combineXor(params, this.conditions, precedence, name);
  };

  return WhereXor;
}(WhereOp);
/**
 * `NOT` operator to use in where clauses.
 *
 * ```
 * query.where(not([
 *   { 'person.name': 'Steve' },
 *   { 'person.age': greaterThan(18) },
 * ]));
 * // WHERE NOT (person.name = 'Steve' AND person.age > 18)
 * ```
 * Note that this method only accepts an array of conditions.
 *
 * @param {OrConditions} conditions
 * @returns {WhereXor}
 */

function not(conditions) {
  return new WhereNot(conditions);
}

var WhereNot =
/** @class */
function (_super) {
  __extends(WhereNot, _super);

  function WhereNot(conditions) {
    var _this = _super.call(this) || this;

    _this.conditions = conditions;
    return _this;
  }

  WhereNot.prototype.evaluate = function (params, precedence, name) {
    if (precedence === void 0) {
      precedence = Precedence.None;
    }

    if (name === void 0) {
      name = '';
    }

    return combineNot(params, this.conditions, precedence, name);
  };

  return WhereNot;
}(WhereOp);

/**
 * Creates a node pattern like `(parent:Person { name: 'Gwenn' })`.
 *
 * All of the arguments are optional and most of the time you can supply only
 * the ones you want, assuming you keep the order the same of course.
 *
 * Use the following signatures as a reference:
 *
 * ```typescript
 * node(conditions: Dictionary<any>)
 * node(labels: string[], conditions?: Dictionary<any>)
 * node(name: string, conditions?: Dictionary<any>)
 * node(name: string, labels?: string | string[], conditions?: Dictionary<any>)
 * ```
 * *Note that labels must be an array when it is the first argument.*
 *
 *
 *
 * Some examples
 *
 * ```typescript
 * node()
 * // ()
 *
 * node('parent')
 * // (parent)
 *
 * node('parent', 'Person')
 * // (parent:Person)
 *
 * node([ 'Person' ])
 * // (:Person)
 *
 * node('parent', [ 'Person', 'Adult' ])
 * // (parent:Person:Adult)
 *
 * node({ name: 'Gwenn' })
 * // ({ name: 'Gwenn' })
 *
 * node('parent', { name: 'Gwenn' })
 * // (parent { name: 'Gwenn' })
 *
 * node([ 'Person' ], { name: 'Gwenn' })
 * // (:Person { name: 'Gwenn' })
 *
 * node('parent', 'Person', { name: 'Gwenn' })
 * // (parent:Person { name: 'Gwenn' })
 * ```
 *
 * For more details on node patterns see the cypher
 * [docs]{@link
 * https://neo4j.com/docs/developer-manual/current/cypher/syntax/patterns/#cypher-pattern-node}
 *
 * @param {_.Many<string> | _.Dictionary<any>} name
 * @param {_.Many<string> | _.Dictionary<any>} labels
 * @param {_.Dictionary<any>} conditions A dictionary of conditions to attach
 * to the node. These are stored as parameters so there is no need to worry
 * about escaping.
 * @returns {NodePattern} An object representing the node pattern.
 */

function node(name, labels, conditions) {
  return new NodePattern(name, labels, conditions);
} // Need to disable line length because there is a long link in the documentation

/* tslint:disable:max-line-length */

/**
 * Creates a relation pattern like `-[rel:FriendsWith { active: true }]->`.
 *
 * The only required argument is direction. All other arguments are optional and all combinations of
 * them are valid. The only exception is that when labels is the first argument after direction, it
 * must be an array, otherwise it will be interpreted as the relation name.
 *
 * Some examples
 *
 * ```typescript
 * relation('either')
 * //  --
 *
 * relation('out', 'rel')
 * //  -[rel]->
 *
 * relation('out', 'rel', 'FriendsWith')
 * //  -[rel:FriendsWith]->
 *
 * relation('in', [ 'FriendsWith', 'RelatedTo' ])
 * // <-[:FriendsWith|RelatedTo]-
 * // Note that this will match a relation with either the FriendsWith label or
 * // the RelatedTo label. You cannot use this syntax when creating relations.
 *
 * relation('in', [4, 10])
 * // <-[*4..10]-
 *
 * relation('in', { active: true })
 * // <-[{ active: true }]
 *
 * relation('in', 'rel', { active: true })
 * // <-[rel { active: true }]-
 *
 * relation('either', [ 'FriendsWith' ], { active: true })
 * //  -[:FriendsWith { active: true }]-
 *
 * relation('either', 'rel', 'FriendsWith', { active: true }, 3)
 * //  -[rel:FriendsWith*3 { active: true }]-
 *
 * relation('either', 'rel', 'FriendsWith', { active: true }, [ 3 ])
 * //  -[rel:FriendsWith*3.. { active: true }]-
 *
 * relation('either', 'rel', 'FriendsWith', { active: true }, [ 3, 5 ])
 * //  -[rel:FriendsWith*3..5 { active: true }]-
 *
 * relation('either', 'rel', 'FriendsWith', { active: true }, '*')
 * //  -[rel:FriendsWith* { active: true }]-
 * ```
 *
 * For more details on relation patterns see the cypher
 * [docs]{@link
 * https://neo4j.com/docs/developer-manual/current/cypher/syntax/patterns/#cypher-pattern-relationship}.
 *
 * @param dir Direction of the relation. `in` means to the left, `out` means to
 * the right and `either` means no direction.
 * @param {_.Many<string> | _.Dictionary<any>} name
 * @param {_.Many<string> | _.Dictionary<any>} labels
 * @param {_.Dictionary<any>} conditions
 * @param length Length of the relation for flexible length paths. Can be the
 * string `'*'` to represent any length, a single number `3` to represent the
 * maximum length of the path, or an array of two numbers which represent the
 * minimum and maximum length of the path. When passing an array, the second
 * number is optional, see the examples above.
 * @returns {RelationPattern} An object representing the relation pattern.
 */

/* tslint:disable:max-line-length */

function relation(dir, name, labels, conditions, length) {
  return new RelationPattern(dir, name, labels, conditions, length);
}

var Union =
/** @class */
function (_super) {
  __extends(Union, _super);

  function Union(all) {
    if (all === void 0) {
      all = false;
    }

    var _this = _super.call(this) || this;

    _this.all = all;
    return _this;
  }

  Union.prototype.build = function () {
    return "UNION" + (this.all ? ' ALL' : '');
  };

  return Union;
}(Clause);

/**
 * @internal
 */

var SetBlock =
/** @class */
function () {
  function SetBlock(chain, wrapper) {
    this.chain = chain;
    this.wrapper = wrapper;
  }
  /**
   * Adds a [set]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/set}
   * clause to the query.
   *
   * `set` lets you updates a nodes labels and properties in one clause. Most of
   * the time it will be easier to use one of the variants such as `setLabels`,
   * `setValues` or `setVariables`.
   *
   * This function accepts three different kind of properties, each of which is
   * described in more detail in the variants.
   *
   * ```
   * query.set({
   *   labels: {
   *     sale: 'Active',
   *   },
   *   variables: {
   *     sale: {
   *       activatedAt: 'timestamp()',
   *     },
   *   },
   *   values: {
   *     sale: {
   *       activatedBy: user.id,
   *     },
   *   },
   * })
   * // SET sale:Active, sale.activatedAt = timestamp(), sale.activatedBy = $userId
   * ```
   *
   * `set` also accepts an options object which currently only contains a
   * single setting: `override`. Override controls whether the `=` or `+=`
   * operator is used in the set clause. `true` causes the existing object to be
   * cleared and replaced by the new object. `false` on the other hand will
   * merge the existing and new objects together, with new properties replacing
   * the ones on the existing object.
   * The default value of override is a little inconsistent and it will be
   * improved in the next major version. If you don't pass any settings object,
   * override will default to `true`. If you pass an options object without an
   * `override` key, override will be `false`. In future versions, override will
   * always default to `false` to be more consistent with `setVariables` and
   * `setValues`.
   *
   * @param {SetProperties} properties
   * @param {SetOptions} options
   * @returns {Q}
   */


  SetBlock.prototype.set = function (properties, options) {
    return this.chain(this.wrap(new Set(properties, options)));
  };
  /**
   * Adds labels to a node using a [set]{@link
    * https://neo4j.com/docs/developer-manual/current/cypher/clauses/set}
   * clause.
   *
   * ```
   * query.setLabels({
   *   sale: 'Active',
   * })
   * // SET sale:Active
   * ```
   *
   * `setLabels` accepts a dictionary where the keys are nodes to be updated
   * and the value is a single label or an array of labels to add to the node.
   *
   * @param {_.Dictionary<_.Many<string>>} labels
   * @returns {Q}
   */


  SetBlock.prototype.setLabels = function (labels) {
    return this.chain(this.wrap(new Set({
      labels: labels
    })));
  };
  /**
   * Updates a node from parameters using a [set]{@link
    * https://neo4j.com/docs/developer-manual/current/cypher/clauses/set}
   * clause. This function treats all values as parameters which is different to
   * `setVariables` which assumes values are cypher variables.
   *
   * ```
   * query.setValues({
   *   'sale.activatedBy': user.id,
   * })
   * // SET sale.activatedBy += $userId
   * ```
   *
   * `setValues` accepts a dictionary where the keys are nodes or property names
   * to be updated.
   *
   * To use the `+=` operator to merge properties of a node, you can pass
   * `true` to the merge option.
   * ```
   * query.setValues({
   *   'sale': { active: true },
   * }, true)
   * // SET sale += $sale
   * ```
   */


  SetBlock.prototype.setValues = function (values, merge) {
    return this.chain(this.wrap(new Set({
      values: values
    }, {
      merge: merge
    })));
  };
  /**
   * Updates a node from a variable that was previously declared in the query
   * using a [set]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/set}
   * clause. This function only accepts strings as its values which are not
   * escaped in any way so beware. If you want to store some user supplied
   * information in the database, `setValues` is the function you want.
   *
   * ```
   * query.setVariables({
   *   'sale.activatedAt': 'timestamp()',
   * })
   * // SET sale.activatedAt = timestamp()
   * ```
   * Note how values are inserted into the query, as is.
   *
   * To use the `+=` operator to merge properties of a node, you can pass
   * `true` to the merge option.
   * ```
   * query.setVariables({
   *   'sale': 'newSaleDetails'
   * }, true)
   * // SET sale += newSaleDetails
   * ```
   */


  SetBlock.prototype.setVariables = function (variables, merge) {
    return this.chain(this.wrap(new Set({
      variables: variables
    }, {
      merge: merge
    })));
  };

  SetBlock.prototype.wrap = function (clause) {
    return this.wrapper ? new this.wrapper(clause) : clause;
  };

  return SetBlock;
}();
/**
 * Root class for all query chains, namely the {@link Connection} and
 * {@link Query} classes.
 * @internal
 */

var Builder =
/** @class */
function (_super) {
  __extends(Builder, _super);

  function Builder() {
    var _this = _super.call(this, function (c) {
      return _this.continueChainClause(c);
    }) || this;
    /**
     * Used to add an `ON CREATE` clause to the query. Any following query will be prefixed with
     * `ON CREATE`.
     *
     * Example:
     * ```javascript
     * query.onCreate.setLabels({ node: 'Active' });
     * // ON CREATE SET node:Active
            * query.onCreate.setVariables({ 'node.createdAt': 'timestamp()' });
     * // ON CREATE SET node.createdAt = timestamp()
     * ````
     *
     * The only methods that are available after `onCreate` are the set family of clauses.
     */


    _this.onCreate = new SetBlock(_this.continueChainClause.bind(_this), OnCreate);
    /**
     * Used to add an `ON MATCH` clause to the query. Any following query will be prefixed with
     * `ON MATCH`.
     *
     * Example:
     * ```javascript
     * query.onMatch.setLabels({ node: 'Active' });
     * // ON MATCH SET node:Active
            * query.onMatch.setVariables({ 'node.updatedAt': 'timestamp()' });
     * // ON MATCH SET node.createdAt = timestamp()
     * ````
     *
     * The only methods that are available after `onMatch` are the set family of clauses.
     */

    _this.onMatch = new SetBlock(_this.continueChainClause.bind(_this), OnMatch);
    return _this;
  }
  /**
   * Adds a [create]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/create}
   * clause to the query.
   *
   * Create accepts a single pattern, a list of patterns or a list of a list of
   * patterns. Each pattern represents a single part of a cypher pattern. For
   * example: `(people:Person { age: 30 })` would be a node pattern and
   * `-[:FriendsWith]->` would be a relationship pattern.
   *
   * If an array of patterns is provided, they are joined together to form a
   * composite pattern. For example:
   * ```javascript
   * query.create([
   *   node('people', 'Person', { age: 30 }),
   *   relation('out', '', 'FriendsWith'),
   *   node('friend', 'Friend'),
   * ])
   * ```
   *
   * Would equate to the cypher pattern
   * ```
   * CREATE (people:Person { age: 30 })-[:FriendsWith]->(friend:Friend)
   * ```
   *
   * The create method also accepts a `unique` option which will cause a `CREATE UNIQUE` clause to
   * be emitted instead.
   * ```javascript
   * query.create([node('people', 'Person', { age: 30 })], { unique: true });
   * // CREATE UNIQUE (people:Person { age: 30 })
   * ```
   */


  Builder.prototype.create = function (patterns, options) {
    return this.continueChainClause(new Create(patterns, options));
  };
  /**
   * Shorthand for `create(patterns, { unique: true })`
   */


  Builder.prototype.createUnique = function (patterns) {
    return this.create(patterns, {
      unique: true
    });
  };
  /**
   * Shorthand for `create(node(name, labels, conditions), options)`. For more details
   * the arguments see @{link node}.
   */


  Builder.prototype.createNode = function (name, labels, conditions, options) {
    var clause = new Create(new NodePattern(name, labels, conditions), options);
    return this.continueChainClause(clause);
  };
  /**
   * Shorthand for `createNode(name, labels, conditions, { unique: true })`
   */


  Builder.prototype.createUniqueNode = function (name, labels, conditions) {
    return this.createNode(name, labels, conditions, {
      unique: true
    });
  };
  /**
   * Adds a [delete]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/delete}
   * clause to the query.
   *
   * Delete accepts a single string or an array of them and all of them are
   * joined together with commas. *Note that these strings are not escaped or
   * passed to Neo4j using parameters, therefore you should not pass user
   * input into this clause without escaping it first*.
   *
   * You can set `detach: true` in the options to make it a `DETACH DELETE`
   * clause.
   *
   * @param {_.Many<string>} terms
   * @param {DeleteOptions} options
   * @returns {Q}
   */


  Builder.prototype.delete = function (terms, options) {
    return this.continueChainClause(new Delete(terms, options));
  };
  /**
   * Shorthand for `delete(terms, { detach: true })`.
   *
   * @param {_.Many<string>} terms
   * @param {DeleteOptions} options
   * @returns {Q}
   */


  Builder.prototype.detachDelete = function (terms, options) {
    if (options === void 0) {
      options = {};
    }

    return this.continueChainClause(new Delete(terms, _assign(options, {
      detach: true
    })));
  };
  /**
   * Adds a [limit]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/limit}
   * clause to the query.
   *
   * @param {string | number} amount
   * @returns {Q}
   */


  Builder.prototype.limit = function (amount) {
    return this.continueChainClause(new Limit(amount));
  };
  /**
   * Adds a [match]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/match}
   * clause to the query.
   *
   * Match accepts a single pattern, a list of patterns or a list of a list of
   * patterns. Each pattern represents a single part of a cypher pattern. For
   * example: `(people:Person { age: 30 })` would be a node pattern and
   * `-[:FriendsWith]->` would be a relationship pattern.
   *
   * If an array of patterns is provided, they are joined together to form a
   * composite pattern. For example:
   * ```javascript
   * query.match([
   *   node('people', 'Person', { age: 30 }),
   *   relation('out', '', 'FriendsWith'),
   *   node('friends'),
   * ])
   * ```
   *
   * Would equate to the cypher pattern
   * ```
   * MATCH (people:Person { age: 30 })-[:FriendsWith]->(friends)
   * ```
   *
   * If an array of an array of patterns is provided each array is joined
   * together like above, and then each composite pattern is joined with a comma
   * to allow matching of multiple distinct patterns. Note: matching many
   * distinct patterns will produce a cross product of the results as noted in
   * the [cypher docs]{@link
   * https://neo4j.com/developer/kb/cross-product-cypher-queries-will-not-perform-well/}.
   *
   * You can also provide `optional: true` in the options to create and
   * `OPTIONAL MATCH` clause.
   *
   * @param {PatternCollection} patterns List of patterns to be matched.
   * @param {MatchOptions} options
   * @returns {Q}
   */


  Builder.prototype.match = function (patterns, options) {
    return this.continueChainClause(new Match(patterns, options));
  };
  /**
   * Shorthand for `match(node(name, labels, conditions))`. For more details on
   * the arguments see {@link node}.
   *
   * @param {_.Many<string> | _.Dictionary<any>} name
   * @param {_.Many<string> | _.Dictionary<any>} labels
   * @param {_.Dictionary<any>} conditions
   * @returns {Q}
   */


  Builder.prototype.matchNode = function (name, labels, conditions) {
    var clause = new Match(new NodePattern(name, labels, conditions));
    return this.continueChainClause(clause);
  };
  /**
   * Shorthand for `match(patterns, { optional: true })`.
   *
   * @param {PatternCollection} patterns
   * @param {MatchOptions} options
   * @returns {Q}
   */


  Builder.prototype.optionalMatch = function (patterns, options) {
    if (options === void 0) {
      options = {};
    }

    return this.continueChainClause(new Match(patterns, _assign(options, {
      optional: true
    })));
  };
  /**
   * Adds a [merge]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/merge/}
   * clause to the query. It accepts the same parameters as `match` and `create` so refer to them
   * for more information.
   *
   * ```javascript
   * query.merge([
   *   node('user', 'User', { id: 1 }),
   *   relation('out', 'rel', 'OwnsProject'),
   *   node('project', 'Project', { id: 20 }),
   * ])
   * .onMatch.setVariables({ 'rel.updatedAt': `timestamp` });
   * // MERGE (user:User { id: 1 })-[rel:OwnsProject]->(project:Project { id: 20 })
   * // ON MATCH SET rel.updatedAt = timestamp()
   * ```
   */


  Builder.prototype.merge = function (patterns) {
    return this.continueChainClause(new Merge(patterns));
  };
  /**
   * Adds an [order by]{@link
   * https://neo4j.com/docs/developer-manual/current/cypher/clauses/order-by}
   * to the query.
   *
   * Pass a single string or an array of strings to order by.
   * ```javascript
   * query.orderBy([
   *   'name',
   *   'occupation',
   * ])
   * // ORDER BY name, occupation
   * ```
   *
   * You can control the sort direction by adding a direction to each property.
   * ```javascript
   * query.orderBy([
   *   ['name', 'DESC'],
   *   'occupation', // Same as ['occupation', 'ASC']
   * ])
   * // ORDER BY name DESC, occupation
   * ```
   *
   * The second parameter is the default search direction for all properties that
   * don't have a direction specified. So the above query could instead be
   * written as:
   * ```javascript
   * query.orderBy([
   *   'name',
   *   ['occupation', 'ASC']
   * ], 'DESC')
   * // ORDER BY name DESC, occupation
   * ```
   *
   * It is also acceptable to pass an object where each key is the
   * property and the value is a direction. Eg:
   * ```javascript
   * query.orderBy({
   *   name: 'DESC',
   *   occupation: 'ASC',
   * })
   * ```
   * However, the underlying iteration order is not always guaranteed and
   * it may cause subtle bugs in your code. It is still accepted but it
   * is recommended that you use the array syntax above.
   *
   * Valid values for directions are `DESC`, `DESCENDING`, `ASC`, `ASCENDING`.
   * `true` and `false` are also accepted (`true` being the same as `DESC` and
   * `false` the same as `ASC`), however they should be avoided as they are
   * quite ambiguous. Directions always default to `ASC` as it does in cypher.
   *
   * @param {_.Many<string> | OrderConstraints} fields
   * @param {Direction} dir
   * @returns {Q}
   */


  Builder.prototype.orderBy = function (fields, dir) {
    return this.continueChainClause(new OrderBy(fields, dir));
  };
  /**
   * Adds a clause to the query as is. You can also provide an object of params
   * as well.
   *
   * ```javascript
   * query.raw('MATCH (:Event { date: $date }', { date: '2017-01-01' })
   * ```
   *
   * `raw` can also be used as a template tag
   *
   * ```javascript
   * query.matchNode('event', 'Event', { id: 1 })
   *  .raw`SET event.finishedAt = ${Date.now()}`
   * ```
   *
   * But note that using template parameters where they are not supported in a query will produce
   * an malformed query.
   *
   * ```javascript
   * query.raw`SET node.${property} = 'value'`
   * // Invalid query:
   * // SET node.$param1 = 'value'
   * ```
   *
   * @param {string} clause
   * @param args
   * @returns {Q}
   */


  Builder.prototype.raw = function (clause) {
    var args = [];

    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }

    return this.continueChainClause(new (Raw.bind.apply(Raw, __spreadArrays([void 0, clause], args)))());
  };
  /**
   * Adds a [remove]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/remove/}
   * clause to the query.
   *
   * Pass objects containing the list of properties and labels to remove from a node. Each key in an
   * object is the name of a node and the values are the names of the labels and properties to
   * remove. The values of each object can be either a single string, or an array of strings.
   * ```javascript
   * query.remove({
   *   labels: {
   *     coupon: 'Active',
   *   },
   *   properties: {
   *     customer: ['inactive', 'new'],
   *   },
   * });
   * // REMOVE coupon:Active, customer.inactive, customer.new
   * ```
   *
   * Both labels and properties objects are optional, but you must provide at least one of them for
   * the query to be syntatically valid.
   * ```
   * query.remove({
   *
   * });
   * // Invalid query:
   * // REMOVE
   * ```
   *
   * If you only need to remove labels *or* properties, you may find `removeProperties` or
   * `removeLabels` more convenient.
   */


  Builder.prototype.remove = function (properties) {
    return this.continueChainClause(new Remove(properties));
  };
  /**
   * Adds a [remove]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/remove/}
   * clause to the query.
   *
   * Pass an object containing the list of properties to remove from a node. Each key in the
   * object is the name of a node and the values are the names of the properties to remove. The
   * values can be either a single string, or an array of strings.
   * ```javascript
   * query.remove({
   *   customer: ['inactive', 'new'],
   *   coupon: 'available',
   * });
   * // REMOVE customer.inactive, customer.new, coupon.available
   * ```
   */


  Builder.prototype.removeProperties = function (properties) {
    return this.continueChainClause(new Remove({
      properties: properties
    }));
  };
  /**
   * Adds a [remove]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/remove/}
   * clause to the query.
   *
   * Pass an object containing the list of labels to remove from a node. Each key in the
   * object is the name of a node and the values are the names of the labels to remove. The
   * values can be either a single string, or an array of strings.
   * ```javascript
   * query.remove({
   *   customer: ['Inactive', 'New'],
   *   coupon: 'Available',
   * });
   * // REMOVE customer:Inactive, customer:New, coupon:Available
   * ```
   */


  Builder.prototype.removeLabels = function (labels) {
    return this.continueChainClause(new Remove({
      labels: labels
    }));
  };
  /**
   * Adds a [return]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/return}
   * clause to the query.
   *
   * There are many different ways to pass arguments to `return` so each is
   * documented in turn below.
   *
   * A single string:
   * ```javascript
   * query.return('people')
   * // RETURN people
   * ```
   *
   * An array of strings to return multiple variables:
   * ```javascript
   * query.return([ 'people', 'pets' ])
   * // RETURN people, pets
   * ```
   *
   * A single object to rename variables:
   * ```javascript
   * query.return({ people: 'employees' })
   * // RETURN people AS employees
   * ```
   *
   * A single object with an array for each value:
   * ```javascript
   * query.return({
   *   people: [ 'name', 'age' ],
   *   pets: [ 'name', 'breed' ],
   * })
   * // RETURN people.name, people.age, pets.name, pets.breed
   * ```
   * This gives you a shortcut to specifying many node properties. You can also
   * rename each property by adding an object inside the array or by providing
   * an object as the value:
   * ```javascript
   * query.return({
   *   people: [{ name: 'personName' }, 'age' ],
   * })
   * // RETURN people.name as personName, people.age
   * ```
   * or
   * ```javascript
   * query.return({
   *   people: {
   *     name: 'personName',
   *     age: 'personAge',
   *   },
   * })
   * // RETURN people.name as personName, people.age as personAge
   * ```
   *
   * You can also pass an array of any of the above methods.
   *
   * The return method also accepts a `distinct` option which will cause a `RETURN DISTINCT` clause
   * to be emitted instead.
   * ```javascript
   * query.return('people', { distinct: true })
   * // RETURN DISTINCT people
   * ```
   */


  Builder.prototype.return = function (terms, options) {
    return this.continueChainClause(new Return(terms, options));
  };
  /**
   * Shorthand for `return(terms, { distinct: true });
   */


  Builder.prototype.returnDistinct = function (terms) {
    return this.return(terms, {
      distinct: true
    });
  };
  /**
   * Adds a [skip]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/skip}
   * clause to the query.
   *
   * @param {string | number} amount
   * @returns {Q}
   */


  Builder.prototype.skip = function (amount) {
    return this.continueChainClause(new Skip(amount));
  };
  /**
   * Add a [union]{@link https://neo4j.com/docs/cypher-manual/current/clauses/union/} clause to the
   * query.
   *
   * ```javascript
   * query.matchNode('people', 'People')
   *   .return({ 'people.name': 'name' })
   *   .union()
   *   .matchNode('departments', 'Department')
   *   .return({ 'departments.name': 'name' });
   * // MATCH (people:People)
   * // RETURN people.name AS name
   * // UNION
   * // MATCH (departments:Department)
   * // RETURN departments.name AS name
   * ```
   */


  Builder.prototype.union = function (all) {
    return this.continueChainClause(new Union(all));
  };
  /**
   * Add a [union all]{@link https://neo4j.com/docs/cypher-manual/current/clauses/union/} clause to
   * the query. Just shorthand for `union(true)`.
   *
   * ```javascript
   * query.matchNode('people', 'People')
   *   .return({ 'people.name': 'name' })
   *   .unionAll()
   *   .matchNode('departments', 'Department')
   *   .return({ 'departments.name': 'name' });
   * // MATCH (people:People)
   * // RETURN people.name AS name
   * // UNION ALL
   * // MATCH (departments:Department)
   * // RETURN departments.name AS name
   * ```
   */


  Builder.prototype.unionAll = function () {
    return this.continueChainClause(new Union(true));
  };
  /**
   * Adds an [unwind]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/unwind}
   * clause to the query.
   *
   * @param {any[]} list Any kind of array to unwind in the query
   * @param {string} name Name of the variable to use in the unwinding
   * @returns {Q}
   */


  Builder.prototype.unwind = function (list, name) {
    return this.continueChainClause(new Unwind(list, name));
  };
  /**
   * Adds a [where]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/where}
   * clause to the query.
   *
   * `where` is probably the most complex clause in this package because of the flexible ways to
   * combine conditions. A handy rule of thumb is when you see an array it becomes an `OR` and when
   * you see a dictionary, it becomes an `AND`. The many different ways of specifying your
   * constraints are listed below.
   *
   * As a simple object, the comparison of each property is just `AND`ed together.
   * ```javascript
   * query.where({
   *   name: 'Alan',
   *   age: 54,
   * })
   * // WHERE name = 'Alan' AND age = 54
   * ```
   *
   * You can wrap your constraints in a top level dictionary in which case the key of the outer
   * dictionary will be considered the name of the node.
   * ```javascript
   * query.where({
   *   person: {
   *     name: 'Alan',
   *     age: 54,
   *   },
   * })
   * // WHERE person.name = 'Alan' AND person.age = 54
   * ```
   *
   * Using an array, you can generate `OR`ed conditions.
   * ```javascript
   * query.where([
   *   { name: 'Alan' },
   *   { age: 54 },
   * ])
   * // WHERE name = 'Alan' OR age = 54
   * ```
   *
   * Arrays can be placed at many levels in the conditions.
   * ```javascript
   * query.where({
   *   name: [ 'Alan', 'Steve', 'Bob' ],
   * })
   * // WHERE name = 'Alan' OR name = 'Steve' OR name = 'Bob'
   *
   * query.where({
   *   person: [
   *     { name: 'Alan' },
   *     { age: 54 },
   *   ],
   * })
   * // WHERE person.name = 'Alan' OR person.age = 54
   *
   * query.where([
   *   { employee: { name: 'Alan' } },
   *   { department: { code: 765 } },
   * })
   * // WHERE employee.name = 'Alan' OR department.code = 765
   * ```
   *
   * For more complex comparisons, you can use the comparator functions such as:
   * ```javascript
   * query.where({
   *   age: greaterThan(30),
   * })
   * // WHERE age > 30
   * ```
   *
   * The full list of comparators currently supported are:
   *  - [between]{@link http://jamesfer.me/cypher-query-builder/globals.html#between}
   *  - [contains]{@link http://jamesfer.me/cypher-query-builder/globals.html#contains}
   *  - [endsWith]{@link http://jamesfer.me/cypher-query-builder/globals.html#endswith}
   *  - [equals]{@link http://jamesfer.me/cypher-query-builder/globals.html#equals}
   *  - [exists]{@link http://jamesfer.me/cypher-query-builder/globals.html#exists}
   *  - [greaterEqualTo]{@link http://jamesfer.me/cypher-query-builder/globals.html#greaterequalto}
   *  - [greaterThan]{@link http://jamesfer.me/cypher-query-builder/globals.html#greaterthan}
   *  - [hasLabel]{@link http://jamesfer.me/cypher-query-builder/globals.html#haslabel}
   *  - [inArray]{@link http://jamesfer.me/cypher-query-builder/globals.html#inarray}
   *  - [isNull]{@link http://jamesfer.me/cypher-query-builder/globals.html#isnull}
   *  - [lessEqualTo]{@link http://jamesfer.me/cypher-query-builder/globals.html#lessequalto}
   *  - [lessThan]{@link http://jamesfer.me/cypher-query-builder/globals.html#lessthan}
   *  - [regexp]{@link http://jamesfer.me/cypher-query-builder/globals.html#regexp}
   *  - [startsWith]{@link http://jamesfer.me/cypher-query-builder/globals.html#startswith}
   *
   * You can import the comparisons one at a time or all at once.
   * ```javascript
   * import { greaterThan, regexp } from 'cypher-query-builder';
   * // or
   * import { comparisons } form 'cypher-query-builder';
   * ```
   *
   * For convenience you can also pass a Javascript RegExp object as a value,
   * which will then be converted into a string before it is passed to cypher.
   * *However*, beware that the cypher regexp syntax is inherited from
   * [java]{@link
    * https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html},
   * and may have slight differences to the Javascript syntax. If you would
   * prefer, you can use the `regexp` comparator and use strings instead of
   * RegExp objects. For example, Javascript RegExp flags will not be
   * preserved when sent to cypher.
   * ```javascript
   * query.where({
   *   name: /[A-Z].*son/,
   * })
   * // WHERE age =~ '[A-Z].*son'
   * ```
   *
   * All the binary operators including `xor` and `not` are available as well and can also be
   * imported individually or all at once.
   * ```javascript
   * import { xor, and } from 'cypher-query-builder';
   * // or
   * import { operators } form 'cypher-query-builder';
   * ```
   *
   * The operators can be placed at any level of the query.
   * ```javascript
   * query.where({
   *   age: xor([lessThan(12), greaterThan(65)])
   * })
   * // WHERE age < 12 XOR age > 65
   * ```
   *
   * @param {AnyConditions} conditions
   * @returns {Q}
   */


  Builder.prototype.where = function (conditions) {
    return this.continueChainClause(new Where(conditions));
  };
  /**
   * Adds a [with]{@link https://neo4j.com/docs/developer-manual/current/cypher/clauses/with}
   * clause to the query.
   *
   * There are many different ways to pass arguments to `with` so each is
   * documented in turn below.
   *
   * A single string:
   * ```javascript
   * query.with('people')
   * // WITH people
   * ```
   *
   * An array of strings to return multiple variables:
   * ```javascript
   * query.with([ 'people', 'pets' ])
   * // WITH people, pets
   * ```
   *
   * A single object to rename variables:
   * ```javascript
   * query.with({ people: 'employees' })
   * // WITH people AS employees
   * ```
   *
   * A single object with an array for each value:
   * ```javascript
   * query.with({
   *   people: [ 'name', 'age' ],
   *   pets: [ 'name', 'breed' ],
   * })
   * // WITH people.name, people.age, pets.name, pets.breed
   * ```
   * This gives you a shortcut to specifying many node properties. You can also
   * rename each property by adding an object inside the array or by providing
   * an object as the value:
   * ```javascript
   * query.with({
   *   people: [{ name: 'personName' }, 'age' ],
   * })
   * // WITH people.name as personName, people.age
   * ```
   * or
   * ```javascript
   * query.with({
   *   people: {
   *     name: 'personName',
   *     age: 'personAge',
   *   },
   * })
   * // WITH people.name as personName, people.age as personAge
   * ```
   *
   * You can also pass an array of any of the above methods.
   *
   * @param {_.Many<Term>} terms
   * @returns {Q}
   */


  Builder.prototype.with = function (terms) {
    return this.continueChainClause(new With(terms));
  };

  return Builder;
}(SetBlock);

var Transformer =
/** @class */
function () {
  function Transformer() {}

  Transformer.prototype.transformRecords = function (records) {
    var _this = this;

    return _map(records, function (rec) {
      return _this.transformRecord(rec);
    });
  };

  Transformer.prototype.transformRecord = function (record) {
    var _this = this;

    return _mapValues(record.toObject(), function (node) {
      return _this.transformValue(node);
    });
  };

  Transformer.prototype.transformValue = function (value) {
    var _this = this;

    if (this.isPlainValue(value)) {
      return value;
    }

    if (_isArray(value)) {
      return _map(value, function (v) {
        return _this.transformValue(v);
      });
    }

    if (neo4j.isInt(value)) {
      return this.convertInteger(value);
    }

    if (this.isNode(value)) {
      return this.transformNode(value);
    }

    if (this.isRelation(value)) {
      return this.transformRelation(value);
    }

    if (typeof value === 'object') {
      return _mapValues(value, function (v) {
        return _this.transformValue(v);
      });
    }

    return null;
  };

  Transformer.prototype.isPlainValue = function (value) {
    var type = typeof value;
    return value == null || type === 'string' || type === 'boolean' || type === 'number';
  };

  Transformer.prototype.isNode = function (node) {
    return node !== null && typeof node === 'object' && !_isArray(node) && node.identity && node.labels && node.properties;
  };

  Transformer.prototype.transformNode = function (node) {
    return {
      identity: neo4j.integer.toString(node.identity),
      labels: node.labels,
      properties: _mapValues(node.properties, this.transformValue.bind(this))
    };
  };

  Transformer.prototype.isRelation = function (rel) {
    return rel.identity && rel.type && rel.properties && rel.start && rel.end;
  };

  Transformer.prototype.transformRelation = function (rel) {
    return {
      identity: neo4j.integer.toString(rel.identity),
      start: neo4j.integer.toString(rel.start),
      end: neo4j.integer.toString(rel.end),
      label: rel.type,
      properties: _mapValues(rel.properties, this.transformValue.bind(this))
    };
  };

  Transformer.prototype.convertInteger = function (num) {
    if (neo4j.integer.inSafeRange(num)) {
      return neo4j.integer.toNumber(num);
    }

    return neo4j.integer.toString(num);
  };

  return Transformer;
}();

var ClauseCollection =
/** @class */
function (_super) {
  __extends(ClauseCollection, _super);

  function ClauseCollection() {
    var _this = _super !== null && _super.apply(this, arguments) || this;

    _this.clauses = [];
    return _this;
  }
  /**
   * Returns all clauses in this collection.
   * @returns {Clause[]}
   */


  ClauseCollection.prototype.getClauses = function () {
    return this.clauses;
  };
  /**
   * Adds a clause to the child list.
   * @param {Clause} clause
   */


  ClauseCollection.prototype.addClause = function (clause) {
    clause.useParameterBag(this.parameterBag);
    this.clauses.push(clause);
  };
  /**
   * @inheritDoc
   */


  ClauseCollection.prototype.build = function () {
    return _map(this.clauses, function (s) {
      return s.build();
    }).join('\n') + ";";
  };

  return ClauseCollection;
}(Clause);

var Query =
/** @class */
function (_super) {
  __extends(Query, _super);
  /**
   * Creates a new query with a given connection.
   *
   * @param {Connection} connection
   */


  function Query(connection) {
    if (connection === void 0) {
      connection = null;
    }

    var _this = _super.call(this) || this;

    _this.connection = connection;
    _this.clauses = new ClauseCollection();
    return _this;
  }

  Query.prototype.continueChainClause = function (clause) {
    return this.addClause(clause);
  };
  /**
   * Runs this query on its connection. If this query was created by calling a
   * chainable method of a connection, then its connection was automatically
   * set.
   *
   * Returns a promise that resolves to an array of records. Each key of the
   * record is the name of a variable that you specified in your `RETURN`
   * clause.
   * Eg:
   * ```typescript
   * connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .run();
   * ```
   *
   * Would result in the value:
   * ```
   * [
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // first friend,
   *   },
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // second friend,
   *   },
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // third friend,
   *   },
   * ]
   * ```
   *
   * Notice how the steve record is returned for each row, this is how cypher
   * works. If you use lodash you can extract all of Steve's friends from the
   * results like using `_.map(results, 'friends')`. If you don't, you can use
   * ES2015/ES6: `results.map(record => record.friends)`.
   *
   * If you use typescript you can use the type parameter to hint at the type of
   * the return value which is `Dictionary<R>[]`.
   *
   * Throws an exception if this query does not have a connection or has no
   * clauses.
   *
   * @returns {Promise<Dictionary<R>[]>}
   */


  Query.prototype.run = function () {
    if (!this.connection) {
      return AnyPromise.reject(new Error('Cannot run query; no connection object available.'));
    }

    return this.connection.run(this);
  };
  /**
   * Runs this query on its connection. If this query was created by calling a
   * chainable method of a connection, then its connection was automatically
   * set.
   *
   * Returns an observable that emits each record as it is received from the
   * database. This is the most efficient way of working with very large
   * datasets. Each record is an object where each key is the name of a variable
   * that you specified in your return clause.
   *
   * Eg:
   * ```typescript
   * const result$ = connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .stream();
   *
   * // Emits
   * // {
   * //   steve: { ... } // steve node,
   * //   friends: { ... } // first friend,
   * // },
   * // Then emits
   * // {
   * //   steve: { ... } // steve node,
   * //   friends: { ... } // first friend,
   * // },
   * // And so on
   * ```
   *
   * Notice how the steve record is returned for each row, this is how cypher
   * works. You can extract all of steve's friends from the query by using RxJS
   * operators:
   * ```
   * const friends$ = results$.map(row => row.friends);
   * ```
   *
   * If you use typescript you can use the type parameter to hint at the type of
   * the return value which is `Observable<Dictionary<R>>`.
   *
   * Throws an exception if this query does not have a connection or has no
   * clauses.
   */


  Query.prototype.stream = function () {
    if (!this.connection) {
      return new Observable(function (subscriber) {
        subscriber.error(new Error('Cannot run query; no connection object available.'));
      });
    }

    return this.connection.stream(this);
  };
  /**
   * Runs the current query on its connection and returns the first result.
   * If the query was created by calling a chainable method of a connection,
   * the query's connection was automatically set.
   *
   * If 0 results were returned from the database, returns `undefined`.
   *
   * Returns a promise that resolves to a single record. Each key of the
   * record is the name of a variable that you specified in your `RETURN`
   * clause.
   *
   * If you use typescript you can use the type parameter to hint at the type of
   * the return value which is `Dictionary<R>`. Note that this function returns
   * `undefined` if the result set was empty.
   */


  Query.prototype.first = function () {
    return this.run().then(function (results) {
      return results && results.length > 0 ? results[0] : undefined;
    });
  }; // Clause proxied methods

  /**
   * Returns the query as a string with parameter variables.
   *
   * Eg:
   * ```typescript
   * connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .build();
   *
   * // MATCH (steve { name: $name })-[:FriendsWith]->(friends)
   * // RETURN steve, friends
   * ```
   *
   * @returns {string}
   */


  Query.prototype.build = function () {
    return this.clauses.build();
  };
  /**
   * Synonym for `build()`.
   * @returns {string}
   */


  Query.prototype.toString = function () {
    return this.clauses.toString();
  };
  /**
   * Returns an object that includes both the query and the params ready to be
   * passed to the neo4j driver.
   */


  Query.prototype.buildQueryObject = function () {
    return this.clauses.buildQueryObject();
  };
  /**
   * Like `build`, but will insert the values of the parameters into the string
   * so queries are easier to debug. __Note: this should only ever be used for
   * debugging__.
   *
   * ```typescript
   * connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .build();
   *
   * // MATCH (steve { name: 'Steve' })-[:FriendsWith]->(friends)
   * // RETURN steve, friends
   * ```
   *
   * @returns {string}
   */


  Query.prototype.interpolate = function () {
    return this.clauses.interpolate();
  };
  /**
   * Returns an array of all the clauses in this query.
   * @returns {Clause[]}
   */


  Query.prototype.getClauses = function () {
    return this.clauses.getClauses();
  };
  /**
   * Adds a new clause to the query. You probably won't ever need to call this
   * directly, but there is nothing stopping you.
   *
   * @param {Clause} clause
   * @returns {this}
   */


  Query.prototype.addClause = function (clause) {
    this.clauses.addClause(clause);
    return this;
  };

  return Query;
}(Builder);

var connections = []; // Closes all open connections

nodeCleanup(function () {
  connections.forEach(function (con) {
    return con.close();
  });
  connections = [];
});

function isCredentials(credentials) {
  return 'username' in credentials && 'password' in credentials;
} // We have to correct the type of lodash's isFunction method because it doesn't correctly narrow
// union types such as the options parameter passed to the connection constructor.


var isTrueFunction = _isFunction; // tslint:disable max-line-length

/**
 * The Connection class lets you access the Neo4j server and run queries against it. Under the hood,
 * the Connection class uses the official Neo4j Nodejs driver which manages connection pooling on a
 * [session basis]{@link https://neo4j.com/docs/api/javascript-driver/current/class/src/v1/driver.js~Driver.html#instance-method-session}.
 * It should be enough to have a single Connection instance per database per application.
 *
 * To create the connection, simply call the
 * [constructor]{@link https://jamesfer.me/cypher-query-builder/classes/connection.html#constructor}
 * and pass in the database url, username and password.
 * ```
 * const db = new Connection('bolt://localhost', {
 *   username: 'neo4j',
 *   password: 'password',
 * })
 * ```
 *
 * To use the connection, just start calling any of the clause methods such as `match`, `create` or
 * `matchNode` etc. They automatically create a {@link Query} object that you can then chain other
 * methods off of.
 * ```
 * db.matchNode('people', 'Person')
 *   .where({ 'people.age': greaterThan(18) })
 *   .return('people')
 *   .run()
 * ```
 *
 * You can also pass a query to the
 * [run]{@link https://jamesfer.me/cypher-query-builder/classes/connection.html#run} method,
 * however, this is probably much less convenient.
 * ```
 * db.run(
 *   new Query().matchNode('people', 'Person')
 *     .where({ 'people.age': greaterThan(18) })
 *     .return('people')
 *     .run()
 * );
 * ```
 *
 * Once you've finished with the connection you should close the connection.
 * ```
 * db.close()
 * ```
 *
 * The library will attempt to clean up all connections when the process exits, but it is better to
 * be explicit.
 */
// tslint:enable max-line-length

var Connection =
/** @class */
function (_super) {
  __extends(Connection, _super);
  /**
   * Creates a new connection to the database.
   *
   * @param url Url of the database such as `'bolt://localhost'`
   * @param auth Auth can either be an object in the form `{ username: ..., password: ... }`, or a
   * Neo4j AuthToken object which contains the `scheme`, `principal` and `credentials` properties
   * for more advanced authentication scenarios. The AuthToken object is what is passed directly to
   * the neo4j javascript driver so checkout their docs for more information on it.
   * @param options Additional configuration options. If you provide a function instead of an
   * object, it will be used as the driver constructor. While passing a driver constructor function
   * here is not deprecated, it is the legacy way of setting it and you should prefer to pass an
   * options object with the `driverConstructor` parameter.
   * @param options.driverConstructor An optional driver constructor to use for
   * this connection. Defaults to the official Neo4j driver. The constructor is
   * given the url you pass to this constructor and an auth token that is
   * generated from calling [`neo4j.auth.basic`]{@link
   * https://neo4j.com/docs/api/javascript-driver/current#usage-examples}.
   * @param options.driverConfig Neo4j options that are passed directly to the underlying driver.
   */


  function Connection(url, auth, options) {
    if (options === void 0) {
      options = neo4j.driver;
    }

    var _this = _super.call(this) || this;

    _this.url = url;
    _this.transformer = new Transformer();
    _this.auth = isCredentials(auth) ? neo4j.auth.basic(auth.username, auth.password) : auth;
    var driverConstructor = isTrueFunction(options) ? options : options.driverConstructor ? options.driverConstructor : neo4j.driver;
    var driverConfig = isTrueFunction(options) || !options.driverConfig ? {} : options.driverConfig;
    _this.options = {
      driverConstructor: driverConstructor,
      driverConfig: driverConfig
    };
    _this.driver = driverConstructor(_this.url, _this.auth, _this.options.driverConfig);
    _this.open = true;
    connections.push(_this);
    return _this;
  }
  /**
   * Closes this connection if it is open. Closed connections cannot be
   * reopened.
   */


  Connection.prototype.close = function () {
    if (this.open) {
      this.driver.close();
      this.open = false;
    }
  };
  /**
   * Opens and returns a session. You should never need to use this directly.
   * Your probably better off with `run` instead.
   */


  Connection.prototype.session = function () {
    if (this.open) {
      return this.driver.session();
    }

    return null;
  };
  /**
   * Returns a new query that uses this connection. The methods such as `match`
   * or `create` are probably more useful to you as they automatically create a
   * new chainable query for you.
   * @return {Query}
   */


  Connection.prototype.query = function () {
    return new Query(this);
  };

  Connection.prototype.continueChainClause = function (clause) {
    return this.query().addClause(clause);
  };
  /**
   * Runs the provided query on this connection, regardless of which connection
   * the query was created from. Each query is run on it's own session.
   *
   * Run returns a promise that resolves to an array of records. Each key of the
   * record is the name of a variable that you specified in your `RETURN`
   * clause.
   * Eg:
   * ```typescript
   * connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .run();
   * ```
   *
   * Would result in the value:
   * ```
   * [
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // first friend,
   *   },
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // second friend,
   *   },
   *   {
   *     steve: { ... } // steve node,
   *     friends: { ... } // third friend,
   *   },
   * ]
   * ```
   *
   * Notice how the steve record is returned for each row, this is how cypher
   * works. If you use lodash you can extract all of Steve's friends from the
   * results like using `_.map(results, 'friends')`. If you don't, you can use
   * ES2015/ES6: `results.map(record => record.friends)`.
   *
   * If you use typescript you can use the type parameter to hint at the type of
   * the return value which is `Dictionary<R>[]`.
   *
   * Throws an exception if this connection is not open or there are no clauses
   * in the query.
   *
   * @param {Query} query
   * @returns {Promise<Dictionary<R>[]>}
   */


  Connection.prototype.run = function (query) {
    var _this = this;

    if (!this.open) {
      return AnyPromise.reject(new Error('Cannot run query; connection is not open.'));
    }

    if (query.getClauses().length === 0) {
      return AnyPromise.reject(new Error('Cannot run query: no clauses attached to the query.'));
    }

    var session = this.session();

    if (!session) {
      throw Error('Cannot run query: connection is not open.');
    }

    var queryObj = query.buildQueryObject();
    var result = session.run(queryObj.query, queryObj.params); // Need to wrap promise in an any-promise

    return AnyPromise.resolve(result).then(function (result) {
      session.close();
      return _this.transformer.transformRecords(result.records);
    }).catch(function (error) {
      session.close();
      return Promise.reject(error);
    });
  };
  /**
   * Runs the provided query on this connection, regardless of which connection
   * the query was created from. Each query is run on it's own session.
   *
   * Returns an observable that emits each record as it is received from the
   * database. This is the most efficient way of working with very large
   * datasets. Each record is an object where each key is the name of a variable
   * that you specified in your return clause.
   *
   * Eg:
   * ```typescript
   * const results$ = connection.match([
   *   node('steve', { name: 'Steve' }),
   *   relation('out', [ 'FriendsWith' ]),
   *   node('friends'),
   * ])
   *   .return([ 'steve', 'friends' ])
   *   .stream();
   *
   * // Emits
   * // {
   * //   steve: { ... } // steve node,
   * //   friends: { ... } // first friend,
   * // },
   * // Then emits
   * // {
   * //   steve: { ... } // steve node,
   * //   friends: { ... } // first friend,
   * // },
   * // And so on
   * ```
   *
   * Notice how the steve record is returned for each row, this is how cypher
   * works. You can extract all of steve's friends from the query by using
   * operators:
   * ```
   * const friends$ = results$.map(row => row.friends);
   * ```
   *
   * The observable class that is used is imported from
   * [any-observable](https://github.com/sindresorhus/any-observable) by default
   * it uses rxjs for the observables, but you can pick a different implementation
   * by registering it with any-observable before importing this module.
   *
   * If you use typescript you can use the type parameter to hint at the type of
   * the return value which is `Dictionary<R>`.
   *
   * Throws an exception if this connection is not open or there are no clauses
   * in the query.
   *
   * The query is run when you call stream so you should subscribe to the results
   * immediately to prevent missing any data.
   *
   * Due to the way the Neo4j javascript driver works, once you call stream there
   * is no way to stop the query until it is complete. Even if you unsubscribe from
   * the observable, all the remaining rows will still be parsed by the driver but
   * then immediately discarded.
   * ```typescript
   * const results$ = connection.matchNode('records')
   *   .return('records')
   *   .limit(1000) // 1000 records will be loaded and parsed from the database
   *   .stream()
   *   .take(10) // even though you only take the first 10
   *   .subscribe(record => {});
   * ```
   * In practice this should never happen unless you're doing some strange things.
   */


  Connection.prototype.stream = function (query) {
    var _this = this;

    return new Observable(function (subscriber) {
      if (!_this.open) {
        subscriber.error(new Error('Cannot run query; connection is not open.'));
        return;
      }

      if (query.getClauses().length === 0) {
        subscriber.error(Error('Cannot run query: no clauses attached to the query.'));
        return;
      }

      var session = _this.session();

      if (!session) {
        throw Error('Cannot run query: connection is not open.');
      } // Run the query


      var queryObj = query.buildQueryObject();
      var result = session.run(queryObj.query, queryObj.params); // Subscribe to the result and clean up the session
      // Note: Neo4j observables use a different subscribe syntax to RxJS observables

      result.subscribe({
        onNext: function (record) {
          if (!subscriber.closed) {
            subscriber.next(_this.transformer.transformRecord(record));
          }
        },
        onError: function (error) {
          session.close();

          if (!subscriber.closed) {
            subscriber.error(error);
          }
        },
        onCompleted: function () {
          session.close();

          if (!subscriber.closed) {
            subscriber.complete();
          }
        }
      });
    });
  };

  return Connection;
}(Builder);

export { Builder, Clause, ClauseCollection, Connection, Create, Delete, Limit, Match, Merge, NodePattern, OnCreate, OnMatch, OrderBy, Query, Raw, RelationPattern, Remove, Return, Set, SetBlock, Skip, Transformer, Unwind, Where, With, and, between, comparisions, contains, endsWith, equals, exists, greaterEqualTo, greaterThan, hasLabel, inArray, isNull, lessEqualTo, lessThan, node, not, operators, or, regexp, relation, startsWith, xor };
//# sourceMappingURL=esm5.js.map
