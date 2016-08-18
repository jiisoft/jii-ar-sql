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
 * @class Jii.sql.TableSchema
 * @extends Jii.base.ModelSchema
 */
Jii.defineClass('Jii.sql.TableSchema', /** @lends Jii.sql.TableSchema.prototype */{

	__extends: 'Jii.base.ModelSchema',

	/**
	 * @var {string} the name of this table. The schema name is not included. Use [[fullName]] to get the name with schema name prefix.
	 */
	name: null,

	/**
	 * @var {string} the full name of this table, which includes the schema name prefix, if any.
	 * Note that if the schema name is the same as the [[Schema::defaultSchema|default schema name]],
	 * the schema name will not be included.
	 */
	fullName: null,

	/**
	 * @var {string} sequence name for the primary key. Null if no sequence.
	 */
	sequenceName: null,

	/**
	 * @var array foreign keys of this table. Each array element is of the following structure:
	 *
	 * ~~~
	 * {
	 *  0: 'ForeignTableName',
	 *  fk1: 'pk1',  // pk1 is in foreign table
	 *  fk2: 'pk2',  // if composite foreign key
	 * }
	 * ~~~
	 */
	foreignKeys: null,

	/**
	 * Manually specifies the primary key for this table.
	 * @param {string|string[]} keys the primary key (can be composite)
	 * @throws InvalidParamException if the specified key cannot be found in the table.
	 */
	fixPrimaryKey(keys) {
		if (!Jii._.isArray(keys)) {
			keys = [keys];
		}

		this.primaryKey = keys;

		Jii._.each(this.columns, column => {
			column.isPrimaryKey = false;
		});

		Jii._.each(keys, key => {
			if (Jii._.has(this.columns, key)) {
				this.columns[key].isPrimaryKey = true;
			} else {
				throw new Jii.exceptions.InvalidParamException('Primary key `key` cannot be found in table `' + key + '`.');
			}
		});
	}

});
