'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 * @class Jii.sql.remote.Command
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.sql.remote.Command', /** @lends Jii.sql.remote.Command.prototype */{

	__extends: 'Jii.base.Component',

    __static: /** @lends Jii.sql.remote.Command */{

        METHOD_INSERT: 'insert',
        METHOD_UPDATE: 'update',
        METHOD_DELETE: 'delete'

    },

	/**
	 * @type {Jii.sql.BaseConnection} the DB connection that this command is associated with
	 */
	db: null,

	/**
	 * @returns {Promise}
	 */
	queryAll() {
		return this._queryInternal('all');
	},

	/**
	 * @returns {Promise}
	 */
	queryOne() {
		return this._queryInternal('one');
	},

	/**
	 * @returns {Promise}
	 */
	queryScalar() {
		return this._queryInternal('scalar');
	},

	/**
	 * @returns {Promise}
	 */
	queryColumn() {
		return this._queryInternal('column');
	},

	/**
	 * Performs the actual DB query of a SQL statement.
	 * @param {string} method
	 * @returns {Promise} the method execution result
	 * @throws Exception if the query causes any problem
	 */
	_queryInternal(method) {
	},

    /**
     *
     * @param {Jii.sql.ActiveRecord} model
     * @param {object} values
     * @returns {Promise}
     */
    insertModel(model, values) {
        return this.db.exec(this.__static.METHOD_INSERT, model.className(), {
            values: values
        }).then(result => {
            if (!result) {
                return null;
            }

            if (!Jii._.isEmpty(result.errors)) {
                model.setErrors(result.errors);
                return null;
            }
            if (result.attributes) {
                model.setAttributes(result.attributes, false);
            }

            return {
                insertId: model.getPrimaryKey()
            };
        });
    },

    /**
     *
     * @param {Jii.base.ActiveRecord} model
     * @param {object} values
     * @returns {Promise}
     */
    updateModel(model, values) {
        return this.db.exec(this.__static.METHOD_UPDATE, model.className(), {
            primaryKey: model.getOldPrimaryKey(true),
            values: values
        }).then(result => {
            if (!result) {
                return 0;
            }

            if (!Jii._.isEmpty(result.errors)) {
                model.setErrors(result.errors);
                return 0;
            }

            return result.success ? 1 : 0;
        });
    },


    /**
     *
     * @param {Jii.base.ActiveRecord} model
     * @returns {Promise}
     */
    deleteModel(model) {
        return this.db.exec(this.__static.METHOD_DELETE, model.className(), {
            primaryKey: model.getOldPrimaryKey(true)
        }).then(result => {
            return result && result.success ? 1 : 0;
        });
    }

});