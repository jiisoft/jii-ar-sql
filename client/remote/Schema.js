/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var FilterBuilder = require('../../FilterBuilder');
var ModelSchema = require('jii-model/base/ModelSchema');
var _isObject = require('lodash/isObject');
var _keys = require('lodash/keys');
var Object = require('jii/base/Object');

/**
 * @class Jii.sql.remote.Schema
 * @extends Jii.base.Object
 */
var Schema = Jii.defineClass('Jii.sql.remote.Schema', /** @lends Jii.sql.remote.Schema.prototype */{

	__extends: Object,

    tables: {},

    _filterBuilder: null,

    /**
     * @return {Jii.sql.QueryBuilder} the query builder for this connection.
     */
    getFilterBuilder() {
        if (this._filterBuilder === null) {
            this._filterBuilder = this.createFilterBuilder();
        }

        return this._filterBuilder;
    },

    /**
     *
     * @param {string} name
     * @returns {Jii.base.ModelSchema}
     */
    getTableSchema(name) {
        if (_isObject(this.tables[name]) && !(this.tables[name] instanceof ModelSchema)) {
            this.tables[name] = ModelSchema.createFromObject(this.tables[name]);
        }

        return this.tables[name] || null;
    },

    getTableNames() {
        return _keys(this.tables);
    },

    /**
     * @return {Jii.sql.FilterBuilder}
     */
    createFilterBuilder() {
        return new FilterBuilder();
    }

});

module.exports = Schema;