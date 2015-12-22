'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.OrderItem
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.OrderItem', {

	__extends: 'tests.unit.models.ActiveRecord',

	__static: {

		tableName: function () {
			return 'order_item';
		}

	},

	getOrder: function () {
		return this.hasOne(tests.unit.models.Order.className(), {id: 'order_id'});
	},

	getItem: function () {
		return this.hasOne(tests.unit.models.Item.className(), {id: 'item_id'});
	}

});
