/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 * @class Jii.sql.AfterSaveEvent
 * @extends Jii.base.ModelEvent
 */
Jii.defineClass('Jii.sql.AfterSaveEvent', /** @lends Jii.sql.AfterSaveEvent.prototype */{

	__extends: Jii.base.ModelEvent,

	/**
	 * The attribute values that had changed and were saved.
	 * @type {string[]}
	 */
	changedAttributes: null

});
