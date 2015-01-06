'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Item
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.Item', {

	__extends: tests.unit.models.ActiveRecord,

	__static: {

		tableName: function () {
			return 'item';
		}

	},

	getCategory: function () {
		return this.hasOne(tests.unit.models.Category.className(), {id: 'category_id'});
	}

});
