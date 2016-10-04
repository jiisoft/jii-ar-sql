'use strict';

var Jii = require('jii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Profile
 * @extends tests.unit.models.ActiveRecord
 */
module.exports = Jii.defineClass('tests.unit.models.Profile', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'profile';
		}

	}

});
