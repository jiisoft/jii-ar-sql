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
 * @abstract
 * @class Jii.sql.ActiveRecord
 * @extends Jii.base.ActiveRecord
 */
Jii.defineClass('Jii.sql.ActiveRecord', {

	__extends: Jii.base.ActiveRecord,
	
	__static: {

		/**
		 * Returns the database connection used by this AR class.
		 * By default, the "db" application component is used as the database connection.
		 * You may override this method if you want to use a different database connection.
		 * @returns {Jii.sql.Connection} the database connection used by this AR class.
		 */
		getDb: function () {
			return Jii.app.getComponent('db');
		},

		/**
		 * Creates an [[ActiveQuery]] instance with a given SQL statement.
		 *
		 * Note that because the SQL statement is already specified, calling additional
		 * query modification methods (such as `where()`, `order()`) on the created [[ActiveQuery]]
		 * instance will have no effect. However, calling `with()`, `asArray()` or `indexBy()` is
		 * still fine.
		 *
		 * Below is an example:
		 *
		 * ~~~
		 * customers = Customer.findBySql('SELECT * FROM customer').all();
		 * ~~~
		 *
		 * @param {string} sql the SQL statement to be executed
		 * @param {[]} params parameters to be bound to the SQL statement during execution.
		 * @returns {Jii.sql.ActiveQuery} the newly created [[ActiveQuery]] instance
		 */
		findBySql: function (sql, params) {
			params = params || [];

			var query = this.find();
			query.sql = sql;

			return query.params(params);
		},

		/**
		 * Updates the whole table using the provided attribute values and conditions.
		 * For example, to change the status to be 1 for all customers whose status is 2:
		 *
		 * ~~~
		 * Customer.updateAll({status: 1}, 'status = 2');
		 * ~~~
		 *
		 * @param {[]} attributes attribute values (name-value pairs) to be saved into the table
		 * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the UPDATE SQL.
		 * Please refer to [[Query.where()]] on how to specify this parameter.
		 * @param {object} [params] the parameters (name => value) to be bound to the query.
		 * @returns {Jii.when.<number>} the number of rows updated
		 */
		updateAll: function (attributes, condition, params) {
			condition = condition || '';
			params = params || {};

			var command = this.getDb().createCommand();
			command.update(this.tableName(), attributes, condition, params);

			return command.execute();
		},

		/**
		 * Updates the whole table using the provided counter changes and conditions.
		 * For example, to increment all customers' age by 1,
		 *
		 * ~~~
		 * Customer.updateAllCounters({age: 1});
		 * ~~~
		 *
		 * @param {[]} counters the counters to be updated (attribute name => increment value).
		 * Use negative values if you want to decrement the counters.
		 * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the UPDATE SQL.
		 * Please refer to [[Query.where()]] on how to specify this parameter.
		 * @param {object} [params] the parameters (name => value) to be bound to the query.
		 * Do not name the parameters as `:bp0`, `:bp1`, etc., because they are used internally by this method.
		 * @returns {number} the number of rows updated
		 */
		updateAllCounters: function (counters, condition, params) {
			condition = condition || '';
			params = params || {};

			var n = 0;
			Jii._.each(counters, Jii._.bind(function(value, name) {
				var params = {};
				params[':bp{' + n + '}'] = value;
				counters[name] = new Jii.sql.Expression('[[' + name + ']]+:bp{' + n + '}', params);
				n++;
			}, this));

			var command = this.getDb().createCommand();
			command.update(this.tableName(), counters, condition, params);

			return command.execute();
		},

		/**
		 * Deletes rows in the table using the provided conditions.
		 * WARNING: If you do not specify any condition, this method will delete ALL rows in the table.
		 *
		 * For example, to delete all customers whose status is 3:
		 *
		 * ~~~
		 * Customer.deleteAll('status = 3');
		 * ~~~
		 *
		 * @param {string|[]} [condition] the conditions that will be put in the WHERE part of the DELETE SQL.
		 * Please refer to [[Query.where()]] on how to specify this parameter.
		 * @param {object} [params] the parameters (name => value) to be bound to the query.
		 * @returns {number} the number of rows deleted
		 */
		deleteAll: function (condition, params) {
			condition = condition || '';
			params = params || {};

			var command = this.getDb().createCommand();
			command.delete(this.tableName(), condition, params);

			return command.execute();
		},

		/**
		 * @inheritdoc
		 */
		find: function () {
			return new Jii.sql.ActiveQuery(this);
		},

		/**
		 * Declares the name of the database table associated with this AR class.
		 * By default this method returns the class name as the table name by calling [[Inflector.camel2id()]]
		 * with prefix [[Connection.tablePrefix]]. For example if [[Connection.tablePrefix]] is 'tbl_',
		 * 'Customer' becomes 'tbl_customer', and 'OrderItem' becomes 'tbl_order_item'. You may override this method
		 * if the table is not named after this convention.
		 * @returns {string} the table name
		 */
		tableName: function () {
			var className = this.className();
			var name = className.substr(className.lastIndexOf('.') + 1);

			return '{{%' + Jii._s.underscored(name) + '}}';
		},

		/**
		 * Returns the schema information of the DB table associated with this AR class.
		 * @returns {Jii.sql.TableSchema} the schema information of the DB table associated with this AR class.
		 * @throws {Jii.exceptions.InvalidConfigException} if the table for the AR class does not exist.
		 */
		getTableSchema: function () {
			var schema = this.getDb().getTableSchema(this.tableName());
			if (schema === null) {
				throw new Jii.exceptions.InvalidConfigException("The table does not exist: " + this.tableName());
			}

			return schema;
		},

		/**
		 * Returns the primary key name(s) for this AR class.
		 * The default implementation will return the primary key(s) as declared
		 * in the DB table that is associated with this AR class.
		 *
		 * If the DB table does not declare any primary key, you should override
		 * this method to return the attributes that you want to use as primary keys
		 * for this AR class.
		 *
		 * Note that an array should be returned even for a table with single primary key.
		 *
		 * @returns {string[]} the primary keys of the associated database table.
		 */
		primaryKey: function () {
			return this.getTableSchema().primaryKey;
		}

	},


	/**
	 * Loads default values from database table schema
	 *
	 * @param {boolean} [skipIfSet] if existing value should be preserved
	 * @returns {Jii.when} model instance
	 */
	loadDefaultValues: function (skipIfSet) {
		skipIfSet = skipIfSet !== false;

		Jii._.each(this.getTableSchema(), function(column) {
			if (column.defaultValue !== null && (!skipIfSet || this.get(column.name) === null)) {
				this.set(column.name, column.defaultValue);
			}
		}.bind(this));
	},

	/**
	 * Returns the list of all attribute names of the model.
	 * The default implementation will return all column names of the table associated with this AR class.
	 * @returns {[]} list of attribute names.
	 */
	attributes: function () {
		return Jii._.keys(this.__static.getTableSchema().columns);
	}

});
