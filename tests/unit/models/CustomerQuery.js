
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.models.CustomerQuery
 * @extends Jii.sql.ActiveQuery
 */
var self = Jii.defineClass('tests.unit.models.CustomerQuery', {

	__extends: 'Jii.sql.ActiveQuery',

	__static: {
	},

	active: function () {
		this.andWhere('status=1');

		return this;
	}

});
