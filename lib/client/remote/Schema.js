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
 * @class Jii.sql.remote.Schema
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.sql.remote.Schema', /** @lends Jii.sql.remote.Schema.prototype */{

	__extends: 'Jii.base.Object',

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
        if (Jii._.isObject(this.tables[name]) && !(this.tables[name] instanceof Jii.base.ModelSchema)) {
            this.tables[name] = Jii.base.ModelSchema.createFromObject(this.tables[name]);
        }

        return this.tables[name] || null;
    },

    getTableNames() {
        return Jii._.keys(this.tables);
    },

    /**
     * @return {Jii.sql.FilterBuilder}
     */
    createFilterBuilder() {
        return new Jii.sql.FilterBuilder();
    }

});
