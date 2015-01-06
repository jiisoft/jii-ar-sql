'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var tests = Jii.namespace('tests');

require('./ActiveRecord.js');
require('./CustomerQuery.js');

/**
 * @class tests.unit.models.Customer
 * @extends tests.unit.models.ActiveRecord
 */
var self = Jii.defineClass('tests.unit.models.Customer', {

	__extends: tests.unit.models.ActiveRecord,

	__static: {

		STATUS_ACTIVE: 1,
		STATUS_INACTIVE: 2,

		tableName: function () {
			return 'customer';
		},

		/**
		 * @inheritdoc
		 * @returns {tests.unit.models.CustomerQuery}
		 */
		find: function () {
			return new tests.unit.models.CustomerQuery(this);
		}

	},

	status2: null,

	getProfile: function () {
		return this.hasOne(tests.unit.models.Profile.className(), {id: 'profile_id'});
	},

	getOrders: function () {
		return this.hasMany(tests.unit.models.Order.className(), {customer_id: 'id'}).orderBy('id');
	},

	getExpensiveOrders: function () {
		return this.hasMany(tests.unit.models.Order.className(), {customer_id: 'id'}).andWhere('total > 50').orderBy('id');
	},

	getExpensiveOrdersWithNullFK: function () {
		return this.hasMany(tests.unit.models.OrderWithNullFK.className(), {customer_id: 'id'}).andWhere('total > 50').orderBy('id');
	},

	getOrdersWithNullFK: function () {
		return this.hasMany(tests.unit.models.OrderWithNullFK.className(), {customer_id: 'id'}).orderBy('id');
	},

	getOrders2: function () {
		return this.hasMany(tests.unit.models.Order.className(), {customer_id: 'id'}).inverseOf('customer2').orderBy('id');
	},

	// deeply nested table relation
	getOrderItems: function () {
		/** @type Jii.sql.ActiveQuery rel */
		var rel = this.hasMany(tests.unit.models.Item.className(), {id: 'item_id'});

		return rel.viaTable('order_item', {order_id: 'id'}, function (q) {
			/* @type Jii.sql.ActiveQuery q */
			q.viaTable('order', {customer_id: 'id'});
		}).orderBy('id');
	},

	afterSave: function (insert, changedAttributes) {
		tests.unit.ActiveRecordTest.afterSaveInsert = insert;
		tests.unit.ActiveRecordTest.afterSaveNewRecord = this.isNewRecord();
		return this.__super(insert, changedAttributes);
	}


});
