'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

/**
 * @class <%= className %>
 * @extends Jii.sql.Migration
 */
Jii.defineClass('<%= className %>', /** @lends <%= className %>.prototype */{

    __extends: Jii.sql.Migration,

    up() {

    },

    down() {
        console.log('<%= className %> cannot be reverted.');
        return false;
    }

});
