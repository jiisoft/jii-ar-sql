'use strict';

var Jii = require('jii');
var ActiveRecord = require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Type
 * @extends tests.unit.models.ActiveRecord
 */
module.exports = Jii.defineClass('tests.unit.models.Type', {

	__extends: ActiveRecord,

	__static: {

		tableName: function () {
			return 'type';
		}

	}

});
