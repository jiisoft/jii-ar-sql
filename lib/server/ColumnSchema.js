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
 * @class Jii.sql.ColumnSchema
 * @extends Jii.base.ModelAttributeSchema
 */
Jii.defineClass('Jii.sql.ColumnSchema', /** @lends Jii.sql.ColumnSchema.prototype */{

	__extends: 'Jii.base.ModelAttributeSchema',

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
	comment: null,

	/**
	 * Converts the input value according to [[jsType]].
	 * If the value is null or an [[Expression]], it will not be converted.
	 * @param {*} value input value
	 * @return {*} converted value
	 */
	typecast(value) {
		if (value === '' && this.type !== Jii.sql.BaseSchema.TYPE_TEXT &&
			this.type !== Jii.sql.BaseSchema.TYPE_STRING &&
			this.type !== Jii.sql.BaseSchema.TYPE_BINARY) {
			return null;
		}

		// @todo php->js types
		if (value === null || typeof(value) === this.jsType || value instanceof Jii.sql.Expression) {
			return value;
		}

		switch (this.jsType) {
			case 'string':
				return String(value);

			case 'number':
				return Jii._.isBoolean(value) ?
					(value ? 1 : 0) :
					parseFloat(value);

			case 'boolean':
				return !!value;
		}

		return value;
	}

});
