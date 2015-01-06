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

require('../BaseSchema');

/**
 * @class Jii.sql.mysql.Schema
 * @extends Jii.sql.BaseSchema
 */
Jii.defineClass('Jii.sql.mysql.Schema', {

	__extends: Jii.sql.BaseSchema,

	/**
	 * @var array mapping from physical column types (keys) to abstract column types (values)
	 */
	typeMap: (function () {
		return {
			tinyint: Jii.sql.BaseSchema.TYPE_SMALLINT,
			bit: Jii.sql.BaseSchema.TYPE_SMALLINT,
			smallint: Jii.sql.BaseSchema.TYPE_SMALLINT,
			mediumint: Jii.sql.BaseSchema.TYPE_INTEGER,
			int: Jii.sql.BaseSchema.TYPE_INTEGER,
			integer: Jii.sql.BaseSchema.TYPE_INTEGER,
			bigint: Jii.sql.BaseSchema.TYPE_BIGINT,
			float: Jii.sql.BaseSchema.TYPE_FLOAT,
			double: Jii.sql.BaseSchema.TYPE_FLOAT,
			real: Jii.sql.BaseSchema.TYPE_FLOAT,
			decimal: Jii.sql.BaseSchema.TYPE_DECIMAL,
			numeric: Jii.sql.BaseSchema.TYPE_DECIMAL,
			tinytext: Jii.sql.BaseSchema.TYPE_TEXT,
			mediumtext: Jii.sql.BaseSchema.TYPE_TEXT,
			longtext: Jii.sql.BaseSchema.TYPE_TEXT,
			longblob: Jii.sql.BaseSchema.TYPE_BINARY,
			blob: Jii.sql.BaseSchema.TYPE_BINARY,
			text: Jii.sql.BaseSchema.TYPE_TEXT,
			varchar: Jii.sql.BaseSchema.TYPE_STRING,
			string: Jii.sql.BaseSchema.TYPE_STRING,
			char: Jii.sql.BaseSchema.TYPE_STRING,
			datetime: Jii.sql.BaseSchema.TYPE_DATETIME,
			year: Jii.sql.BaseSchema.TYPE_DATE,
			date: Jii.sql.BaseSchema.TYPE_DATE,
			time: Jii.sql.BaseSchema.TYPE_TIME,
			timestamp: Jii.sql.BaseSchema.TYPE_TIMESTAMP,
			enum: Jii.sql.BaseSchema.TYPE_STRING
		};
	})(),

	/**
	 * Quotes a table name for use in a query.
	 * A simple table name has no schema prefix.
	 * @param {string} name table name
	 * @return {string} the properly quoted table name
	 */
	quoteSimpleTableName: function (name) {
		return name.indexOf('`') !== -1 ? name : '`' + name + '`';
	},

	/**
	 * Quotes a column name for use in a query.
	 * A simple column name has no prefix.
	 * @param {string} name column name
	 * @return {string} the properly quoted column name
	 */
	quoteSimpleColumnName: function (name) {
		return name.indexOf('`') !== -1 || name === '*' ? name : '`' + name + '`';
	},

	/**
	 * Creates a query builder for the MySQL database.
	 * @return {Jii.sql.mysql.QueryBuilder} query builder instance
	 */
	createQueryBuilder: function () {
		return new Jii.sql.mysql.QueryBuilder(this.db);
	},

	/**
	 * Loads the metadata for the specified table.
	 * @param {string} name table name
	 * @return {Jii.sql.TableSchema} driver dependent table metadata. Null if the table does not exist.
	 */
	_loadTableSchema: function (name) {
		var table = new Jii.sql.TableSchema();
		this._resolveTableNames(table, name);

		return this._findColumns(table).then(function() {
			return this._findConstraints(table);
		}.bind(this), function() {
			table = null;
		}).then(function() {
			return table;
		});
	},

	/**
	 * Resolves the table name and schema name (if any).
	 * @param {Jii.sql.TableSchema} table the table metadata object
	 * @param {string} name the table name
	 */
	_resolveTableNames: function (table, name) {
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
	_loadColumnSchema: function (info) {
		var column = this._createQueryBuilder();

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
			if (Jii._.has(this.typeMap, type)) {
				column.type = this.typeMap[type];
			}

			if (matches[2]) {
				var values = matches[2].split(',');
				if (type === 'enum') {
					Jii._.each(values, function (value, i) {
						values[i] = Jii._s.trim(value, "'");
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
				column.defaultValue = new Jii.sql.Expression('CURRENT_TIMESTAMP');
			} else if (type === 'bit') {
				column.defaultValue = Jii._s.ltrim(Jii._s.rtrim(info.Default, '\''), 'b\'');
			} else {
				column.defaultValue = column.typecast(info.Default);
			}
		}

		return column;
	},

	/**
	 * Collects the metadata of table columns.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 * @return {Jii.when} whether the table exists in the database
	 * @throws \Exception if DB query fails
	 */
	_findColumns: function (table) {
		var sql = 'SHOW FULL COLUMNS FROM ' + this.quoteTableName(table.fullName);

		return this.db.createCommand(sql)
			.queryAll()
			.then(function (columns) {
				Jii._.each(columns, function (info) {
					var column = this._loadColumnSchema(info);

					table.columns[column.name] = column;
					if (column.isPrimaryKey) {
						table.primaryKey.push(column.name);
						if (column.autoIncrement) {
							table.sequenceName = '';
						}
					}
				}.bind(this));

				return Jii.when.resolve();
			}.bind(this))
			.catch(function (exception) {
				// @todo Php code:
				//var previous = e.getPrevious();
				//if (previous instanceof \PDOException && previous.getCode() == '42S02') {
				// table does not exist
				//}
				//throw e;
				console.warn(exception.toString());

				return Jii.when.reject();
			});
	},

	/**
	 * Gets the CREATE TABLE sql string.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 * @return {Jii.when} sql the result of 'SHOW CREATE TABLE'
	 */
	_getCreateTableSql: function (table) {
		var sql = 'SHOW CREATE TABLE ' + this.quoteSimpleTableName(table.name);

		return this.db.createCommand(sql)
			.queryOne()
			.then(function (row) {
				var sql = Jii._.has(row, 'Create Table') ?
					row['Create Table'] :
					Jii._.values(row)[1];

				return Jii.when.resolve(sql);
			});
	},

	/**
	 * Collects the foreign key column details for the given table.
	 * @param {Jii.sql.TableSchema} table the table metadata
	 */
	_findConstraints: function (table) {
		return this._getCreateTableSql(table).then(function (sql) {
			var regexp = /FOREIGN KEY\s+\(([^\)]+)\)\s+REFERENCES\s+([^\(^\s]+)\s*\(([^\)]+)\)/i;
			var processKeys = function (strKeys) {
				var arrKeys = strKeys.replace(/`/g, '').split(',');
				Jii._.each(arrKeys, function (key, i) {
					arrKeys[i] = Jii._s.trim(key);
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

			return Jii.when.resolve();
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
	 * @return {Jii.when} all unique indexes for the given table.
	 */
	findUniqueIndexes: function (table) {
		return this._getCreateTableSql(table).then(function (sql) {

			var uniqueIndexes = [];

			var regexp = /UNIQUE KEY\s+([^\(\s]+)\s*\(([^\(\)]+)\)/i;
			var processKeys = function (strKeys) {
				var arrKeys = strKeys.replace(/`/g, '').split(',');
				Jii._.each(arrKeys, function (key, i) {
					arrKeys[i] = Jii._s.trim(key);
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

			return Jii.when.resolve(uniqueIndexes);
		});
	},

	/**
	 * Returns all table names in the database.
	 * @param {string} [schema] the schema of the tables. Defaults to empty string, meaning the current or default schema.
	 * @return {Jii.when} all table names in the database. The names have NO schema name prefix.
	 */
	_findTableNames: function (schema) {
		schema = schema || '';

		var sql = 'SHOW TABLES';
		if (schema !== '') {
			sql += ' FROM '.this.quoteSimpleTableName(schema);
		}

		return this.db.createCommand(sql).queryColumn();
	}

});
