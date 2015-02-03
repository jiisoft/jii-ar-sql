
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');
require('./bootstrap');

var tests = Jii.namespace('tests');

require('./DatabaseTestCase.js');

/**
 * @class tests.unit.QueryBuilderTest
 * @extends tests.unit.DatabaseTestCase
 */
var self = Jii.defineClass('tests.unit.QueryBuilderTest', {

	__extends: tests.unit.DatabaseTestCase,

	__static: {
	},

	/**
	 * @throws \Exception
	 * @returns {Jii.sql.QueryBuilder}
	 */
	_getQueryBuilder: function () {
		var queryBuilder = null;

		switch (this.driverName) {
			case 'mysql':
				queryBuilder = new Jii.sql.mysql.QueryBuilder();
				break;

			/*case 'sqlite':
				return new SqliteQueryBuilder(this.getConnection(true, false));
			case 'mssql':
				return new MssqlQueryBuilder(this.getConnection(true, false));
			case 'pgsql':
				return new PgsqlQueryBuilder(this.getConnection(true, false));
			case 'cubrid':
				return new CubridQueryBuilder(this.getConnection(true, false));*/

			default:
				throw new Jii.exceptions.ApplicationException('Test is not implemented for ' + this.driverName);
		}

		return this.getConnection(true, false).then(function(db) {
			queryBuilder.db = db;
			return queryBuilder;
		});
	},

	/**
	 * this is not used as a dataprovider for testGetColumnType to speed up the test
	 * when used as dataprovider every single line will cause a reconnect with the database which is not needed here
	 */
	columnTypes: function () {
		return [
			[Jii.sql.BaseSchema.TYPE_PK, 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY'],
			[Jii.sql.BaseSchema.TYPE_PK + '(8)', 'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY'],
			[Jii.sql.BaseSchema.TYPE_PK + ' CHECK (value > 5)', 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_PK + '(8) CHECK (value > 5)', 'int(8) NOT NULL AUTO_INCREMENT PRIMARY KEY CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_STRING, 'varchar(255)'],
			[Jii.sql.BaseSchema.TYPE_STRING + '(32)', 'varchar(32)'],
			[Jii.sql.BaseSchema.TYPE_STRING + ' CHECK (value LIKE "test%")', 'varchar(255) CHECK (value LIKE "test%")'],
			[Jii.sql.BaseSchema.TYPE_STRING + '(32) CHECK (value LIKE "test%")', 'varchar(32) CHECK (value LIKE "test%")'],
			[Jii.sql.BaseSchema.TYPE_STRING + ' NOT NULL', 'varchar(255) NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_TEXT, 'text'],
			[Jii.sql.BaseSchema.TYPE_TEXT + '(255)', 'text'],
			[Jii.sql.BaseSchema.TYPE_TEXT + ' CHECK (value LIKE "test%")', 'text CHECK (value LIKE "test%")'],
			[Jii.sql.BaseSchema.TYPE_TEXT + '(255) CHECK (value LIKE "test%")', 'text CHECK (value LIKE "test%")'],
			[Jii.sql.BaseSchema.TYPE_TEXT + ' NOT NULL', 'text NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_TEXT + '(255) NOT NULL', 'text NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_SMALLINT, 'smallint(6)'],
			[Jii.sql.BaseSchema.TYPE_SMALLINT + '(8)', 'smallint(8)'],
			[Jii.sql.BaseSchema.TYPE_INTEGER, 'int(11)'],
			[Jii.sql.BaseSchema.TYPE_INTEGER + '(8)', 'int(8)'],
			[Jii.sql.BaseSchema.TYPE_INTEGER + ' CHECK (value > 5)', 'int(11) CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_INTEGER + '(8) CHECK (value > 5)', 'int(8) CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_INTEGER + ' NOT NULL', 'int(11) NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_BIGINT, 'bigint(20)'],
			[Jii.sql.BaseSchema.TYPE_BIGINT + '(8)', 'bigint(8)'],
			[Jii.sql.BaseSchema.TYPE_BIGINT + ' CHECK (value > 5)', 'bigint(20) CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_BIGINT + '(8) CHECK (value > 5)', 'bigint(8) CHECK (value > 5)'],
			[Jii.sql.BaseSchema.TYPE_BIGINT + ' NOT NULL', 'bigint(20) NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_FLOAT, 'float'],
			[Jii.sql.BaseSchema.TYPE_FLOAT + '(16,5)', 'float'],
			[Jii.sql.BaseSchema.TYPE_FLOAT + ' CHECK (value > 5.6)', 'float CHECK (value > 5.6)'],
			[Jii.sql.BaseSchema.TYPE_FLOAT + '(16,5) CHECK (value > 5.6)', 'float CHECK (value > 5.6)'],
			[Jii.sql.BaseSchema.TYPE_FLOAT + ' NOT NULL', 'float NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_DECIMAL, 'decimal(10,0)'],
			[Jii.sql.BaseSchema.TYPE_DECIMAL + '(12,4)', 'decimal(12,4)'],
			[Jii.sql.BaseSchema.TYPE_DECIMAL + ' CHECK (value > 5.6)', 'decimal(10,0) CHECK (value > 5.6)'],
			[Jii.sql.BaseSchema.TYPE_DECIMAL + '(12,4) CHECK (value > 5.6)', 'decimal(12,4) CHECK (value > 5.6)'],
			[Jii.sql.BaseSchema.TYPE_DECIMAL + ' NOT NULL', 'decimal(10,0) NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_DATETIME, 'datetime'],
			[Jii.sql.BaseSchema.TYPE_DATETIME + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "datetime CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.sql.BaseSchema.TYPE_DATETIME + ' NOT NULL', 'datetime NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_TIMESTAMP, 'timestamp'],
			[Jii.sql.BaseSchema.TYPE_TIMESTAMP + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "timestamp CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.sql.BaseSchema.TYPE_TIMESTAMP + ' NOT NULL', 'timestamp NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_TIME, 'time'],
			[Jii.sql.BaseSchema.TYPE_TIME + " CHECK(value BETWEEN '12:00:00' AND '13:01:01')", "time CHECK(value BETWEEN '12:00:00' AND '13:01:01')"],
			[Jii.sql.BaseSchema.TYPE_TIME + ' NOT NULL', 'time NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_DATE, 'date'],
			[Jii.sql.BaseSchema.TYPE_DATE + " CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')", "date CHECK(value BETWEEN '2011-01-01' AND '2013-01-01')"],
			[Jii.sql.BaseSchema.TYPE_DATE + ' NOT NULL', 'date NOT NULL'],
			[Jii.sql.BaseSchema.TYPE_BINARY, 'blob'],
			[Jii.sql.BaseSchema.TYPE_BOOLEAN, 'tinyint(1)'],
			[Jii.sql.BaseSchema.TYPE_BOOLEAN + ' NOT NULL DEFAULT 1', 'tinyint(1) NOT NULL DEFAULT 1'],
			[Jii.sql.BaseSchema.TYPE_MONEY, 'decimal(19,4)'],
			[Jii.sql.BaseSchema.TYPE_MONEY + '(16,2)', 'decimal(16,2)'],
			[Jii.sql.BaseSchema.TYPE_MONEY + ' CHECK (value > 0.0)', 'decimal(19,4) CHECK (value > 0.0)'],
			[Jii.sql.BaseSchema.TYPE_MONEY + '(16,2) CHECK (value > 0.0)', 'decimal(16,2) CHECK (value > 0.0)'],
			[Jii.sql.BaseSchema.TYPE_MONEY + ' NOT NULL', 'decimal(19,4) NOT NULL']
		];
	},

	testGetColumnType: function (test) {
		this._getQueryBuilder().then(function(queryBuilder) {
			Jii._.each(this.columnTypes(), function(item) {
				var column = item[0];
				var expected = item[1];

				test.strictEqual(queryBuilder.getColumnType(column), expected);
			});

			test.done();
		}.bind(this));
	},

	testCreateTableColumnTypes: function (test) {
		var columns = {};
		var queryBuilder = null;

		this._getQueryBuilder().then(function(qb) {
			queryBuilder = qb;
			return queryBuilder.db.getSchema().loadTableSchema('column_type_table', true);
		}).then(function(table) {
			if (table !== null) {
				// Clear
				return this.getConnection(false).then(function(db) {
					return queryBuilder.dropTable('column_type_table').then(function(sql) {
						return db.createCommand(sql).execute();
					});
				});
			}

		}.bind(this)).then(function() {
			var i = 1;
			Jii._.each(this.columnTypes(), function(item) {
				var column = item[0];

				if (column.substr(0, 2) !== 'pk') {
					columns['col' + i++] = column.replace('CHECK (value', 'CHECK (col' + i);
				}
			});

			// Create new
			return this.getConnection(false).then(function(db) {
				return queryBuilder.createTable('column_type_table', columns).then(function(sql) {
					return db.createCommand(sql).execute();
				});
			});
		}.bind(this)).then(function() {

			// Check created
			return queryBuilder.db.getSchema().loadTableSchema('column_type_table', true);
		}.bind(this)).then(function(table) {
			test.notStrictEqual(table, null);

			Jii._.each(table.columns, function(column, name) {
				test.strictEqual(column instanceof Jii.sql.ColumnSchema, true);
				test.strictEqual(Jii._.has(columns, name), true);
				test.strictEqual(column.name, name);
			});

			test.done();
		});
	},

	testBuildCondition: function (test) {
		var conditions = [
			// empty values
			[ ['like', 'name', []], '0=1', [] ],
			[ ['not like', 'name', []], '', [] ],
			[ ['or like', 'name', []], '0=1', [] ],
			[ ['or not like', 'name', []], '', [] ],

			// simple like
			[ ['like', 'name', 'heyho'], '`name` LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['not like', 'name', 'heyho'], '`name` NOT LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['or like', 'name', 'heyho'], '`name` LIKE :qp0', {':qp0': '%heyho%'} ],
			[ ['or not like', 'name', 'heyho'], '`name` NOT LIKE :qp0', {':qp0': '%heyho%'} ],

			// like for many values
			[ ['like', 'name', ['heyho', 'abc']], '`name` LIKE :qp0 AND `name` LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['not like', 'name', ['heyho', 'abc']], '`name` NOT LIKE :qp0 AND `name` NOT LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['or like', 'name', ['heyho', 'abc']], '`name` LIKE :qp0 OR `name` LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],
			[ ['or not like', 'name', ['heyho', 'abc']], '`name` NOT LIKE :qp0 OR `name` NOT LIKE :qp1', {':qp0': '%heyho%', ':qp1': '%abc%'} ],

			// like with Expression
			[ ['like', 'name', new Jii.sql.Expression('CONCAT("test", colname, "%")')], '`name` LIKE CONCAT("test", colname, "%")', [] ],
			[ ['not like', 'name', new Jii.sql.Expression('CONCAT("test", colname, "%")')], '`name` NOT LIKE CONCAT("test", colname, "%")', [] ],
			[ ['or like', 'name', new Jii.sql.Expression('CONCAT("test", colname, "%")')], '`name` LIKE CONCAT("test", colname, "%")', [] ],
			[ ['or not like', 'name', new Jii.sql.Expression('CONCAT("test", colname, "%")')], '`name` NOT LIKE CONCAT("test", colname, "%")', [] ],
			[ ['like', 'name', [new Jii.sql.Expression('CONCAT("test", colname, "%")'), 'abc']], '`name` LIKE CONCAT("test", colname, "%") AND `name` LIKE :qp0', {':qp0': '%abc%'} ],
			[ ['not like', 'name', [new Jii.sql.Expression('CONCAT("test", colname, "%")'), 'abc']], '`name` NOT LIKE CONCAT("test", colname, "%") AND `name` NOT LIKE :qp0', {':qp0': '%abc%'} ],
			[ ['or like', 'name', [new Jii.sql.Expression('CONCAT("test", colname, "%")'), 'abc']], '`name` LIKE CONCAT("test", colname, "%") OR `name` LIKE :qp0', {':qp0': '%abc%'} ],
			[ ['or not like', 'name', [new Jii.sql.Expression('CONCAT("test", colname, "%")'), 'abc']], '`name` NOT LIKE CONCAT("test", colname, "%") OR `name` NOT LIKE :qp0', {':qp0': '%abc%'} ],

			// not
			[ ['not', 'name'], 'NOT (name)', [] ],

			// and
			[ ['and', 'id=1', 'id=2'], '(id=1) AND (id=2)', [] ],
			[ ['and', 'type=1', ['or', 'id=1', 'id=2']], '(type=1) AND ((id=1) OR (id=2))', [] ],

			// or
			[ ['or', 'id=1', 'id=2'], '(id=1) OR (id=2)', [] ],
			[ ['or', 'type=1', ['or', 'id=1', 'id=2']], '(type=1) OR ((id=1) OR (id=2))', [] ],

			// between
			[ ['between', 'id', 1, 10], '`id` BETWEEN :qp0 AND :qp1', {':qp0': 1, ':qp1': 10} ],
			[ ['not between', 'id', 1, 10], '`id` NOT BETWEEN :qp0 AND :qp1', {':qp0': 1, ':qp1': 10} ],
			[ ['between', 'date', new Jii.sql.Expression('(NOW() - INTERVAL 1 MONTH)'), new Jii.sql.Expression('NOW()')], '`date` BETWEEN (NOW() - INTERVAL 1 MONTH) AND NOW()', [] ],
			[ ['between', 'date', new Jii.sql.Expression('(NOW() - INTERVAL 1 MONTH)'), 123], '`date` BETWEEN (NOW() - INTERVAL 1 MONTH) AND :qp0', {':qp0': 123} ],
			[ ['not between', 'date', new Jii.sql.Expression('(NOW() - INTERVAL 1 MONTH)'), new Jii.sql.Expression('NOW()')], '`date` NOT BETWEEN (NOW() - INTERVAL 1 MONTH) AND NOW()', [] ],
			[ ['not between', 'date', new Jii.sql.Expression('(NOW() - INTERVAL 1 MONTH)'), 123], '`date` NOT BETWEEN (NOW() - INTERVAL 1 MONTH) AND :qp0', {':qp0': 123} ],

			// in
			[ ['in', 'id', [1, 2, 3]], '`id` IN (:qp0, :qp1, :qp2)', {':qp0': 1, ':qp1': 2, ':qp2': 3} ],
			[ ['not in', 'id', [1, 2, 3]], '`id` NOT IN (:qp0, :qp1, :qp2)', {':qp0': 1, ':qp1': 2, ':qp2': 3} ],
			[ ['in', 'id', (new Jii.sql.Query()).select('id').from('users').where({'active': 1})], '(`id`) IN (SELECT `id` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],
			[ ['not in', 'id', (new Jii.sql.Query()).select('id').from('users').where({'active': 1})], '(`id`) NOT IN (SELECT `id` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],

			// composite in
			[ ['in', ['id', 'name'], [{'id': 1, 'name': 'foo'}, {'id': 2, 'name': 'bar'}]], '(`id`, `name`) IN ((:qp0, :qp1), (:qp2, :qp3))', {':qp0': 1, ':qp1': 'foo', ':qp2': 2, ':qp3': 'bar'} ],
			[ ['not in', ['id', 'name'], [{'id': 1, 'name': 'foo'}, {'id': 2, 'name': 'bar'}]], '(`id`, `name`) NOT IN ((:qp0, :qp1), (:qp2, :qp3))', {':qp0': 1, ':qp1': 'foo', ':qp2': 2, ':qp3': 'bar'} ],
			[ ['in', ['id', 'name'], (new Jii.sql.Query()).select(['id', 'name']).from('users').where({'active': 1})], '(`id`, `name`) IN (SELECT `id`, `name` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],
			[ ['not in', ['id', 'name'], (new Jii.sql.Query()).select(['id', 'name']).from('users').where({'active': 1})], '(`id`, `name`) NOT IN (SELECT `id`, `name` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],

			// exists
			[ ['exists', (new Jii.sql.Query()).select('id').from('users').where({'active': 1})], 'EXISTS (SELECT `id` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],
			[ ['not exists', (new Jii.sql.Query()).select('id').from('users').where({'active': 1})], 'NOT EXISTS (SELECT `id` FROM `users` WHERE `active`=:qp0)', {':qp0': 1} ],

			// simple conditions
			[ ['=', 'a', 'b'], '`a` = :qp0', {':qp0': 'b'} ],
			[ ['>', 'a', 1], '`a` > :qp0', {':qp0': 1} ],
			[ ['>=', 'a', 'b'], '`a` >= :qp0', {':qp0': 'b'} ],
			[ ['<', 'a', 2], '`a` < :qp0', {':qp0': 2} ],
			[ ['<=', 'a', 'b'], '`a` <= :qp0', {':qp0': 'b'} ],
			[ ['<>', 'a', 3], '`a` <> :qp0', {':qp0': 3} ],
			[ ['!=', 'a', 'b'], '`a` != :qp0', {':qp0': 'b'} ],
			[ ['>=', 'date', new Jii.sql.Expression('DATE_SUB(NOW(), INTERVAL 1 MONTH)')], '`date` >= DATE_SUB(NOW(), INTERVAL 1 MONTH)', [] ],
			[ ['>=', 'date', new Jii.sql.Expression('DATE_SUB(NOW(), INTERVAL :month MONTH)', {':month': 2})], '`date` >= DATE_SUB(NOW(), INTERVAL :month MONTH)', {':month': 2} ],

			// hash condition
			[ {'a': 1, 'b': 2}, '(`a`=:qp0) AND (`b`=:qp1)', {':qp0': 1, ':qp1': 2} ],
			[ {'a': new Jii.sql.Expression('CONCAT(col1, col2)'), 'b': 2}, '(`a`=CONCAT(col1, col2)) AND (`b`=:qp0)', {':qp0': 2} ]
		];

		// adjust dbms specific escaping
		Jii._.each(conditions, function(condition, i) {
			conditions[i][1] = this._replaceQuotes(condition[1]);
		}.bind(this));

		this._getQueryBuilder().then(function(queryBuilder) {
			var testNext = function(i) {
				var item = conditions[i];
				if (!item) {
					test.done();
					return;
				}

				var condition = item[0];
				var expected = item[1];
				var expectedParams = item[2];

				var query = (new Jii.sql.Query()).where(condition);
				queryBuilder.build(query).then(function(buildParams) {
					var sql = buildParams[0];
					var params = buildParams[1];

					test.deepEqual(params, expectedParams);
					test.equals(sql, 'SELECT *' + (Jii._.isEmpty(expected) ? '' : ' WHERE ' + expected));

					testNext(i+1);
				});
			};
			testNext(0);
		});
	},

	testBuildFilterCondition: function (test) {
		var conditions = [
			// like
			[ ['like', 'name', []], '', [] ],
			[ ['not like', 'name', []], '', [] ],
			[ ['or like', 'name', []], '', [] ],
			[ ['or not like', 'name', []], '', [] ],

			// not
			[ ['not', ''], '', [] ],

			// and
			[ ['and', '', ''], '', [] ],
			[ ['and', '', 'id=2'], '(id=2)', [] ],
			[ ['and', 'id=1', ''], '(id=1)', [] ],
			[ ['and', 'type=1', ['or', '', 'id=2']], '(type=1) AND ((id=2))', [] ],

			// or
			[ ['or', 'id=1', ''], '(id=1)', [] ],
			[ ['or', 'type=1', ['or', '', 'id=2']], '(type=1) OR ((id=2))', [] ],


			// between
			[ ['between', 'id', 1, null], '', [] ],
			[ ['not between', 'id', null, 10], '', [] ],

			// in
			[ ['in', 'id', []], '', [] ],
			[ ['not in', 'id', []], '', [] ],

			// simple conditions
			[ ['=', 'a', ''], '', [] ],
			[ ['>', 'a', ''], '', [] ],
			[ ['>=', 'a', ''], '', [] ],
			[ ['<', 'a', ''], '', [] ],
			[ ['<=', 'a', ''], '', [] ],
			[ ['<>', 'a', ''], '', [] ],
			[ ['!=', 'a', ''], '', [] ]
		];

		// adjust dbms specific escaping
		Jii._.each(conditions, function(condition, i) {
			conditions[i][1] = this._replaceQuotes(condition[1]);
		}.bind(this));

		this._getQueryBuilder().then(function(queryBuilder) {
			var testNext = function(i) {
				var item = conditions[i];
				if (!item) {
					test.done();
					return;
				}

				var condition = item[0];
				var expected = item[1];
				var expectedParams = item[2];

				var query = (new Jii.sql.Query()).filterWhere(condition);
				queryBuilder.build(query).then(function(buildParams) {
					var sql = buildParams[0];
					var params = buildParams[1];

					test.deepEqual(params, expectedParams);
					test.equals(sql, 'SELECT *' + (Jii._.isEmpty(expected) ? '' : ' WHERE ' + expected));

					testNext(i+1);
				});
			};
			testNext(0);
		});
	},

	testAddDropPrimaryKey: function (test) {
		var tableName = 'constraints';
		var pkeyName = tableName + "_pkey";
		var queryBuilder = null;

		// ADD
		this._getQueryBuilder().then(function(qb) {
			queryBuilder = qb;
			return queryBuilder.db.createCommand().addPrimaryKey(pkeyName, tableName, ['id']);
		}).then(function() {

			return queryBuilder.db.getSchema().loadTableSchema(tableName, true);
		}).then(function(tableSchema) {
			test.equals(tableSchema.primaryKey.length, 1);

			// DROP
			return queryBuilder.db.createCommand().dropPrimaryKey(pkeyName, tableName);
		}).then(function() {

			// resets the schema
			return this._getQueryBuilder();
		}.bind(this)).then(function(qb) {
			queryBuilder = qb;

			return queryBuilder.db.getSchema().loadTableSchema(tableName);
		}).then(function(tableSchema) {
			test.equals(tableSchema.primaryKey.length, 0);
			test.done();
		});
	},

	_replaceQuotes: function(condition) {
		if (Jii._.indexOf(['mssql', 'mysql', 'sqlite'], this.driverName) === -1) {
			condition = condition.replace(/`/g, '"');
		}
		return condition;
	},

	testBuildWhereExists: function(test) {
		var conditions = [
			['exists', this._replaceQuotes("SELECT `id` FROM `TotalExample` `t` WHERE EXISTS (SELECT `1` FROM `Website` `w`)")],
			['not exists', this._replaceQuotes("SELECT `id` FROM `TotalExample` `t` WHERE NOT EXISTS (SELECT `1` FROM `Website` `w`)")]
		];

		this._getQueryBuilder().then(function(queryBuilder) {
			var testNext = function(i) {
				var item = conditions[i];
				if (!item) {
					test.done();
					return;
				}

				var condition = item[0];
				var expected = item[1];

				var subQuery = new Jii.sql.Query();
				subQuery.select('1')
					.from('Website w');

				var query = new Jii.sql.Query();
				query.select('id')
					.from('TotalExample t')
					.where([condition, subQuery]);

				queryBuilder.build(query).then(function(buildParams) {
					var actualQuerySql = buildParams[0];
					var actualQueryParams = buildParams[1];

					test.equals(expected, actualQuerySql);
					test.deepEqual({}, actualQueryParams);

					testNext(i+1);
				});
			};
			testNext(0);
		});
	},

	testBuildWhereExistsWithParameters: function(test) {
		var expectedQuerySql = this._replaceQuotes(
			"SELECT `id` FROM `TotalExample` `t` WHERE (t.some_column = :some_value) AND (EXISTS (SELECT `1` FROM `Website` `w` WHERE (w.id = t.website_id) AND (w.merchant_id = :merchant_id)))"
		);
		var expectedQueryParams = {':some_value': "asd", ':merchant_id': 6};

		var subQuery = new Jii.sql.Query();
		subQuery.select('1')
			.from('Website w')
			.where('w.id = t.website_id')
			.andWhere('w.merchant_id = :merchant_id', {':merchant_id': 6});

		var query = new Jii.sql.Query();
		query.select('id')
			.from('TotalExample t')
			.where(['exists', subQuery])
			.andWhere('t.some_column = :some_value', {':some_value': "asd"});

		this._getQueryBuilder().then(function(queryBuilder) {

			return queryBuilder.build(query);
		}).then(function(buildParams) {
			var actualQuerySql = buildParams[0];
			var actualQueryParams = buildParams[1];

			test.equals(expectedQuerySql, actualQuerySql);
			test.deepEqual(expectedQueryParams, actualQueryParams);

			test.done();
		});
	},

	testBuildWhereExistsWithArrayParameters: function(test) {
		var expectedQuerySql = this._replaceQuotes(
			"SELECT `id` FROM `TotalExample` `t` WHERE (`t`.`some_column`=:qp0) AND (EXISTS (SELECT `1` FROM `Website` `w` WHERE (w.id = t.website_id) AND ((`w`.`merchant_id`=:qp1) AND (`w`.`user_id`=:qp2))))"
		);
		var expectedQueryParams = {':qp0': 'asd', ':qp1': 6, ':qp2': 210};

		var subQuery = new Jii.sql.Query();
		subQuery.select('1')
			.from('Website w')
			.where('w.id = t.website_id')
			.andWhere({'w.merchant_id': 6, 'w.user_id': '210'});

		var query = new Jii.sql.Query();
		query.select('id')
			.from('TotalExample t')
			.where(['exists', subQuery])
			.andWhere({'t.some_column': "asd"});

		this._getQueryBuilder().then(function(queryBuilder) {

			return queryBuilder.build(query);
		}).then(function(buildParams) {
			var actualQuerySql = buildParams[0];
			var actualQueryParams = buildParams[1];

			test.equals(expectedQuerySql, actualQuerySql);
			test.deepEqual(expectedQueryParams, actualQueryParams);

			test.done();
		});
	},

	/**
	 * This test contains three select queries connected with UNION and UNION ALL constructions.
	 * It could be useful to use "phpunit --group=db --filter testBuildUnion" command for run it.
	 */
	testBuildUnion: function (test)	{
		var expectedQuerySql = this._replaceQuotes(
			"(SELECT `id` FROM `TotalExample` `t1` WHERE (w > 0) AND (x < 2)) UNION ( SELECT `id` FROM `TotalTotalExample` `t2` WHERE w > 5 ) UNION ALL ( SELECT `id` FROM `TotalTotalExample` `t3` WHERE w = 3 )"
		);
		var query = new Jii.sql.Query();
		var secondQuery = new Jii.sql.Query();
		secondQuery.select('id')
			.from('TotalTotalExample t2')
			.where('w > 5');
		var thirdQuery = new Jii.sql.Query();
		thirdQuery.select('id')
			.from('TotalTotalExample t3')
			.where('w = 3');
		query.select('id')
			.from('TotalExample t1')
			.where(['and', 'w > 0', 'x < 2'])
			.union(secondQuery)
			.union(thirdQuery, true);

		this._getQueryBuilder().then(function(queryBuilder) {

			return queryBuilder.build(query);
		}).then(function(buildParams) {
			var actualQuerySql = buildParams[0];
			var actualQueryParams = buildParams[1];

			test.equals(expectedQuerySql, actualQuerySql);
			test.deepEqual({}, actualQueryParams);

			test.done();
		});
	},

	testSelectSubquery: function (test)	{
		var expected = this._replaceQuotes('SELECT *, (SELECT COUNT(*) FROM `operations` WHERE account_id = accounts.id) AS `operations_count` FROM `accounts`');

		var subquery = (new Jii.sql.Query())
			.select('COUNT(*)')
			.from('operations')
			.where('account_id = accounts.id');
		var query = (new Jii.sql.Query())
			.select('*')
			.from('accounts')
			.addSelect({operations_count: subquery});

		this._getQueryBuilder().then(function(queryBuilder) {

			return queryBuilder.build(query);
		}).then(function(buildParams) {
			var sql = buildParams[0];
			var params = buildParams[1];

			test.equals(expected, sql);
			test.deepEqual({}, params);

			test.done();
		});
	}

});

module.exports = new self().exports();
