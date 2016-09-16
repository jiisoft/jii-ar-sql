/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var QueryBuilder = require('./QueryBuilder');
var TableSchema = require('../TableSchema');
var Expression = require('../../Expression');
var SqlQueryException = require('../SqlQueryException');
var _has = require('lodash/has');
var _each = require('lodash/each');
var _values = require('lodash/values');
var _trim = require('lodash/trim');
var _trimStart = require('lodash/trimStart');
var _trimEnd = require('lodash/trimEnd');
var BaseSchema = require('../BaseSchema');

/**
 * @class Jii.sql.mysql.Schema
 * @extends BaseSchema
 */
module.exports = Jii.defineClass('Jii.sql.mysql.Schema', /** @lends Jii.sql.mysql.Schema.prototype */{

	__extends: BaseSchema,

	/**
	 * @var array mapping from physical column types (keys) to abstract column types (values)
	 */
	typeMap: {
		tinyint: BaseSchema.TYPE_SMALLINT,
		bit: BaseSchema.TYPE_SMALLINT,
		smallint: BaseSchema.TYPE_SMALLINT,
		mediumint: BaseSchema.TYPE_INTEGER,
		int: BaseSchema.TYPE_INTEGER,
		integer: BaseSchema.TYPE_INTEGER,
		bigint: BaseSchema.TYPE_BIGINT,
		float: BaseSchema.TYPE_FLOAT,
		double: BaseSchema.TYPE_FLOAT,
		real: BaseSchema.TYPE_FLOAT,
		decimal: BaseSchema.TYPE_DECIMAL,
		numeric: BaseSchema.TYPE_DECIMAL,
		tinytext: BaseSchema.TYPE_TEXT,
		mediumtext: BaseSchema.TYPE_TEXT,
		longtext: BaseSchema.TYPE_TEXT,
		longblob: BaseSchema.TYPE_BINARY,
		blob: BaseSchema.TYPE_BINARY,
		text: BaseSchema.TYPE_TEXT,
		varchar: BaseSchema.TYPE_STRING,
		string: BaseSchema.TYPE_STRING,
		char: BaseSchema.TYPE_STRING,
		datetime: BaseSchema.TYPE_DATETIME,
		year: BaseSchema.TYPE_DATE,
		date: BaseSchema.TYPE_DATE,
		time: BaseSchema.TYPE_TIME,
		timestamp: BaseSchema.TYPE_TIMESTAMP,
		enum: BaseSchema.TYPE_STRING
	},

	/**
	 * Quotes a table name for use in a query.
	 * A simple table name has no schema prefix.
	 * @param {string} name table name
	 * @return {string} the properly quoted table name
	 */
	quoteSimpleTableName(name) {
		return name.indexOf('`') !== -1 ? name : '`' + name + '`';
	},

	/**
	 * Quotes a column name for use in a query.
	 * A simple column name has no prefix.
	 * @param {string} name column name
	 * @return {string} the properly quoted column name
	 */
	quoteSimpleColumnName(name) {
		return name.indexOf('`') !== -1 || name === '*' ? name : '`' + name + '`';
	},

	/**
	 * Creates a query builder for the MySQL database.
	 * @return {Jii.sql.mysql.QueryBuilder} query builder instance
	 */
	createQueryBuilder() {
		return new QueryBuilder(this.db);
	},

	/**
	 * Loads the metadata for the specified table.
	 * @param {string} name table name
	 * @return {Jii.sql.TableSchema} driver dependent table metadata. Null if the table does not exist.
	 */
	_loadTableSchema(name) {
		var table = new TableSchema();
		this._resolveTableNames(table, name);

		return this._findColumns(table).then(() => {
			return this._findConstraints(table);
		}, () => {
			table = null;
		}).then(() => {
			return table;
		});
	},

	/**
	 * Resolves the table name and schema name (if any).
	 * @param {Jii.sql.TableSchema} table the table metadata object
	 * @param {string} name the table name
	 */
	_resolveTableNames(table, name) {
		var parts = name.replace(/`/g, '').split('.');
		if (parts.length > 1) {

			table.schemaName = parts[0];
			table.name = parts[1];
			table.fullName = table.schemaName + '.' + table.name;
		} else {

			table.fullName = table.name = parts[0];
		}
	},

	/**
	 * Loads the column information into a [[ColumnSchema]] object.
	 * @param {object} info column information
	 * @return {Jii.sql.ColumnSchema} the column schema object
	 */
	_loadColumnSchema(info) {
		var column = this._createColumnSchema();

		column.name = info.Field;
		column.allowNull = info.Null === 'YES';
		column.isPrimaryKey = info.Key.indexOf('PRI') !== -1;
		column.autoIncrement = info.Extra.toLowerCase().indexOf('auto_increment') !== -1;
		column.comment = info.Comment;

		column.dbType = info.Type;
		column.unsigned = column.dbType.indexOf('unsigned') !== -1;

		column.type = this.__static.TYPE_STRING;

		var type = null;
		var matches = /^(\w+)(?:\(([^\)]+)\))?/.exec(column.dbType);
		if (matches !== null) {
			type = matches[1];
			if (_has(this.typeMap, type)) {
				column.type = this.typeMap[type];
			}

			if (matches[2]) {
				var values = matches[2].split(',');
				if (type === 'enum') {
					_each(values, (value, i) => {
						values[i] = _trim(value, "'");
					});
					column.enumValues = values;
				} else {
					column.size = parseInt(values[0]);
					column.precision = parseInt(values[0]);

					if (values[1]) {
						column.scale = parseInt(values[1]);
					}

					if (column.size === 1 && type === 'bit') {
						column.type = 'boolean';
					} else if (type === 'bit') {
						if (column.size > 32) {
							column.type = 'bigint';
						} else if (column.size === 32) {
							column.type = 'integer';
						}
					}
				}
			}
		}

		column.jsType = type === 'bit' ? 'string' : this._getColumnJsType(column);

		if (!column.isPrimaryKey) {
			if (column.type === 'timestamp' && info.Default === 'CURRENT_TIMESTAMP') {
				column.defaultValue = new Expression('CURRENT_TIMESTAMP');
			} else if (type === 'bit') {
				column.defaultValue = _trimStart(_trimEnd(info.Default, '\''), 'b\'');
			} else {
				column.defaultValue = column.typecast(info.Default);
			}
		}

		return column;
	},

	/**
	 * Collects the metadata of table columns.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 * @return {Promise} whether the table exists in the database
	 * @throws \Exception if DB query fails
	 */
	_findColumns(table) {
		var sql = 'SHOW FULL COLUMNS FROM ' + this.quoteTableName(table.fullName);

		return this.db.createCommand(sql).queryAll().then(columns => {
			if (columns === false) {
				return Promise.reject(new SqlQueryException('Can not get metadata of table `' + table.name + '`'));
			}

			_each(columns, info => {
				var column = this._loadColumnSchema(info);

				table.columns[column.name] = column;
				if (column.isPrimaryKey) {
					table.primaryKey.push(column.name);
					if (column.autoIncrement) {
						table.sequenceName = '';
					}
				}
			});

			return Promise.resolve();
		})
		.catch(exception => {
			// @todo Php code:
			//var previous = e.getPrevious();
			//if (previous instanceof \PDOException && previous.getCode() == '42S02') {
			// table does not exist
			//}
			//throw e;
			console.warn(exception.toString());

			return Promise.reject();
		});
	},

	/**
	 * Gets the CREATE TABLE sql string.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 * @return {Promise} sql the result of 'SHOW CREATE TABLE'
	 */
	_getCreateTableSql(table) {
		var sql = 'SHOW CREATE TABLE ' + this.quoteSimpleTableName(table.name);

		return this.db.createCommand(sql).queryOne().then(row => {
			if (row === false) {
				return Promise.reject(new SqlQueryException('Can not get CREATE TABLE sql for table `' + table.name + '`'));
			}

			return _has(row, 'Create Table') ?
				row['Create Table'] :
				_values(row)[1];
		});
	},

	/**
	 * Collects the foreign key column details for the given table.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 */
	_findConstraints(table) {
		return this._getCreateTableSql(table).then(sql => {
			var regexp = /FOREIGN KEY\s+\(([^\)]+)\)\s+REFERENCES\s+([^\(^\s]+)\s*\(([^\)]+)\)/i;
			var processKeys = strKeys => {
				var arrKeys = strKeys.replace(/`/g, '').split(',');
				_each(arrKeys, (key, i) => {
					arrKeys[i] = _trim(key);
				});
				return arrKeys;
			};

			table.foreignKeys = table.foreignKeys || [];

			var k = 0;
			var index = -1;
			while (true) {
				var previousIndex = index;
				index = sql.indexOf('FOREIGN KEY', index + 1);

				var foreignPart = sql.substr(previousIndex, (index > 0 ? index : sql.length) - previousIndex);
				var matches = regexp.exec(foreignPart);
				if (matches !== null) {
					var fks = processKeys(matches[1]);
					var pks = processKeys(matches[3]);

					var constraint = {
						0: matches[2].replace(/`/g, '')
					};
					for (var i = 0, l = fks.length; i < l; i++) {
						constraint[fks[i]] = pks[i];
					}
					table.foreignKeys[k++] = constraint;
				}

				if (index === -1) {
					break;
				}
			}
		});
	},

	/**
	 * Returns all unique indexes for the given table.
	 * Each array element is of the following structure:
	 *
	 * ~~~
	 * {
	 *  IndexName1: ['col1' [, ...]],
	 *  IndexName2: ['col2' [, ...]],
	 * }
	 * ~~~
	 *
	 * @param {Jii.sql.TableSchema} table the table metadata
	 * @return {Promise} all unique indexes for the given table.
	 */
	findUniqueIndexes(table) {
		return this._getCreateTableSql(table).then(sql => {

			var uniqueIndexes = [];

			var regexp = /UNIQUE KEY\s+([^\(\s]+)\s*\(([^\(\)]+)\)/i;
			var processKeys = strKeys => {
				var arrKeys = strKeys.replace(/`/g, '').split(',');
				_each(arrKeys, (key, i) => {
					arrKeys[i] = _trim(key);
				});
				return arrKeys;
			};


			var index = -1;
			while (true) {
				var previousIndex = index;
				index = sql.indexOf('UNIQUE KEY', index + 1);

				var foreignPart = sql.substr(previousIndex, (index > 0 ? index : sql.length) - previousIndex);
				var matches = regexp.exec(foreignPart);
				if (matches !== null) {
					var indexName = matches[1].replace(/`/, '');
					uniqueIndexes[indexName] = processKeys(matches[2]);
				}

				if (index === -1) {
					break;
				}
			}

			return Promise.resolve(uniqueIndexes);
		});
	},

	/**
	 * Returns all table names in the database.
	 * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema.
	 * @return {Promise} all table names in the database. The names have NO schema name prefix.
	 */
	_findTableNames(schema) {
		schema = schema || '';

		var sql = 'SHOW TABLES';
		if (schema !== '') {
			sql += ' FROM ' + this.quoteSimpleTableName(schema);
		}

		return this.db.createCommand(sql).queryColumn();
	}

});
