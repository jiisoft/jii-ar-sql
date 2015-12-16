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

require('./Query');

/**
 * ActiveQuery represents a DB query associated with an Active Record class.
 *
 * An ActiveQuery can be a normal query or be used in a relational context.
 *
 * ActiveQuery instances are usually created by [[ActiveRecord.find()]] and [[ActiveRecord.findBySql()]].
 * Relational queries are created by [[ActiveRecord.hasOne()]] and [[ActiveRecord.hasMany()]].
 *
 * Normal Query
 * ------------
 *
 * ActiveQuery mainly provides the following methods to retrieve the query results:
 *
 * - [[one()]]: returns a single record populated with the first row of data.
 * - [[all()]]: returns all records based on the query results.
 * - [[count()]]: returns the number of records.
 * - [[sum()]]: returns the sum over the specified column.
 * - [[average()]]: returns the average over the specified column.
 * - [[min()]]: returns the min over the specified column.
 * - [[max()]]: returns the max over the specified column.
 * - [[scalar()]]: returns the value of the first column in the first row of the query result.
 * - [[column()]]: returns the value of the first column in the query result.
 * - [[exists()]]: returns a value indicating whether the query result has data or not.
 *
 * Because ActiveQuery extends from [[Query]], one can use query methods, such as [[where()]],
 * [[orderBy()]] to customize the query options.
 *
 * ActiveQuery also provides the following additional query options:
 *
 * - [[with()]]: list of relations that this query should be performed with.
 * - [[indexBy()]]: the name of the column by which the query result should be indexed.
 * - [[asArray()]]: whether to return each record as an array.
 *
 * These options can be configured using methods of the same name. For example:
 *
 * ```js
 * customers = Customer.find().with('orders').asArray().all();
 * ```
 *
 * Relational query
 * ----------------
 *
 * In relational context ActiveQuery represents a relation between two Active Record classes.
 *
 * Relational ActiveQuery instances are usually created by calling [[ActiveRecord.hasOne()]] and
 * [[ActiveRecord.hasMany()]]. An Active Record class declares a relation by defining
 * a getter method which calls one of the above methods and returns the created ActiveQuery object.
 *
 * A relation is specified by [[link]] which represents the association between columns
 * of different tables; and the multiplicity of the relation is indicated by [[multiple]].
 *
 * If a relation involves a junction table, it may be specified by [[via()]] or [[viaTable()]] method.
 * These methods may only be called in a relational context. Same is true for [[inverseOf()]], which
 * marks a relation as inverse of another relation and [[onCondition()]] which adds a condition that
 * is to be added to relational query join condition.
 * @class Jii.sql.ActiveQuery
 * @extends Jii.sql.Query
 */
