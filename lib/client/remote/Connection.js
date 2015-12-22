
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

	__extends: 'Jii.base.Component',

    /**
     * @type {Jii.sql.remote.Schema} the database schema
     */
    schema: {
        className: 'Jii.sql.remote.Schema'
    },

    /**
     * @type {Jii.sql.remote.TransportInterface}
     */
    transport: null,

    /**
     * @type {string}
     */
    route: 'api/ar',

    init: function() {
        this.schema = Jii.createObject(this.schema);
    },

    getTransport: function() {
        if (this.transport === null) {
            this.transport = Jii.app.get('comet');
        } else if (!(this.transport instanceof Jii.base.Component)) {
            this.transport = Jii.createObject(this.transport);
        }
        return this.transport;
    },

    /**
     * Creates a command for execution.
     * @returns {Jii.sql.remote.Command} the DB command
     */
    createCommand: function () {
        return new Jii.sql.remote.Command({
            db: this
        });
    },

    /**
     *
     * @param {string} method
     * @param {string} modelClassName
     * @param {object} [params]
     * @returns {Promise}
     */
    exec: function(method, modelClassName, params) {
        params = params || {};
        params.method = method;
        params.modelClassName = modelClassName;

        return this.getTransport().request(this.route, params);
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