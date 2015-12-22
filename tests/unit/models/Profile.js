
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Profile
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.Profile', {

	__extends: 'tests.unit.models.ActiveRecord',

	__static: {

		tableName: function () {
			return 'profile';
		}

	}


});
