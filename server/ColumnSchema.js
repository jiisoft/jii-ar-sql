/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var BaseSchema = require('./BaseSchema');
var Expression = require('jii-model/model/Expression');
var _isBoolean = require('lodash/isBoolean');
var ModelAttributeSchema = require('jii-model/base/ModelAttributeSchema');

/**
 * @class Jii.sql.ColumnSchema
 * @extends Jii.base.ModelAttributeSchema
 */
var ColumnSchema = Jii.defineClass('Jii.sql.ColumnSchema', /** @lends Jii.sql.ColumnSchema.prototype */{

	__extends: ModelAttributeSchema,

	/**
	 * @var {boolean} whether this column can be null.
	 */
	allowNull: null,

	/**
	 * @var {string} the DB type of this column. Possible DB types vary according to the type of DBMS.
	 */
	dbType: null,

	/**
	 * @var {string[]} enumerable values. This is set only if the column is declared to be an enumerable type.
	 */
	enumValues: null,

	/**
	 * @var {number} display size of the column.
	 */
	size: null,

	/**
	 * @var {number} precision of the column data, if it is numeric.
	 */
	precision: null,

	/**
	 * @var {number} scale of the column data, if it is numeric.
	 */
	scale: null,

	/**
	 * @var {boolean} whether this column is auto-incremental
	 */
	autoIncrement: false,

	/**
	 * @var {boolean} whether this column is unsigned. This is only meaningful
	 * when [[type]] is `smallint`, `integer` or `bigint`.
	 */
	unsigned: null,

	/**
	 * @var {string} comment of this column. Not all DBMS support this.
	 */
	comment: null

});

module.exports = ColumnSchema;