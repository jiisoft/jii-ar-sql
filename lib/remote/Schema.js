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

	__extends: Jii.base.Object,


    tables: {},

    /**
     *
     * @param name
     * @returns {Jii.base.ModelSchema}
     */
    getTableSchema: function (name) {
        if (Jii._.isObject(this.tables[name]) && !(this.tables[name] instanceof Jii.base.ModelSchema)) {
            this.tables[name] = Jii.base.ModelSchema.createFromObject(this.tables[name]);
        }

        return this.tables[name] || null;
    },

    getTableNames: function () {
        return Jii._.keys(this.tables);
    }

});
