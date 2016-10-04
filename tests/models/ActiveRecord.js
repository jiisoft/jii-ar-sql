'use strict';

var Jii = require('jii');
var ActiveRecord = require('jii-ar-sql/ActiveRecord');

/**
 * @class tests.unit.models.ActiveRecord
 * @extends Jii.sql.ActiveRecord
 */
module.exports = Jii.defineClass('tests.unit.models.ActiveRecord', {

	__extends: ActiveRecord,

	__static: {

		afterSaveInsert: null,
		afterSaveNewRecord: null,

		db: null,

		getDb: function () {
			return module.exports.db;
		}

	}

});
