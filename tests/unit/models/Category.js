'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Category
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.Category', {

	__extends: tests.unit.models.ActiveRecord,

	__static: {

		tableName: function () {
			return 'category';
		}

	},

	getItems: function () {
		return this.hasMany(tests.unit.models.Item.className(), {category_id: 'id'});
	},

	getLimitedItems: function () {
		return this.hasMany(tests.unit.models.Item.className(), {category_id: 'id'}).onCondition({'item.id': [1, 2, 3]});
	},

	getOrderItems: function () {
		return this.hasMany(tests.unit.models.OrderItem.className(), {item_id: 'id'}).via('items');
	},

	getOrders: function () {
		return this.hasMany(tests.unit.models.Order.className(), {id: 'order_id'}).via('orderItems');
	}

});
