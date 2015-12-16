
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 *
 * @class Jii.sql.remote.Connection
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.sql.remote.Connection', /** @lends Jii.sql.remote.Connection.prototype */{

	__extends: Jii.base.Component,

    /**
     * @type {Jii.sql.remote.Schema} the database schema
     */
    schema: {
        className: 'Jii.sql.remote.Schema'
    },

    init: function() {
        this.schema = Jii.createObject(this.schema);
    },

    /**
     * Returns the schema information for the database opened by this connection.
     * @returns {Jii.sql.remote.Schema} the schema information for the database opened by this connection.
     */
    getSchema: function () {
        return this.schema;
    },

    /**
     * Obtains the schema information for the named table.
     * @param {string} name table name.
     * @returns {*} table schema information. Null if the named table does not exist.
     */
    getTableSchema: function (name) {
        return this.getSchema().getTableSchema(name);
    }

});