
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.models.ActiveRecord
 * @extends Jii.sql.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.ActiveRecord', {

	__extends: 'Jii.sql.ActiveRecord',

	__static: {

		db: null,

		getDb: function () {
			return self.db;
		}

	}

});
