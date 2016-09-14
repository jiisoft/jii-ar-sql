/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Jii = require('jii');
var ApplicationException = require('jii/exceptions/ApplicationException');

/**
 * @class Jii.sql.SqlQueryException
 * @extends Jii.exceptions.ApplicationException
 */
module.exports = Jii.defineClass('Jii.sql.SqlQueryException', /** @lends Jii.sql.SqlQueryException.prototype */{

	__extends: ApplicationException

});
