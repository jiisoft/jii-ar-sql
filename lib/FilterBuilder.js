/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 * @class Jii.sql.FilterBuilder
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.sql.FilterBuilder', /** @lends Jii.sql.FilterBuilder.prototype */{

	__extends: 'Jii.base.Object',

	/**
	 * @var array map of query condition to builder methods.
	 * These methods are used by [[buildCondition]] to build SQL conditions from array syntax.
	 */
	_conditionBuilders: {
		'NOT': ['filterNotCondition', 'attributesNotCondition'],
		'AND': ['filterAndCondition', 'attributesAndCondition'],
		'OR': ['filterAndCondition', 'attributesAndCondition'],
		'BETWEEN': ['filterBetweenCondition', 'attributesBetweenCondition'],
		'IN': ['filterInCondition', 'attributesInCondition'],
		'LIKE': ['filterLikeCondition', 'attributesLikeCondition'],
		'OR LIKE': ['filterLikeCondition', 'attributesLikeCondition'],
		'EXISTS': ['filterExistsCondition', 'attributesExistsCondition']
	},

    prepare: function(query) {
        // @todo prepare, tmp
        if (query instanceof Jii.sql.ActiveQuery) {
            query._filterByModels([query.primaryModel]);
        }
    },

    filter: function(row, query) {
        return this.filterCondition(row, query.getWhere());
    },

    attributes: function(query) {
        return Jii._.uniq(this.attributesCondition(query.getWhere()));
    },

    createFilter: function(query) {
        return function(row) {
            if (row instanceof Jii.base.Model) {
                row = row.getAttributes();
            }
            return this.filter(row, query);
        }.bind(this);
    },

    filterCondition: function(row, condition) {
		if (Jii._.isEmpty(condition)) {
			return true;
		}

		if (condition[0]) { // operator format: operator, operand 1, operand 2, ...
            condition = [].concat(condition);

			var operator = condition[0].toUpperCase();
			var method = this._conditionBuilders[operator] ? this._conditionBuilders[operator][0] : 'filterSimpleCondition';

            if (operator.indexOf('NOT ') !== -1) {
                condition[0] = condition[0].toUpperCase().replace(/NOT /, '');
                return this.filterNotCondition(row, 'NOT', [condition])
            }

            condition.shift();
			return this[method].call(this, row, operator, condition);

		} else { // hash format: {'column1': 'value1', 'column2': 'value2', ...}
			return this.filterHashCondition(row, condition);
		}
	},

    attributesCondition: function(condition) {
        if (Jii._.isEmpty(condition)) {
            return [];
        }

        if (condition[0]) { // operator format: operator, operand 1, operand 2, ...
            condition = [].concat(condition);

            var operator = condition[0].toUpperCase();
            var method = this._conditionBuilders[operator] ? this._conditionBuilders[operator][1] : 'attributesSimpleCondition';

            if (operator.indexOf('NOT ') !== -1) {
                condition[0] = condition[0].toUpperCase().replace(/NOT /, '');
                return this.attributesNotCondition('NOT', [condition])
            }

            condition.shift();
            return this[method].call(this, operator, condition);

        } else { // hash format: {'column1': 'value1', 'column2': 'value2', ...}
            return this.attributesHashCondition(condition);
        }
    },

    filterHashCondition: function(row, condition) {
		return Jii._.every(condition, function(value, column) {
			if (Jii._.isArray(value) || value instanceof Jii.sql.Query) {
				// IN condition
                return this.filterInCondition(row, 'IN', [column, value]);
			}

            // Null
            if (value === null) {
                return row[column] === null;
            }

            // Null
            if (value instanceof Jii.sql.Expression) {
                // @todo implement
                throw new Jii.exceptions.NotSupportedException();
            }

            return row[column] == value;
		}.bind(this));
	},

    attributesHashCondition: function(condition) {
        return Jii._.keys(condition);
    },

    filterAndCondition: function(row, operator, operands) {
        var method = operator === 'AND' ? 'every' : 'some';
        return Jii._[method](operands, function(operand) {
            if (Jii._.isArray(operand) || Jii._.isObject(operand)) {
                return this.filterCondition(row, operand);
            }

            // @todo implement.. string?
            throw new Jii.exceptions.NotSupportedException();
        }.bind(this));
	},

    attributesAndCondition: function(operator, operands) {
        var attributes = [];
        Jii._.each(operands, function(operand) {
            if (Jii._.isArray(operand) || Jii._.isObject(operand)) {
                attributes = attributes.concat(this.attributesCondition(operand));
            } else {
                // @todo implement.. string?
                throw new Jii.exceptions.NotSupportedException();
            }
        }.bind(this));
        return attributes;
    },

    filterNotCondition: function(row, operator, operands) {
		if (operands.length !== 1) {
			throw new Jii.exceptions.InvalidParamException("Operator `" + operator + "` requires exactly one operand.");
		}

        var bool = true;
        if (Jii._.isArray(operands[0]) || Jii._.isObject(operands[0])) {
            bool = this.filterCondition(row, operands[0]);
        }

        return operator === 'NOT' ? !bool : bool;
	},

    attributesNotCondition: function(operator, operands) {
        return this.attributesAndCondition(operator, operands);
    },

    filterBetweenCondition: function(row, operator, operands) {
		if (operands.length !== 3) {
			throw new Jii.exceptions.InvalidParamException('Operator `' + operator + '` requires three operands.');
		}

        var column = operands[0];
        var value1 = operands[1];
        var value2 = operands[2];

        return value1 <= row[column] && row[column] <= value2;
	},

    attributesBetweenCondition: function(operator, operands) {
        return operands[0];
    },

    filterInCondition: function(row, operator, operands) {
		if (operands.length !== 2) {
			throw new Jii.exceptions.InvalidParamException('Operator `' + operator + '` requires two operands.');
		}

		var column = operands[0];
		var values = operands[1];

		if (Jii._.isEmpty(values) || Jii._.isEmpty(column)) {
			return false;
		}

		if (values instanceof Jii.sql.Query) {
			// sub-query
			throw new Jii.exceptions.NotSupportedException();
		}

		if (!Jii._.isArray(values)) {
			values = [values];
		}

		if (Jii._.isArray(column) && column.length > 1) {
            // @todo
            throw new Jii.exceptions.NotSupportedException();
		}

		if (Jii._.isArray(column)) {
			column = column[0];
		}

		return Jii._.some(values, function(value) {
			if (Jii._.isObject(value)) {
				value = Jii._.has(value, column) ? value[column] : null;
			}

			if (value === null) {
				return row[column] === null;
			}
            if (value instanceof Jii.sql.Expression) {
                // @todo
                throw new Jii.exceptions.NotSupportedException();
			}

            return row[column] == value;
		}.bind(this));
	},

    attributesInCondition: function(operator, operands) {
        return [].concat(operands[0]);
    },




	/**
	 * Creates an SQL expressions with the `LIKE` operator.
	 * @param {string} operator the operator to use (e.g. `LIKE`, `NOT LIKE`, `OR LIKE` or `OR NOT LIKE`)
	 * @param {[]} operands an array of two or three operands
	 *
	 * - The first operand is the column name.
	 * - The second operand is a single value or an array of values that column value
	 *   should be compared with. If it is an empty array the generated expression will
	 *   be a `false` value if operator is `LIKE` or `OR LIKE`, and empty if operator
	 *   is `NOT LIKE` or `OR NOT LIKE`.
	 * - An optional third operand can also be provided to specify how to escape special characters
	 *   in the value(s). The operand should be an array of mappings from the special characters to their
	 *   escaped counterparts. If this operand is not provided, a default escape mapping will be used.
	 *   You may use `false` or an empty array to indicate the values are already escaped and no escape
	 *   should be applied. Note that when using an escape mapping (or the third operand is not provided),
	 *   the values will be automatically enclosed within a pair of percentage characters.
	 * @param {object} params the binding parameters to be populated
	 * @return {string} the generated SQL expression
	 * @throws {Jii.exceptions.InvalidParamException} if wrong number of operands have been given.
	 */
    filterLikeCondition: function(operator, operands, params) {
		if (operands.length !== 2) {
			throw new Jii.exceptions.InvalidParamException('Operator `' + operator + '` requires two operands.');
		}

		var escape = operands[2] || {'%': '\\%', '_': '\\_', '\\': '\\\\'};
		delete operands[2];

		var matches = /^(AND |OR |)((NOT |)I?LIKE)/.exec(operator);
		if (matches === null) {
			throw new Jii.exceptions.InvalidParamException('Invalid operator `' + operator + '`.');
		}


        // @todo http://stackoverflow.com/questions/1314045/emulating-sql-like-in-javascript
        throw new Jii.exceptions.NotSupportedException();


		/*var andor = ' ' + (matches[1] || 'AND ');
		var not = !!matches[3];
		var parsedOperator = matches[2];

		var column = operands[0];
		var values = operands[1];

		if (Jii._.isEmpty(values)) {
			return Promise.resolve(not ? '' : '0=1');
		}

		if (!Jii._.isArray(values)) {
			values = [values];
		}
		if (column.indexOf('(') === -1) {
			column = this.db.quoteColumnName(column);
		}

		var parts = [];
		Jii._.each(values, function(value) {
			var phName = null;
			if (value instanceof Jii.sql.Expression) {
				Jii._.each(value.params, function(n, v) {
					params[n] = v;
				});
				phName = value.expression;
			} else {
				phName = this.__static.PARAM_PREFIX + Jii._.size(params);

				if (!Jii._.isEmpty(escape)) {
					Jii._.each(escape, function (to, from) {
						value = value.split(from).join(to);
					});
					value = '%' + value + '%';
				}
				params[phName] = value;
			}

			parts.push(column + ' ' + parsedOperator + ' ' + phName);
		}.bind(this));

		return Promise.resolve(parts.join(andor));*/
	},

	/**
	 * Creates an SQL expressions with the `EXISTS` operator.
	 * @param {string} operator the operator to use (e.g. `EXISTS` or `NOT EXISTS`)
	 * @param {[]} operands contains only one element which is a [[Query]] object representing the sub-query.
	 * @param {object} params the binding parameters to be populated
	 * @return {string} the generated SQL expression
	 * @throws {Jii.exceptions.InvalidParamException} if the operand is not a [[Query]] object.
	 */
    filterExistsCondition: function(operator, operands, params) {
        throw new Jii.exceptions.NotSupportedException();
	},

	/**
	 * Creates an SQL expressions like `"column" operator value`.
	 * @param {string} operator the operator to use. Anything could be used e.g. `>`, `<=`, etc.
	 * @param {[]} operands contains two column names.
	 * @param {object} params the binding parameters to be populated
	 * @returns {string} the generated SQL expression
	 * @throws InvalidParamException if wrong number of operands have been given.
	 */
    filterSimpleCondition: function (operator, operands, params) {
		if (operands.length !== 2) {
			throw new Jii.exceptions.InvalidParamException("Operator `" + operator + "` requires two operands.");
		}

		var column = operands[0];
		var value = operands[1];

        // @todo
        throw new Jii.exceptions.NotSupportedException();
/*
		var condition = null;

		if (value === null) {
			condition = column + ' ' + operator + ' NULL';
		} else if (value instanceof Jii.sql.Expression) {
			Jii._.each(value.params, function(v, n) {
				params[n] = v;
			}.bind(this));
			condition = column + ' ' + operator + ' ' + value.expression;
		} else {
			var phName = this.__static.PARAM_PREFIX + Jii._.size(params);
			params[phName] = value;
			condition = column + ' ' + operator + ' ' + phName;
		}

		return Promise.resolve(condition);*/
	}

});
