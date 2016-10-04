'use strict';

var Jii = require('jii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.OrderWithNullFK
 * @extends tests.unit.models.ActiveRecord
 */
module.exports = Jii.defineClass('tests.unit.models.OrderWithNullFK', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'order_with_null_fk';
		}

	}

});
