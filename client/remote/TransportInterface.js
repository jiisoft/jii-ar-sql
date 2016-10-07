'use strict';

var Jii = require('jii');
var Component = require('jii/base/Component');

/**
 * @class Jii.sql.remote.TransportInterface
 * @interface Jii.sql.remote.TransportInterface
 * @extends Jii.base.Component
 */
var TransportInterface = Jii.defineClass('Jii.sql.remote.TransportInterface', /** @lends Jii.sql.remote.TransportInterface.prototype */{

	__extends: Component,

    /**
     * Send request to backend
     * @param {string} route
     * @param {object} [params]
     * @returns {Promise}
     */
	request(route, params) {
	}

});

module.exports = TransportInterface;