Jii.defineClass('Jii.sql.ActiveQuery', /** @lends Jii.sql.ActiveQuery.prototype */{

	__extends: Jii.sql.Query,

	__static: /** @lends Jii.sql.ActiveQuery */{
		/**
		 * @event Event an event that is triggered when the query is initialized via [[init()]].
		 */
		EVENT_INIT: 'init'
	},

	/**
	 * @type {boolean} whether this query represents a relation to more than one record.
	 * This property is only used in relational context. If true, this relation will
	 * populate all query results into AR instances using [[Query.all()|all()]].
	 * If false, only the first row of the results will be retrieved using [[Query.one()|one()]].
	 */
	multiple: null,

	/**
	 * @type {Jii.sql.ActiveRecord} the primary model of a relational query.
	 * This is used only in lazy loading with dynamic query options.
	 */
	primaryModel: null,

	/**
	 * @type {Jii.sql.ActiveRecord} ActiveRecord class.
	 */
	modelClass: null,

	/**
	 * @type {string|[]} the join condition to be used when this query is used in a relational context.
	 * The condition will be used in the ON part when [[ActiveQuery.joinWith()]] is called.
	 * Otherwise, the condition will be used in the WHERE part of a query.
	 * Please refer to [[Query.where()]] on how to specify this parameter.
	 * @see onCondition()
	 */
	_on: null,

	/**
	 * @type {string} the SQL statement to be executed for retrieving AR records.
	 * This is set by [[ActiveRecord.findBySql()]].
	 */
	_sql: null,

	/**
	 * @type {[]} a list of relations that this query should be joined with
	 */
	_joinWith: [],

	/**
	 * @type {[]} the columns of the primary and foreign tables that establish a relation.
	 * The array keys must be columns of the table for this relation, and the array values
	 * must be the corresponding columns from the primary table.
	 * Do not prefix or quote the column names as this will be done automatically by Jii.
	 * This property is only used in relational context.
	 */
	link: null,

	/**
	 * @type {[]|object} the query associated with the junction table. Please call [[via()]]
	 * to set this property instead of directly setting it.
	 * This property is only used in relational context.
	 * @see via()
	 */
	_via: null,

	/**
	 * @type {string} the name of the relation that is the inverse of this relation.
	 * For example, an order has a customer, which means the inverse of the "customer" relation
	 * is the "orders", and the inverse of the "orders" relation is the "customer".
	 * If this property is set, the primary record(s) will be referenced through the specified relation.
	 * For example, `customer.orders[0].customer` and `customer` will be the same object,
	 * and accessing the customer of an order will not trigger new DB() query.
	 * This property is only used in relational context.
	 * @see inverseOf()
	 */
	_inverseOf: null,

	/**
	 * @type {[]} a list of relations that this query should be performed with
	 */
	_with: null,

	/**
	 * @type {boolean} whether to return each record as an array. If false (default), an object
	 * of [[modelClass]] will be created to represent each record.
	 */
	_asArray: null,

	/**
	 * Constructor.
	 * @param {Jii.sql.ActiveRecord} modelClass the model class associated with this query
	 * @param {[]} config configurations to be applied to the newly created query object
	 */
	constructor: function (modelClass, config) {
		config = config || {};

		this.modelClass = modelClass;
		this.__super(config);
	},

	/**
	 * Initializes the object.
	 * This method is called at the end of the constructor. The default implementation will trigger
	 * an [[EVENT_INIT]] event. If you override this method, make sure you call the parent implementation at the end
	 * to ensure triggering of the event.
	 */
	init: function () {
		this.__super();
		this.trigger(this.__static.EVENT_INIT);
	},

	setSql: function(sql) {
		this._sql = sql;
	},

	getSql: function() {
		return this._sql;
	},

	setOn: function(on) {
		this._on = on;
	},

	getOn: function() {
		return this._on;
	},

	/**
	 * Executes query and returns all results as an array.
	 * @param {Jii.sql.Connection} [db] the DB connection used to create the DB command.
	 * If null, the DB connection returned by [[modelClass]] will be used.
	 * @returns {[]|ActiveRecord[]} the query results. If the query results in nothing, an empty array will be returned.
	 */
	all: function (db) {
		db = db || null;

		return this.__super(db);
	},

	/**
	 * @inheritdoc
	 */
	prepare: function (builder) {
		// NOTE: because the same ActiveQuery may be used to build different SQL statements
		// (e.g. by ActiveDataProvider, one for count query, the other for row data query,
		// it is important to make sure the same ActiveQuery can be used to build SQL statements
		// multiple times.
		if (!Jii._.isEmpty(this._joinWith)) {
			this._buildJoinWith();
			this._joinWith = [];    // clean it up to avoid issue https://github.com/jiisoft/jii2/issues/2687
		}

		if (Jii._.isEmpty(this._from)) {
			/** @typedef {Jii.sql.ActiveRecord} modelClass */
			var modelClass = this.modelClass;
			var tableName = modelClass.tableName();
			this._from = [tableName];
		}

		if (Jii._.isEmpty(this._select) && !Jii._.isEmpty(this._join)) {
			var isBreak = false;
			Jii._.each(this._from, function(table, alias) {
				if (isBreak) {
					return;
				}

				if (Jii._.isString(alias)) {
					this._select = [alias + '.*'];
				} else if (Jii._.isString(table)) {
					var matches = /^(.*?)\s+({{\w+}}|\w+)/.exec(table);
					if (matches) {
						alias = matches[2];
					} else {
						alias = table;
					}
					this._select = [alias + '.*'];
				}
				isBreak = true;
			}.bind(this));
		}

		return Promise.resolve().then(function() {
			if (this.primaryModel === null) {
				// eager loading
				return Jii.sql.Query.createFromQuery(this);
			}

			// lazy loading of a relation
			var where = Jii._.clone(this._where);

			return Promise.resolve().then(function() {
				if (this._via instanceof this.__static) {
					// via junction table
					return this._via._findJunctionRows([this.primaryModel]).then(function(viaModels) {
						this._filterByModels(viaModels);
					}.bind(this));
				}

				if (!Jii._.isArray(this._via)) {
					this._filterByModels([this.primaryModel]);
					return;
				}

				// via relation
				/** @typedef {Jii.sql.ActiveQuery} viaQuery */
				var viaName = this._via[0];
				var viaQuery = this._via[1];

				if (viaQuery.multiple) {
					return viaQuery.all().then(function(viaModels) {
						this.primaryModel.populateRelation(viaName, viaModels);
						this._filterByModels(viaModels);
					}.bind(this));
				}

				return viaQuery.one().then(function(model) {
					this.primaryModel.populateRelation(viaName, model);
					this._filterByModels(model === null ? [] : [model]);
				}.bind(this));
			}.bind(this)).then(function() {
				var query = Jii.sql.Query.createFromQuery(this);
				this._where = where;
				return query;
			}.bind(this));
		}.bind(this)).then(function(query) {
			if (!Jii._.isEmpty(this._on)) {
				query.andWhere(this._on);
			}

			return query;
		}.bind(this));
	},

	/**
	 * @inheritdoc
	 */
	populate: function (rows) {
		if (Jii._.isEmpty(rows)) {
			return [];
		}

		var models = this._createModels(rows);

		if (!Jii._.isEmpty(this._join) && this._indexBy === null) {
			models = this._removeDuplicatedModels(models);
		}

		return Promise.resolve().then(function() {
			if (!Jii._.isEmpty(this._with)) {
				return this.findWith(this._with, models);
			}
		}.bind(this)).then(function() {
			if (!this._asArray) {
				Jii._.each(models, Jii._.bind(function (model) {
					model.afterFind();
				}, this));
			}

			return models;
		}.bind(this));
	},

	/**
	 * Removes duplicated models by checking their primary key values.
	 * This method is mainly called when a join query is performed, which may cause duplicated rows being returned.
	 * @param {[]} models the models to be checked
	 * @returns {[]} the distinctive models
	 */
	_removeDuplicatedModels: function (models) {
		var hash = {};
		var newModels = {};

		/** @typedef {Jii.sql.ActiveRecord} _class */
		var _class = this.modelClass;
		var pks = _class.primaryKey();

		if (pks.length > 1) {
			Jii._.each(models, function (model, i) {
				var key = [];
				_.each(pks, function (pk) {
					key.push(model.get(pk));
				});
				key = JSON.stringify(key);

				if (!hash[key]) {
					hash[key] = true;
					newModels[i] = model;
				}
			}.bind(this));
		} else {
			var pk = Jii._.values(pks)[0];
			Jii._.each(models, function (model, i) {
				var key = model.get(pk);

				if (!hash[key]) {
					hash[key] = true;
					newModels[i] = model;
				}
			}.bind(this));
		}

		return Jii._.values(newModels);
	},

	/**
	 * Executes query and returns a single row of result.
	 * @param {Jii.sql.Connection} [db] the DB connection used to create the DB command.
	 * If null, the DB connection returned by [[modelClass]] will be used.
	 * @returns {Jii.sql.ActiveRecord|[]|null} a single row of query result. Depending on the setting of [[asArray]],
	 * the query result may be either an array or an ActiveRecord object. Null will be returned
	 * if the query results in nothing.
	 */
	one: function (db) {
		db = db || null;

		return this.__super(db).then(function(row) {
			if (row) {
				return this.populate([row]).then(function(models) {
					return Jii._.values(models)[0] || null;
				});
			}

			return null;
		}.bind(this));
	},

	/**
	 * Creates a DB command that can be used to execute this query.
	 * @param {Jii.sql.Connection} db the DB connection used to create the DB command.
	 * If null, the DB connection returned by [[modelClass]] will be used.
	 * @returns {Jii.sql.Command} the created DB command instance.
	 */
	createCommand: function (db) {
		db = db || null;

		/** @typedef {Jii.sql.ActiveRecord} modelClass */
		var modelClass = this.modelClass;
		if (db === null) {
			db = modelClass.getDb();
		}

		return Promise.resolve().then(function() {
			if (this._sql === null) {
				return db.getQueryBuilder().build(this);
			}

			return [this._sql, this._params];
		}.bind(this)).then(function(buildParams) {
			var sql = buildParams[0];
			var params = buildParams[1];

			return db.createCommand(sql, params);
		});
	},

	/**
	 * Joins with the specified relations.
	 *
	 * This method allows you to reuse existing relation definitions to perform JOIN queries.
	 * Based on the definition of the specified relation(s), the method will append one or multiple
	 * JOIN statements to the current query.
	 *
	 * If the `eagerLoading` parameter is true, the method will also eager loading the specified relations,
	 * which is equivalent to calling [[with()]] using the specified relations.
	 *
	 * Note that because a JOIN query will be performed, you are responsible to disambiguate column names.
	 *
	 * This method differs from [[with()]] in that it will build up and execute a JOIN SQL statement
	 * for the primary table. And when `eagerLoading` is true, it will call [[with()]] in addition with the specified relations.
	 *
	 * @param {[]|object} _with the relations to be joined. Each array element represents a single relation.
	 * The array keys are relation names, and the array values are the corresponding anonymous functions that
	 * can be used to modify the relation queries on-the-fly. If a relation query does not need modification,
	 * you may use the relation name as the array value. Sub-relations can also be specified (see [[with()]]).
	 * For example,
	 *
	 * ```js
	 * // find all orders that contain books, and eager loading "books"
	 * Order.find().joinWith('books', true, 'INNER JOIN').all();
	 * // find all orders, eager loading "books", and sort the orders and books by the book names.
	 * Order.find().joinWith({
     *     books: function (query) {
     *         query.orderBy('item.name');
     *     }
     * }).all();
	 * ```
	 *
	 * @param {boolean|[]} eagerLoading whether to eager load the relations specified in `with`.
	 * When this is a boolean, it applies to all relations specified in `with`. Use an array
	 * to explicitly list which relations in `with` need to be eagerly loaded.
	 * @param {string|[]} joinType the join type of the relations specified in `with`.
	 * When this is a string, it applies to all relations specified in `with`. Use an array
	 * in the format of `relationName => joinType` to specify different join types for different relations.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	joinWith: function (_with, eagerLoading, joinType) {
		eagerLoading = Jii._.isUndefined(eagerLoading) || Jii._.isNull(eagerLoading) ? true : eagerLoading;
		joinType = joinType || 'LEFT JOIN';

		if (Jii._.isString(_with)) {
			_with = [_with];
		}
		this._joinWith.push([_with, eagerLoading, joinType]);

		return this;
	},

	setJoinWith: function(joinWith) {
		this._joinWith = joinWith;
	},

	getJoinWith: function() {
		return this._joinWith;
	},

	_buildJoinWith: function () {
		var join = Jii._.clone(this._join);
		this._join = [];

		Jii._.each(this._joinWith, Jii._.bind(function (config) {
			var _with = Jii._.clone(config[0]);
			var eagerLoading = config[1];
			var joinType = config[2];
			this._joinWithRelations(new this.modelClass(), _with, joinType);

			if (Jii._.isArray(eagerLoading)) {
				Jii._.each(_with, function (callback, name) {
					if (Jii._.isNumber(name)) {
						if (Jii._.indexOf(eagerLoading, callback) !== -1) {
							delete _with[name];
						}
					} else if (Jii._.indexOf(eagerLoading, name) !== -1) {
						delete _with[name];
					}
				}.bind(this));
			} else if (!eagerLoading) {
				_with = [];
			}

			this.with(_with);
		}, this));

		// remove duplicated joins added by joinWithRelations that may be added
		// e.g. when joining a relation and a via relation at the same time
		var uniqueJoins = {};
		Jii._.each(this._join, Jii._.bind(function (j) {
			uniqueJoins[JSON.stringify(j)] = j;
		}, this));
		this._join = Jii._.values(uniqueJoins);

		if (!Jii._.isEmpty(join)) {
			// append explicit join to joinWith()
			// https://github.com/jiisoft/jii2/issues/2880
			this._join = this._join.concat(join);
		}
	},

	/**
	 * Inner joins with the specified relations.
	 * This is a shortcut method to [[joinWith()]] with the join type set as "INNER JOIN".
	 * Please refer to [[joinWith()]] for detailed usage of this method.
	 * @param {[]} _with the relations to be joined with
	 * @param {boolean|[]} eagerLoading whether to eager loading the relations
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 * @see joinWith()
	 */
	innerJoinWith: function (_with, eagerLoading) {
		eagerLoading = Jii._.isUndefined(eagerLoading) || Jii._.isNull(eagerLoading) ? true : eagerLoading;

		return this.joinWith(_with, eagerLoading, 'INNER JOIN');
	},

	/**
	 * Modifies the current query by adding join fragments based on the given relations.
	 * @param {Jii.sql.ActiveRecord} model the primary model
	 * @param {[]} _with the relations to be joined
	 * @param {string|[]} joinType the join type
	 */
	_joinWithRelations: function (model, _with, joinType) {
		var relations = {};
		var relation;

		Jii._.each(_with, Jii._.bind(function (callback, name) {
			if (Jii._.isNumber(name)) {
				name = callback;
				callback = null;
			}

			var primaryModel = model;
			var parent = this;
			var prefix = '';
			var pos;
			while (true) {
				pos = name.indexOf('.');
				if (pos === -1) {
					break;
				}

				var childName = name.substr(pos + 1);

				name = name.substr(0, pos);
				var fullName = prefix === '' ? name : prefix + '.' + name;
				if (!Jii._.has(relations, fullName)) {
					relations[fullName] = relation = primaryModel.getRelation(name);
					this._joinWithRelation(parent, relation, this._getJoinType(joinType, fullName));
				} else {
					relation = relations[fullName];
				}
				primaryModel = new relation.modelClass();
				parent = relation;
				prefix = fullName;
				name = childName;
			}

			fullName = prefix === '' ? name : prefix + '.' + name;
			if (!Jii._.has(relations, fullName)) {
				relations[fullName] = relation = primaryModel.getRelation(name);
				if (callback !== null) {
					callback.call(null, relation);
				}
				if (!Jii._.isEmpty(relation.getJoinWith())) {
					relation._buildJoinWith();
				}
				this._joinWithRelation(parent, relation, this._getJoinType(joinType, fullName));
			}
		}, this));
	},

	/**
	 * Returns the join type based on the given join type parameter and the relation name.
	 * @param {string|[]} joinType the given join type(s)
	 * @param {string} name relation name
	 * @returns {string} the real join type
	 */
	_getJoinType: function (joinType, name) {
		if (Jii._.isObject(joinType) && Jii._.has(joinType, name)) {
			return joinType[name];
		} else {
			return Jii._.isString(joinType) ? joinType : 'INNER JOIN';
		}
	},

	/**
	 * Returns the table name and the table alias for [[modelClass]].
	 * @param {Jii.sql.ActiveQuery} query
	 * @returns {[]} the table name and the table alias.
	 */
	_getQueryTableName: function (query) {
		var tableName = '';

		if (Jii._.isEmpty(query.getFrom())) {
			/** @typedef Jii.sql.ActiveRecord modelClass */
			var modelClass = query.modelClass;
			tableName = modelClass.tableName();
		} else {
			var _from = query.getFrom();
			var isBreak = false;
			var queryTableName = null;
			Jii._.each(_from, function(tn, alias) {
				if (isBreak) {
					return;
				}

				tableName = tn;
				if (Jii._.isString(alias)) {
					queryTableName = [tableName, alias];
				}
				isBreak = true;
			});
			if (queryTableName) {
				return queryTableName;
			}
		}

		var matches = /^(.*?)\s+({{\w+}}|\w+)/.exec(tableName);
		var aliasMatch = matches !== null ? matches[2] : tableName;

		return [tableName, aliasMatch];
	},

	/**
	 * Joins a parent query with a child query.
	 * The current query object will be modified accordingly.
	 * @param {Jii.sql.ActiveQuery} parent
	 * @param {Jii.sql.ActiveQuery} child
	 * @param {string} joinType
	 */
	_joinWithRelation: function (parent, child, joinType) {
		var via = child.getVia();
		child.setVia(null);

		if (via instanceof Jii.sql.ActiveQuery) {
			// via table
			this._joinWithRelation(parent, via, joinType);
			this._joinWithRelation(via, child, joinType);
			return;
		} else if (Jii._.isArray(via)) {
			// via relation
			this._joinWithRelation(parent, via[1], joinType);
			this._joinWithRelation(via[1], child, joinType);
			return;
		}

		var parentQueryTableName = this._getQueryTableName(parent);
		var parentAlias = parentQueryTableName[1];

		var childQueryTableName = this._getQueryTableName(child);
		var childTable = childQueryTableName[0];
		var childAlias = childQueryTableName[1];

		if (!Jii._.isEmpty(child.link)) {

			if (parentAlias.indexOf('{{') === -1) {
				parentAlias = '{{' + parentAlias + '}}';
			}
			if (childAlias.indexOf('{{') === -1) {
				childAlias = '{{' + childAlias + '}}';
			}

			var on = [];
			Jii._.each(child.link, Jii._.bind(function (parentColumn, childColumn) {
				on.push(parentAlias + '.[[' + parentColumn + ']] = ' + childAlias + '.[[' + childColumn + ']]');
			}, this));
			on = on.join(' AND ');
			if (!Jii._.isEmpty(child.getOn())) {
				on = ['and', on, child.getOn()];
			}
		} else {
			on = child.getOn();
		}
		this.join(joinType, Jii._.isEmpty(child.getFrom()) ? childTable : child.getFrom(), on);

		if (!Jii._.isEmpty(child.getWhere())) {
			this.andWhere(child.getWhere());
		}
		if (!Jii._.isEmpty(child.getHaving())) {
			this.andHaving(child.getHaving());
		}
		if (!Jii._.isEmpty(child.getOrderBy())) {
			this.addOrderBy(child.getOrderBy());
		}
		if (!Jii._.isEmpty(child.getGroupBy())) {
			this.addGroupBy(child.getGroupBy());
		}
		if (!Jii._.isEmpty(child.getParams())) {
			this.addParams(child.getParams());
		}
		if (!Jii._.isEmpty(child.getJoin())) {
			Jii._.each(child.getJoin(), Jii._.bind(function (join) {
				this._join.push(join);
			}, this));
		}
		if (!Jii._.isEmpty(child.getUnion())) {
			Jii._.each(child.getUnion(), Jii._.bind(function (union) {
				this._union.push(union);
			}, this));
		}
	},

	/**
	 * Sets the ON condition for a relational query.
	 * The condition will be used in the ON part when [[ActiveQuery.joinWith()]] is called.
	 * Otherwise, the condition will be used in the WHERE part of a query.
	 *
	 * Use this method to specify additional conditions when declaring a relation in the [[ActiveRecord]] class:
	 *
	 * ```js
	 * public function getActiveUsers()
	 * {
     *     return this.hasMany(User.className(), {id: 'user_id'}).onCondition({active: true});
     * }
	 * ```
	 *
	 * @param {string|[]} condition the ON condition. Please refer to [[Query.where()]] on how to specify this parameter.
	 * @param {[]} params the parameters (name => value) to be bound to the query.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	onCondition: function (condition, params) {
		params = params || {};

		this._on = condition;
		this.addParams(params);
		return this;
	},

	/**
	 * Adds an additional ON condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'AND' operator.
	 * @param {string|[]} condition the new ON() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {[]} params the parameters (name => value) to be bound to the query.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 * @see onCondition()
	 * @see orOnCondition()
	 */
	andOnCondition: function (condition, params) {
		params = params || [];

		if (this._on === null) {
			this._on = condition;
		} else {
			this._on = ['and', this._on, condition];
		}
		this.addParams(params);
		return this;
	},

	/**
	 * Adds an additional ON condition to the existing one.
	 * The new condition() and the existing one will be joined using the 'OR' operator.
	 * @param {string|[]} condition the new ON() condition. Please refer to [[where()]]
	 * on how to specify this parameter.
	 * @param {[]} params the parameters (name => value) to be bound to the query.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 * @see onCondition()
	 * @see andOnCondition()
	 */
	orOnCondition: function (condition, params) {
		params = params || [];

		if (this._on === null) {
			this._on = condition;
		} else {
			this._on = ['or', this._on, condition];
		}
		this.addParams(params);
		return this;
	},

	/**
	 * Specifies the junction table for a relational query.
	 *
	 * Use this method to specify a junction table when declaring a relation in the [[ActiveRecord]] class:
	 *
	 * ```js
	 * public function getItems()
	 * {
     *     return this.hasMany(Item.className(), {id: 'item_id'})
     *                 .viaTable('order_item', {order_id: 'id'});
     * }
	 * ```
	 *
	 * @param {string} tableName the name of the junction table.
	 * @param {[]} link the link between the junction table and the table associated with [[primaryModel]].
	 * The keys of the array represent the columns in the junction table, and the values represent the columns
	 * in the [[primaryModel]] table.
	 * @param {function} callable a PHP callback for customizing the relation associated with the junction table.
	 * Its signature should be `function(query)`, where `query` is the query to be customized.
	 * @returns {Jii.sql.ActiveQuery}
	 * @see via()
	 */
	viaTable: function (tableName, link, callable) {
		callable = callable || null;

		var relation = new Jii.sql.ActiveQuery(this.primaryModel, {
			from: [tableName],
			link: link,
			multiple: true,
			asArray: true
		});
		this._via = relation;
		if (callable !== null) {
			callable.call(null, relation);
		}

		return this;
	},

	/**
	 * Specifies the relation associated with the junction table.
	 *
	 * Use this method to specify a pivot record/table when declaring a relation in the [[ActiveRecord]] class:
	 *
	 * ```js
	 * public function getOrders()
	 * {
     *     return this.hasOne(Order.className(), {id: 'order_id'});
     * }
	 *
	 * public function getOrderItems()
	 * {
     *     return this.hasMany(Item.className(), {id: 'item_id'})
     *                 .via('orders');
     * }
	 * ```
	 *
	 * @param {string} relationName the relation name. This refers to a relation declared in [[primaryModel]].
	 * @param {function} callable a PHP callback for customizing the relation associated with the junction table.
	 * Its signature should be `function(query)`, where `query` is the query to be customized.
	 * @returns {Jii.sql.ActiveQuery} the relation object itself.
	 */
	via: function (relationName, callable) {
		callable = callable || null;

		var relation = this.primaryModel.getRelation(relationName);
		this._via = [relationName, relation];
		if (callable !== null) {
			callable.call(null, relation);
		}
		return this;
	},

	getVia: function() {
		return this._via;
	},

	setVia: function(via) {
		this._via = via;
	},

	/**
	 * Sets the name of the relation that is the inverse of this relation.
	 * For example, an order has a customer, which means the inverse of the "customer" relation
	 * is the "orders", and the inverse of the "orders" relation is the "customer".
	 * If this property is set, the primary record(s) will be referenced through the specified relation.
	 * For example, `customer.orders[0].customer` and `customer` will be the same object,
	 * and accessing the customer of an order will not trigger a new DB() query.
	 *
	 * Use this method when declaring a relation in the [[ActiveRecord]] class:
	 *
	 * ```js
	 * public function getOrders()
	 * {
     *     return this.hasMany(Order.className(), {customer_id: 'id'}).inverseOf('customer');
     * }
	 * ```
	 *
	 * @param {string} relationName the name of the relation that is the inverse of this relation.
	 * @returns {Jii.sql.ActiveQuery} the relation object itself.
	 */
	inverseOf: function (relationName) {
		this._inverseOf = relationName;
		return this;
	},

	/**
	 *
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	setInverseOf: function(inverseOf) {
		this._inverseOf = inverseOf;
	},

	/**
	 *
	 * @returns {string}
	 */
	getInverseOf: function() {
		return this._inverseOf;
	},

	/**
	 * Finds the related records for the specified primary record.
	 * This method is invoked when a relation of an ActiveRecord is being accessed in a lazy fashion.
	 * @param {string} name the relation name
	 * @param {Jii.base.ActiveRecord} model the primary model
	 * @returns {*} the related record(s)
	 * @throws InvalidParamException if the relation is invalid
	 */
	findFor: function (name, model) {

		return (this.multiple ? this.all() : this.one()).then(function(related) {

			if (this._inverseOf === null || Jii._.isEmpty(related)) {
				return related;
			}

			var inverseRelation = (new this.modelClass()).getRelation(this._inverseOf);

			if (this.multiple) {
				Jii._.each(related, Jii._.bind(function (relatedModel, i) {
					if (relatedModel instanceof Jii.sql.ActiveRecord) {
						relatedModel.populateRelation(this._inverseOf, inverseRelation.multiple ? [model] : model);
					} else {
						related[i][this._inverseOf] = inverseRelation.multiple ? [model] : model;
					}
				}, this));
			} else {
				if (related instanceof Jii.sql.ActiveRecord) {
					related.populateRelation(this._inverseOf, inverseRelation.multiple ? [model] : model);
				} else {
					related[this._inverseOf] = inverseRelation.multiple ? [model] : model;
				}
			}

			return related;
		}.bind(this));
	},

	/**
	 * Finds the related records and populates them into the primary models.
	 * @param {string} name the relation name
	 * @param {[]} primaryModels primary models
	 * @returns {[]} the related models
	 * @throws InvalidConfigException if [[link]] is invalid
	 */
	populateRelation: function (name, primaryModels) {
		if (!Jii._.isObject(this.link)) {
			throw new Jii.exceptions.InvalidConfigException('Invalid link: it must be an array of key-value pairs.');
		}

		/** @typedef {Jii.sql.ActiveQuery} viaQuery */
		var viaQuery = null;

		return Promise.resolve().then(function() {
			if (this._via instanceof this.__static) {
				viaQuery = this._via;

				// via junction table
				return this._via._findJunctionRows(primaryModels);
			}

			if (!Jii._.isArray(this._via)) {
				return primaryModels;

			}

			// via relation
			var viaName = this._via[0];
			viaQuery = this._via[1];

			if (viaQuery.getAsArray() === null) {
				// inherit asArray from primary query
				viaQuery.setAsArray(this._asArray);
			}

			viaQuery.primaryModel = null;
			return viaQuery.populateRelation(viaName, primaryModels);
		}.bind(this)).then(function(viaModels) {
			this._filterByModels(viaModels);

			if (primaryModels.length === 1 && !this.multiple) {
				return this.one().then(function(model) {

					Jii._.each(primaryModels, function (primaryModel, i) {
						if (primaryModel instanceof Jii.sql.ActiveRecord) {
							primaryModel.populateRelation(name, model);
						} else {
							primaryModels[i][name] = model;
						}
						if (this._inverseOf !== null) {
							this._populateInverseRelation(primaryModels, [model], name, this._inverseOf);
						}
					}.bind(this));

					return [model];
				}.bind(this));
			}

			// https://github.com/jiisoft/jii2/issues/3197
			// delay indexing related models after buckets are built
			var indexBy = this._indexBy;
			this._indexBy = null;

			return this.all().then(function(models) {
				var buckets = viaModels && viaQuery ?
					this._buildBuckets(models, this.link, viaModels, viaQuery.link) :
					this._buildBuckets(models, this.link);

				this._indexBy = indexBy;
				if (this._indexBy !== null && this.multiple) {
					buckets = this._indexBuckets(buckets, this._indexBy);
				}

				var link = Jii._.values(viaQuery ? viaQuery.link : this.link);
				Jii._.each(primaryModels, function (primaryModel, i) {
					var value = null;
					var k = Jii._.values(link)[0];
					var keys = primaryModel instanceof Jii.base.Model ? primaryModel.get(k) : primaryModel[k];

					if (this.multiple && Jii._.isArray(keys) && link.length == 1) {

						Jii._.each(keys, function (key) {
							if (!Jii._.isNumber(key) && !Jii._.isString(key)) {
								key = JSON.stringify(key);
							}
							if (Jii._.has(buckets, key)) {
								if (this._indexBy !== null) {
									// if indexBy is set, array_merge will cause renumbering of numeric array

									value = value || {};
									Jii._.extend(value, buckets);
								} else {
									value = value || [];
									value = value.concat(buckets[key]);
								}
							}
						}.bind(this));
					} else {
						var key = this._getModelKey(primaryModel, link);
						value = buckets[key] || (this.multiple ? [] : null);
					}

					if (primaryModel instanceof Jii.sql.ActiveRecord) {
						primaryModel.populateRelation(name, value);
					} else {
						primaryModels[i][name] = value;
					}
				}.bind(this));

				if (this._inverseOf !== null) {
					this._populateInverseRelation(primaryModels, models, name, this._inverseOf);
				}

				return models;
			}.bind(this));
		}.bind(this));
	},

	/**
	 * @param {Jii.sql.ActiveRecord[]} primaryModels primary models
	 * @param {Jii.sql.ActiveRecord[]} models models
	 * @param {string} primaryName the primary relation name
	 * @param {string} name the relation name
	 */
	_populateInverseRelation: function (primaryModels, models, primaryName, name) {
		if (Jii._.isEmpty(models) || Jii._.isEmpty(primaryModels)) {
			return;
		}

		var model = models[0];
		/** @typedef {Jii.sql.ActiveQuery} relation */
		var relation = model instanceof Jii.sql.ActiveRecord ?
			model.getRelation(name) :
			(new this.modelClass()).getRelation(name);

		if (relation.multiple) {
			var buckets = this._buildBuckets(primaryModels, relation.link, null, null, false);
			if (model instanceof Jii.sql.ActiveRecord) {
				Jii._.each(models, Jii._.bind(function (model) {
					var key = this._getModelKey(model, relation.link);
					model.populateRelation(name, buckets[key] || []);
				}, this));
			} else {
				Jii._.each(primaryModels, Jii._.bind(function (primaryModel, i) {
					if (this.multiple) {
						Jii._.each(primaryModel, function (m, j) {
							var key = this._getModelKey(m, relation.link);
							primaryModels[i][j][name] = buckets[key] || [];
						}.bind(this));
					} else if (!Jii._.isEmpty(primaryModel[primaryName])) {
						var key = this._getModelKey(primaryModel[primaryName], relation.link);
						primaryModels[i][primaryName][name] = buckets[key] || [];
					}
				}, this));
			}
		} else {
			if (this.multiple) {
				Jii._.each(primaryModels, function (primaryModel, i) {
					var model = primaryModel instanceof Jii.base.Model ? primaryModel.get(primaryName) : primaryModel[primaryName];
					Jii._.each(model, function (m, j) {
						if (m instanceof Jii.sql.ActiveRecord) {
							m.populateRelation(name, primaryModel);
						} else {
							model[j][name] = primaryModel;
						}
					});
				});
			} else {
				Jii._.each(primaryModels, function (primaryModel, i) {
					if (primaryModels[i][primaryName] instanceof Jii.sql.ActiveRecord) {
						primaryModels[i][primaryName].populateRelation(name, primaryModel);
					} else if (!Jii._.isEmpty(primaryModels[i][primaryName])) {
						primaryModels[i][primaryName][name] = primaryModel;
					}
				});
			}
		}
	},

	/**
	 * @param {[]} models
	 * @param {[]} link
	 * @param {[]} [viaModels]
	 * @param {[]} [viaLink]
	 * @param {boolean} [checkMultiple]
	 * @returns {object}
	 */
	_buildBuckets: function (models, link, viaModels, viaLink, checkMultiple) {
		viaModels = viaModels || null;
		viaLink = viaLink || null;
		checkMultiple = checkMultiple !== false;

		if (viaModels !== null) {
			var map = {};
			var viaLinkKeys = Jii._.keys(viaLink);
			var linkValues = Jii._.values(link);
			Jii._.each(viaModels, Jii._.bind(function (viaModel) {
				var key1 = this._getModelKey(viaModel, viaLinkKeys);
				var key2 = this._getModelKey(viaModel, linkValues);

				map[key2] = map[key2] || {};
				map[key2][key1] = true;
			}, this));
		}

		var buckets = {};
		var linkKeys = Jii._.keys(link);

		if (map) {
			Jii._.each(models, Jii._.bind(function (model, i) {
				var key = this._getModelKey(model, linkKeys);
				if (Jii._.has(map, key)) {
					Jii._.each(map[key], function(v, k) {
						buckets[k] = buckets[k] || [];
						buckets[k].push(model);
					});
				}
			}, this));
		} else {
			Jii._.each(models, function (model, i) {
				var key = this._getModelKey(model, linkKeys);
				buckets[key] = buckets[key] || [];
				buckets[key].push(model);
			}.bind(this));
		}

		if (checkMultiple && !this.multiple) {
			Jii._.each(buckets, function (bucket, i) {
				buckets[i] = bucket[0];
			});
		}

		return buckets;
	},

	/**
	 * Indexes buckets by column name.
	 *
	 * @param {object} buckets
	 * @param {string|function} indexBy the name of the column by which the query results should be indexed by.
	 * This can also be a callable (e.g. anonymous function) that returns the index value based on the given row data.
	 * @returns {object}
	 */
	_indexBuckets: function (buckets, indexBy) {
		var result = {};
		Jii._.each(buckets, function (models, key) {
			result[key] = {};
			Jii._.each(models, function (model) {
				var index = Jii._.isString(indexBy) ? model.get(indexBy) : indexBy.call(null, model);
				result[key][index] = model;
			});
		});
		return result;
	},

	/**
	 * @param {object} attributes the attributes to prefix
	 * @returns {object}
	 */
	_prefixKeyColumns: function (attributes) {
		if (!Jii._.isEmpty(this._join) || !Jii._.isEmpty(this._joinWith)) {
			var alias = null;

			if (Jii._.isEmpty(this._from)) {
				/** @typedef {Jii.sql.ActiveRecord} modelClass */
				var modelClass = this.modelClass;
				alias = modelClass.tableName();
			} else {
				var isBreak = false;
				Jii._.each(this._from, function(t, a) {
					if (isBreak) {
						return;
					}

					if (!Jii._.isString(a)) {
						alias = t;
					}
					isBreak = true;
				});
			}

			if (alias !== null) {
				Jii._.each(attributes, function(attribute, i) {
					attributes[i] = alias + '.' + attribute;
				});
			}
		}
		return attributes;
	},

	/**
	 * @param {[]} models
	 */
	_filterByModels: function (models) {
		var attributes = Jii._.keys(this.link);

		attributes = this._prefixKeyColumns(attributes);

		var values = [];
		if (Jii._.size(attributes) === 1) {
			// single key
			var attribute = Jii._.values(this.link)[0];
			Jii._.each(models, Jii._.bind(function (model) {
				var value = model instanceof Jii.base.Model ? model.get(attribute) : model[attribute];
				if (value !== null) {
					if (Jii._.isArray(value)) {
						values = values.concat(value);
					} else {
						values.push(value);
					}
				}
			}, this));
		} else {
			// composite keys
			Jii._.each(models, Jii._.bind(function (model) {
				var v = {};
				Jii._.each(this.link, function (link, attribute) {
					v[attribute] = model instanceof Jii.base.Model ? model.get(attribute) : model[attribute];
				});
				values.push(v);
			}, this));
		}

		this.andWhere(['in', attributes, Jii._.unique(values)]);
	},

	/**
	 * @param {Jii.sql.ActiveRecord|[]} model
	 * @param {[]} attributes
	 * @returns {string}
	 */
	_getModelKey: function (model, attributes) {
		if (Jii._.size(attributes) > 1) {
			var key = [];
			Jii._.each(attributes, Jii._.bind(function (attribute) {
				key.push(model instanceof Jii.base.Model ? model.get(attribute) : model[attribute]);
			}, this));

			return JSON.stringify(key);
		} else {
			var attribute = Jii._.values(attributes)[0];
			var key = model instanceof Jii.base.Model ? model.get(attribute) : model[attribute];

			return Jii._.isNumber(key) || Jii._.isString(key) ? key : JSON.stringify(key);
		}
	},

	/**
	 * @param {[]} primaryModels either array of AR instances or arrays
	 * @returns {[]}
	 */
	_findJunctionRows: function (primaryModels) {
		if (Jii._.isEmpty(primaryModels)) {
			return Promise.resolve([]);
		}

		this._filterByModels(primaryModels);
		/** @typedef {Jii.sql.ActiveRecord} primaryModel */
		var primaryModel = primaryModels[0];
		if (!(primaryModel instanceof Jii.sql.ActiveRecord)) {
			// when primaryModels are array of arrays (asArray case)
			primaryModel = new this.modelClass();
		}

		return this.asArray().all(primaryModel.__static.getDb());
	},

	/**
	 * Sets the [[asArray]] property.
	 * @param {boolean} [value] whether to return the query results in terms of arrays instead of Active Records.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	asArray: function (value) {
		value = value !== false;

		this._asArray = value;
		return this;
	},

	/**
	 * @param {boolean} value
	 */
	setAsArray: function(value) {
		this._asArray = value
	},

	/**
	 *
	 * @returns {boolean}
	 */
	getAsArray: function() {
		return this._asArray;
	},

	/**
	 * Alias asArray method
	 * @param {boolean} value whether to return the query results in terms of arrays instead of Active Records.
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	asObject: function (value) {
		return this.asArray(value);
	},

	/**
	 *
	 * @param {boolean} value
	 */
	setAsObject: function(value) {
		this.setAsArray(value);
	},

	/**
	 *
	 * @returns {boolean}
	 */
	getAsObject: function() {
		return this.getAsArray();
	},

	/**
	 * Specifies the relations with which this query should be performed.
	 *
	 * The parameters to this method can be either one or multiple strings, or a single array
	 * of relation names and the optional callbacks to customize the relations.
	 *
	 * A relation name can refer to a relation defined in [[modelClass]]
	 * or a sub-relation that stands for a relation of a related record.
	 * For example, `orders.address` means the `address` relation defined
	 * in the model class corresponding to the `orders` relation.
	 *
	 * The followings are some usage examples:
	 *
	 * ~~~
	 * // find customers together with their orders and country
	 * Customer.find().with('orders', 'country').all();
	 * // find customers together with their orders and the orders' shipping address
	 * Customer.find().with('orders.address').all();
	 * // find customers together with their country and orders of status 1
	 * Customer.find().with({
     *     orders: function (query) {
     *         query.andWhere('status = 1');
     *     },
     *     'country',
     * }).all();
	 * ~~~
	 *
	 * You can call `with()` multiple times. Each call will add relations to the existing ones.
	 * For example, the following two statements are equivalent:
	 *
	 * ~~~
	 * Customer.find().with('orders', 'country').all();
	 * Customer.find().with('orders').with('country').all();
	 * ~~~
	 *
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	with: function () {
		var _with = Jii._.toArray(arguments);
		if (_with[0] && Jii._.isObject(_with[0])) {
			// the parameter is given as an array
			_with = _with[0];
		}

		if (Jii._.isEmpty(this._with)) {
			this._with = _with;
		} else if (!Jii._.isEmpty(_with)) {
			Jii._.each(_with, Jii._.bind(function (value, name) {
				if (Jii._.isNumber(name)) {
					// repeating relation is fine as normalizeRelations() handle it well
					this._with.push(value);
				} else {
					this._with[name] = value;
				}
			}, this));
		}

		return this;
	},

	/**
	 *
	 * @returns {Jii.sql.ActiveQuery} the query object itself
	 */
	setWith: function(_with) {
		this._with = _with;
	},

	/**
	 *
	 * @returns {[]}
	 */
	getWith: function() {
		return this._with;
	},

	/**
	 * Converts found rows into model instances
	 * @param {[]} rows
	 * @returns {[]|ActiveRecord[]}
	 */
	_createModels: function (rows) {
		var models = null;
		if (this._asArray) {
			if (this._indexBy === null) {
				return rows;
			}

			models = {};
			Jii._.each(rows, Jii._.bind(function (row) {
				var key = Jii._.isString(this._indexBy) ?
					row[this._indexBy] :
					this._indexBy.call(null, row);
				models[key] = row;
			}, this));
		} else {
			/** @typedef {Jii.sql.ActiveRecord} _class */
			var _class = this.modelClass;
			if (this._indexBy === null) {

				models = [];
				Jii._.each(rows, function (row) {
					/** @typedef {Jii.sql.ActiveRecord} model */
					var model = _class.instantiate(row);

					_class.populateRecord(model, row);
					models.push(model);
				});
			} else {

				models = {};
				Jii._.each(rows, function (row) {
					/** @typedef {Jii.sql.ActiveRecord} model */
					var model = _class.instantiate(row);

					_class.populateRecord(model, row);

					var key = Jii._.isString(this._indexBy) ?
						model.get(this._indexBy) :
						this._indexBy.call(null, model);
					models[key] = model;
				}.bind(this));
			}
		}

		return models;
	},

	/**
	 * Finds records corresponding to one or multiple relations and populates them into the primary models.
	 * @param {[]} _with a list of relations that this query should be performed with. Please
	 * refer to [[with()]] for details about specifying this parameter.
	 * @param {[]|ActiveRecord[]} models the primary models (can be either AR instances or arrays)
	 */
	findWith: function (_with, models) {
		var primaryModel = new this.modelClass();
		var relations = this._normalizeRelations(primaryModel, _with);
		var promises = [];

		/** @typedef {Jii.sql.ActiveQuery} relation */
		Jii._.each(relations, Jii._.bind(function (relation, name) {
			if (relation.getAsArray() === null) {
				// inherit asArray from primary query
				relation.setAsArray(this._asArray);
			}

			promises.push(relation.populateRelation(name, models));
		}, this));

		return Promise.all(promises);
	},

	/**
	 * @param {Jii.sql.ActiveRecord} model
	 * @param {[]} _with
	 * @returns {Object.<string, Jii.sql.ActiveQuery>}
	 */
	_normalizeRelations: function (model, _with) {
		var relations = {};
		Jii._.each(_with, Jii._.bind(function (callback, name) {
			if (Jii._.isNumber(name)) {
				name = callback;
				callback = null;
			}

			var childName = null;
			var pos = name.indexOf('.');
			if (pos !== -1) {
				// with sub-relations
				childName = name.substr(pos + 1);
				name = name.substr(0, pos);
			}

			var relation = null;
			if (!Jii._.has(relations, name)) {
				relation = model.getRelation(name);
				relation.primaryModel = null;
				relations[name] = relation;
			} else {
				relation = relations[name];
			}

			if (childName) {
				var _with = {};
				_with[childName] = callback;
				relation.with(_with);
			} else if (callback !== null) {
				callback.call(null, relation);
			}
		}, this));

		return relations;
	}
});
