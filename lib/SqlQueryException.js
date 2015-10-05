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
 * @class Jii.sql.SqlQueryException
 * @extends Jii.exceptions.ApplicationException
 */
Jii.defineClass('Jii.sql.SqlQueryException', /** @lends Jii.sql.SqlQueryException.prototype */{

	__extends: Jii.exceptions.ApplicationException

});
