'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');

/**
 * @class tests.unit.models.Order
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.Order', {

	__extends: tests.unit.models.ActiveRecord,

	__static: {

		tableName: function () {
			return 'order';
		}

	},

	getCustomer: function () {
		return this.hasOne(tests.unit.models.Customer.className(), {id: 'customer_id'});
	},

	getCustomer2: function () {
		return this.hasOne(tests.unit.models.Customer.className(), {id: 'customer_id'}).inverseOf('orders2');
	},

	getOrderItems: function () {
		return this.hasMany(tests.unit.models.OrderItem.className(), {order_id: 'id'});
	},

	getOrderItemsWithNullFK: function () {
		return this.hasMany(tests.unit.models.OrderItemWithNullFK.className(), {order_id: 'id'});
	},

	getItems: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItems', function (q) {
				// additional query configuration
			}).orderBy('item.id');
	},

	getItemsIndexed: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItems').indexBy('id');
	},

	getItemsWithNullFK: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.viaTable('order_item_with_null_fk', {order_id: 'id'});
	},

	getItemsInOrder1: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItems', function (q) {
				q.orderBy({subtotal: 'asc'});
			}).orderBy('name');
	},

	getItemsInOrder2: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItems', function (q) {
				q.orderBy({subtotal: 'desc'});
			}).orderBy('name');
	},

	getBooks: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItems')
			.where({category_id: 1});
	},

	getBooksWithNullFK: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.via('orderItemsWithNullFK')
			.where({category_id: 1});
	},

	getBooksViaTable: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.viaTable('order_item', {order_id: 'id'})
			.where({category_id: 1});
	},

	getBooksWithNullFKViaTable: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.viaTable('order_item_with_null_fk', {order_id: 'id'})
			.where({category_id: 1});
	},

	getBooks2: function () {
		return this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'})
			.onCondition({category_id: 1})
			.viaTable('order_item', {order_id: 'id'});
	},

	beforeSave: function (insert) {
		return this.__super(insert).then(function(success) {
			if (!success) {
				return false;
			}

			this.created_at = Math.round(Date.now() / 1000);

			return true;
		}.bind(this));
	}


});
