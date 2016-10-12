'use strict';

var Jii = require('jii');
var Migration = require('../Migration')

/**
 * @class <%= className %>
 * @extends Jii.sql.Migration
 */
module.exports = Jii.defineClass('<%= className %>', /** @lends <%= className %>.prototype */{

    __extends: Migration,

    up() {

    },

    down() {
        console.log('<%= className %> cannot be reverted.');
        return false;
    }

});
