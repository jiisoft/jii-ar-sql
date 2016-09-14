/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var ModelEvent = require('jii/base/ModelEvent')

/**
 * @class Jii.sql.AfterSaveEvent
 * @extends Jii.base.ModelEvent
 */
module.exports = Jii.defineClass('Jii.sql.AfterSaveEvent', /** @lends Jii.sql.AfterSaveEvent.prototype */{

	__extends: ModelEvent,

	/**
	 * The attribute values that had changed and were saved.
	 * @type {string[]}
	 */
	changedAttributes: null

});
