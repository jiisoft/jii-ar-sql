
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var mysql = require('mysql');

require('../BaseConnection');

/**
 *
 * @class Jii.sql.mysql.Connection
 * @extends Jii.sql.BaseConnection
 */
Jii.defineClass('Jii.sql.mysql.Connection', {

	__extends: Jii.sql.BaseConnection,

	/**
	 * @type {string}
	 */
	host: '127.0.0.1',

	/**
	 * @type {string}
	 */
	port: 3306,

	/**
	 * @type {string}
	 */
	database: '',

	/**
	 * @type {string|object}
	 */
	schemaClass: 'Jii.sql.mysql.Schema',

	/**
	 * @type {string}
	 */
	driverName: 'mysql',

	_connection: null,

	/**
	 * Initializes the DB connection.
	 * This method is invoked right after the DB connection is established.
	 * @protected
	 */
	_initConnection: function () {
		this._connection = mysql.createConnection({
			host: this.host,
			port: this.port,
			user: this.username,
			password: this.password,
			database: this.database,
			timezone: 'local',
			typeCast: this._typeCast
		});
		this._connection.on('error', this._onError);
		this._connection.connect();

		if (this.charset !== null) {
			this.exec('SET NAMES ' + this.quoteValue(this.charset));
		}

		this.__super();
	},

	/**
	 * @protected
	 */
	_closeConnection: function () {
		if (this._connection) {
			this._connection.end();
		}
	},

	/**
	 * Disable auto typing
	 * @returns {string}
	 * @private
	 */
	_typeCast: function (field, next) {
		return field.string();
	},

	/**
	 *
	 * @param {string} message
	 * @private
	 */
	_onError: function(message) {

	},

	/**
	 *
	 * @param {string} sql
	 * @param {string} [method]
	 * @returns {Jii.when}
	 */
	exec: function(sql, method) {
		method = method || null;

		//console.log(sql);

		return new Jii.when.promise(function(resolve, reject) {
			this._connection.query(sql, function(err, rows) {
				if (err) {
					Jii.error('Database query error, sql: `' + sql + '`, error: ' + String(err));

					if (method === 'execute' || method === null) {
						reject(new Jii.sql.SqlQueryException(err));
					} else {
						resolve(false);
					}
					return;
				}

				var result = null;
				switch (method) {
					case 'execute':
						result = {
							affectedRows : rows.affectedRows,
							insertId: rows.insertId || null
						};
						break;

					case 'one':
						result = rows.length > 0 ? rows[0] : null;
						break;

					case 'all':
						result = rows;
						break;

					case 'scalar':
						result = rows.length > 0 ? Jii._.values(rows[0])[0] : null;
						break;

					case 'column':
						result = Jii._.map(rows, function(row) {
							return Jii._.values(row)[0];
						});
						break;

					default:
						result = rows;
				}

				resolve(result);
			});
		}.bind(this));
	}

});