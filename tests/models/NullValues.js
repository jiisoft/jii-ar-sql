'use strict';

var Jii = require('jii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.NullValues
 * @extends tests.unit.models.ActiveRecord
 */
module.exports = Jii.defineClass('tests.unit.models.NullValues', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'null_values';
		}

	}

});
