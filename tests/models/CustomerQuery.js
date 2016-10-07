'use strict';

var Jii = require('jii');
var ActiveQuery = require('jii-model/base/ActiveQuery');

/**
 * @class tests.unit.models.CustomerQuery
 * @extends Jii.base.ActiveQuery
 */
var CustomerQuery = Jii.defineClass('tests.unit.models.CustomerQuery', {

	__extends: ActiveQuery,

	active: function () {
		this.andWhere('status=1');

		return this;
	}

});

module.exports = CustomerQuery;