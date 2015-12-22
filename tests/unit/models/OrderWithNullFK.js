
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.OrderWithNullFK
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.OrderWithNullFK', {

	__extends: 'tests.unit.models.ActiveRecord',

	__static: {

		tableName: function () {
			return 'order_with_null_fk';
		}

	}


});
