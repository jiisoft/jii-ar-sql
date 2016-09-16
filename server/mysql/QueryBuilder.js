
'use strict';

var Jii = require('jii');
var ApplicationException = require('jii/exceptions/ApplicationException');
var InvalidParamException = require('jii/exceptions/InvalidParamException');
var _values = require('lodash/values');
var _each = require('lodash/each');
var _first = require('lodash/first');
var QueryBuilder = require('../QueryBuilder');
var BaseSchema = require('../BaseSchema');

/**
 * QueryBuilder is the query builder for MySQL databases.
 *
 * @class Jii.sql.mysql.QueryBuilder
 * @extends Jii.sql.QueryBuilder
 */
module.exports = Jii.defineClass('Jii.sql.mysql.QueryBuilder', /** @lends Jii.sql.mysql.QueryBuilder.prototype */{

	__extends: QueryBuilder,

	/**
	 * @type {object} mapping from abstract column types (keys) to physical column types (values).
	 */
	typeMap: {
		[BaseSchema.TYPE_PK]: 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY',
		[BaseSchema.TYPE_BIGPK]: 'bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY',
		[BaseSchema.TYPE_STRING]: 'varchar(255)',
		[BaseSchema.TYPE_TEXT]: 'text',
		[BaseSchema.TYPE_SMALLINT]: 'smallint(6)',
		[BaseSchema.TYPE_INTEGER]: 'int(11)',
		[BaseSchema.TYPE_BIGINT]: 'bigint(20)',
		[BaseSchema.TYPE_FLOAT]: 'float',
		[BaseSchema.TYPE_DECIMAL]: 'decimal(10,0)',
		[BaseSchema.TYPE_DATETIME]: 'datetime',
		[BaseSchema.TYPE_TIMESTAMP]: 'timestamp',
		[BaseSchema.TYPE_TIME]: 'time',
		[BaseSchema.TYPE_DATE]: 'date',
		[BaseSchema.TYPE_BINARY]: 'blob',
		[BaseSchema.TYPE_BOOLEAN]: 'tinyint(1)',
		[BaseSchema.TYPE_MONEY]: 'decimal(19,4)'
	},

	/**
	 * Builds a SQL statement for renaming a column.
	 * @param {string} table the table whose column is to be renamed. The name will be properly quoted by the method.
	 * @param {string} oldName the old name of the column. The name will be properly quoted by the method.
	 * @param {string} newName the new name() of the column. The name will be properly quoted by the method.
	 * @returns {string} the SQL statement for renaming a DB column.
	 * @throws Jii.exceptions.ApplicationException
	 */
	renameColumn(table, oldName, newName) {
		var quoteTable = this.db.quoteTableName(table);
		var sql = 'SHOW CREATE TABLE ' + quoteTable;

		return this.db.createCommand(sql).queryOne().then(row => {
			if (row === null) {
				throw new ApplicationException('Unable to find column `' + oldName + '` in table `' + table + '`.');
			}

			var sql = row['Create Table'] || _values(row)[1];
			var options = '';
			_each(sql.split('\n'), sqlLine => {
				if (options) {
					return;
				}

				var matches = /^\s*`(.*?)`\s+(.*?),?/g.exec(sqlLine);
				if (matches !== null && matches[1] === oldName) {
					options = matches[1];
				}
			});

			// try to give back a SQL anyway
			return 'ALTER TABLE ' + quoteTable + ' CHANGE ' +
				this.db.quoteColumnName(oldName) + ' ' +
				this.db.quoteColumnName(newName) + (options ? ' ' + options : '');
		});
	},

	/**
	 * Builds a SQL statement for dropping a foreign key constraint.
	 * @param {string} name the name of the foreign key constraint to be dropped. The name will be properly quoted by the method.
	 * @param {string} table the table whose foreign is to be dropped. The name will be properly quoted by the method.
	 * @returns {string} the SQL statement for dropping a foreign key constraint.
	 */
	dropForeignKey(name, table) {
		return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) +
			' DROP FOREIGN KEY ' + this.db.quoteColumnName(name));
	},

	/**
	 * Builds a SQL statement for removing a primary key constraint to an existing table.
	 * @param {string} name the name of the primary key constraint to be removed.
	 * @param {string} table the table that the primary key constraint will be removed from.
	 * @returns {string} the SQL statement for removing a primary key constraint from an existing table.
	 */
	dropPrimaryKey(name, table) {
		return Promise.resolve('ALTER TABLE ' + this.db.quoteTableName(table) + ' DROP PRIMARY KEY');
	},

	/**
	 * Creates a SQL statement for resetting the sequence value of a table's primary key.
	 * The sequence will be reset such that the primary key of the next new row() inserted
	 * will have the specified value or 1.
	 * @param {string} tableName the name of the table whose primary key sequence will be reset
	 * @param {*} [value] the value for the primary key of the next new row() inserted. If this is not set,
	 * the next new row()'s primary key will have a value 1.
	 * @returns {string} the SQL statement for resetting sequence
	 * @throws Jii.exceptions.InvalidParamException if the table does not exist or there is no sequence associated with the table.
	 */
	resetSequence(tableName, value) {
		value = value || null;

		var table = this.db.getTableSchema(tableName);
		if (table === null) {
			throw new InvalidParamException('Table not found: `' + tableName + '`');
		}
		if (table.sequenceName === null) {
			throw new InvalidParamException('There is no sequence associated with table `' + tableName + '`.');
		}

		var quoteTableName = this.db.quoteTableName(tableName);

		if (value === null) {
			var sql = 'SELECT MAX(`' + _first(table.primaryKey) + '`) FROM ' + quoteTableName;
			return this.db.createCommand(sql).queryScalar().then(value => {
				return 'ALTER TABLE ' + quoteTableName + ' AUTO_INCREMENT=' + (value + 1);
			});
		}

		return Promise.resolve('ALTER TABLE ' + quoteTableName + ' AUTO_INCREMENT=' + parseInt(value));
	},

	/**
	 * Builds a SQL statement for enabling or disabling integrity check.
	 * @param {boolean} [check] whether to turn on or off the integrity check.
	 * @param {string} [table] the table name. Meaningless for MySQL.
	 * @param {string} [schema] the schema of the tables. Meaningless for MySQL.
	 * @returns {string} the SQL statement for checking integrity
	 */
	checkIntegrity(check, schema, table) {
		check = check || true;
		schema = schema || '';
		table = table || '';

		return Promise.resolve('SET FOREIGN_KEY_CHECKS = ' + (check ? 1 : 0));
	},

	/**
	 * @inheritdoc
	 */
	buildLimit(limit, offset) {
		var sql = '';
		if (this._hasLimit(limit)) {
			sql = 'LIMIT ' + limit;
			if (this._hasOffset(offset)) {
				sql += ' OFFSET ' + offset;
			}
		} else if (this._hasOffset(offset)) {
			// limit is not optional in MySQL
			// http://stackoverflow.com/a/271650/1106908
			// http://dev.mysql.com/doc/refman/5.0/en/select.html#idm47619502796240
			sql = "LIMIT " + offset + ", 18446744073709551615"; // 2^64-1
		}

		return Promise.resolve(sql);
	}

});