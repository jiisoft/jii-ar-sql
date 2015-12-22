'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 * @class Jii.sql.remote.TransportInterface
 * @interface Jii.sql.remote.TransportInterface
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.sql.remote.TransportInterface', /** @lends Jii.sql.remote.TransportInterface.prototype */{

	__extends: 'Jii.base.Component',

    /**
     * Send request to backend
     * @param {string} route
     * @param {object} [params]
     * @returns {Promise}
     */
	request: function(route, params) {
	}

});