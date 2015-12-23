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
 * Migration is the base class for representing a database migration.
 *
 * Migration is designed to be used together with the "jii migrate" command.
 *
 * Each child class of Migration represents an individual database migration which
 * is identified by the child class name.
 *
 * Within each migration, the [[up()]] method should be overridden to contain the logic
 * for "upgrading" the database; while the [[down()]] method for the "downgrading"
 * logic. The "jii migrate" command manages all available migrations in an application.
 *
 * If the database supports transactions, you may also override [[safeUp()]] and
 * [[safeDown()]] so that if anything wrong happens during the upgrading or downgrading,
 * the whole migration can be reverted in a whole.
 *
 * Migration provides a set of convenient methods for manipulating database data and schema.
 * For example, the [[insert()]] method can be used to easily insert a row of data into
 * a database table; the [[createTable()]] method can be used to create a database table.
 * Compared with the same methods in [[Command]], these methods will display extra
 * information showing the method parameters and execution time, which may be useful when
 * applying migrations.
 *
 * @class Jii.sql.Migration
 * @extends Jii.base.Component
 */
Jii.defineClass('Jii.sql.Migration', /** @lends Jii.sql.Migration.prototype */{

	__extends: 'Jii.base.Component',

    /**
     * @type {Jii.sql.BaseConnection|object|string} the DB connection object or the application component ID of the DB connection
     * that this migration should work with. Starting from version 2.0.2, this can also be a configuration array
     * for creating the object.
     */
    db: null,

    /**
     * Initializes the migration.
     * This method will set [[db]] to be the 'db' application component, if it is `null`.
     */
    init: function () {
        this.__super();

        this.db = this.db === null ?
            Jii.app.get('db') :
            (
                this.db instanceof Jii.base.Component ?
                    this.db :
                    Jii.createObject(this.db)
            );
    },

    /**
     * This method contains the logic to be executed when applying this migration.
     * Child classes may override this method to provide actual migration logic.
     * @returns {boolean} return a false value to indicate the migration fails
     * and should not proceed further. All other return values mean the migration succeeds.
     */
    up: function () {
        return false;
    },

    /**
     * This method contains the logic to be executed when removing this migration.
     * The default implementation throws an exception indicating the migration cannot be removed.
     * Child classes may override this method if the corresponding migrations can be removed.
     * @returns {boolean} return a false value to indicate the migration fails
     * and should not proceed further. All other return values mean the migration succeeds.
     */
    down: function () {
        return false;
    },

    /**
     * Executes a SQL statement.
     * This method executes the specified SQL statement using [[db]].
     * @param {string} sql the SQL statement to be executed
     * @param {object} params input parameters (name => value) for the SQL execution.
     */
    execute: function (sql, params) {
        params = params || {};

        console.log('    > execute SQL: sql ...');
        var time = this._time();
        return this.db.createCommand(sql).bindValues(params).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Creates and executes an INSERT SQL statement.
     * The method will properly escape the column names, and bind the values to be inserted.
     * @param {string} table the table that new rows() will be inserted into.
     * @param {object} columns the column data (name => value) to be inserted into the table.
     */
    insert: function (table, columns) {
        console.log('    > insert into table ...');
        var time = this._time();
        return this.db.createCommand().insert(table, columns).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Creates and executes an batch INSERT SQL statement.
     * The method will properly escape the column names, and bind the values to be inserted.
     * @param {string} table the table that new rows() will be inserted into.
     * @param {[]} columns the column names.
     * @param {[]} rows the rows to be batch inserted into the table
     */
    batchInsert: function (table, columns, rows) {
        console.log('    > insert into table ...');
        var time = this._time();
        return this.db.createCommand().batchInsert(table, columns, rows).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Creates and executes an UPDATE SQL statement.
     * The method will properly escape the column names and bind the values to be updated.
     * @param {string} table the table to be updated.
     * @param {object} columns the column data (name => value) to be updated.
     * @param {object|string} [condition] the conditions that will be put in the WHERE part. Please
     * refer to [[Query.where()]] on how to specify conditions.
     * @param {object} [params] the parameters to be bound to the query.
     */
    update: function (table, columns, condition, params) {
        condition = condition || '';
        params = params || {};

        console.log('    > update table ...');
        var time = this._time();
        return this.db.createCommand().update(table, columns, condition, params).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Creates and executes a DELETE SQL statement.
     * @param {string} table the table where the data will be deleted from.
     * @param {object|string} [condition] the conditions that will be put in the WHERE part. Please
     * refer to [[Query.where()]] on how to specify conditions.
     * @param {object} [params] the parameters to be bound to the query.
     */
    delete: function (table, condition, params) {
        condition = condition || '';
        params = params || {};

        console.log('    > delete from table ...');
        var time = this._time();
        return this.db.createCommand().delete(table, condition, params).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for creating a new DB() table.
     *
     * The columns in the new  table should be specified as name-definition pairs (e.g. 'name' => 'string'),
     * where name stands for a column name which will be properly quoted by the method, and definition
     * stands for the column type which can contain an abstract DB type.
     *
     * The [[QueryBuilder.getColumnType()]] method will be invoked to convert any abstract type into a physical one.
     *
     * If a column is specified with definition only (e.g. 'PRIMARY KEY (name, type)'), it will be directly
     * put into the generated SQL.
     *
     * @param {string} table the name of the table to be created. The name will be properly quoted by the method.
     * @param {object} columns the columns (name => definition) in the new table.()
     * @param {string} [options] additional SQL fragment that will be appended to the generated SQL.
     */
    createTable: function (table, columns, options) {
        options = options || null;

        console.log('    > create table table ...');
        var time = this._time();
        return this.db.createCommand().createTable(table, columns, options).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for renaming a DB table.
     * @param {string} table the table to be renamed. The name will be properly quoted by the method.
     * @param {string} newName the new table() name. The name will be properly quoted by the method.
     */
    renameTable: function (table, newName) {
        console.log('    > rename table table to newName ...');
        var time = this._time();
        return this.db.createCommand().renameTable(table, newName).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for dropping a DB table.
     * @param {string} table the table to be dropped. The name will be properly quoted by the method.
     */
    dropTable: function (table) {
        console.log('    > drop table table ...');
        var time = this._time();
        return this.db.createCommand().dropTable(table).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for truncating a DB table.
     * @param {string} table the table to be truncated. The name will be properly quoted by the method.
     */
    truncateTable: function (table) {
        console.log('    > truncate table table ...');
        var time = this._time();
        return this.db.createCommand().truncateTable(table).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for adding a new DB() column.
     * @param {string} table the table that the new column() will be added to. The table name will be properly quoted by the method.
     * @param {string} column the name of the new column.() The name will be properly quoted by the method.
     * @param {string} type the column type. The [[QueryBuilder.getColumnType()]] method will be invoked to convert abstract column type (if any)
     * into the physical one. Anything that is not recognized as abstract type will be kept in the generated SQL.
     * For example, 'string' will be turned into 'varchar(255)', while 'string not null' will become 'varchar(255) not null'.
     */
    addColumn: function (table, column, type) {
        console.log('    > add column column type to table table ...');
        var time = this._time();
        return this.db.createCommand().addColumn(table, column, type).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for dropping a DB column.
     * @param {string} table the table whose column is to be dropped. The name will be properly quoted by the method.
     * @param {string} column the name of the column to be dropped. The name will be properly quoted by the method.
     */
    dropColumn: function (table, column) {
        console.log('    > drop column column from table table ...');
        var time = this._time();
        return this.db.createCommand().dropColumn(table, column).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for renaming a column.
     * @param {string} table the table whose column is to be renamed. The name will be properly quoted by the method.
     * @param {string} name the old name of the column. The name will be properly quoted by the method.
     * @param {string} newName the new name() of the column. The name will be properly quoted by the method.
     */
    renameColumn: function (table, name, newName) {
        console.log('    > rename column name in table table to newName ...');
        var time = this._time();
        return this.db.createCommand().renameColumn(table, name, newName).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for changing the definition of a column.
     * @param {string} table the table whose column is to be changed. The table name will be properly quoted by the method.
     * @param {string} column the name of the column to be changed. The name will be properly quoted by the method.
     * @param {string} type the new column() type. The [[QueryBuilder.getColumnType()]] method will be invoked to convert abstract column type (if any)
     * into the physical one. Anything that is not recognized as abstract type will be kept in the generated SQL.
     * For example, 'string' will be turned into 'varchar(255)', while 'string not null' will become 'varchar(255) not null'.
     */
    alterColumn: function (table, column, type) {
        console.log('    > alter column column in table table to type ...');
        var time = this._time();
        return this.db.createCommand().alterColumn(table, column, type).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for creating a primary key.
     * The method will properly quote the table and column names.
     * @param {string} name the name of the primary key constraint.
     * @param {string} table the table that the primary key constraint will be added to.
     * @param {string|[]} columns comma separated string or array of columns that the primary key will consist of.
     */
    addPrimaryKey: function (name, table, columns) {
        console.log('    > add primary key name on table (' + [].concat(columns).join(',') + ') ...');
        var time = this._time();
        return this.db.createCommand().addPrimaryKey(name, table, columns).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for dropping a primary key.
     * @param {string} name the name of the primary key constraint to be removed.
     * @param {string} table the table that the primary key constraint will be removed from.
     */
    dropPrimaryKey: function (name, table) {
        console.log('    > drop primary key name ...');
        var time = this._time();
        return this.db.createCommand().dropPrimaryKey(name, table).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds a SQL statement for adding a foreign key constraint to an existing table.
     * The method will properly quote the table and column names.
     * @param {string} name the name of the foreign key constraint.
     * @param {string} table the table that the foreign key constraint will be added to.
     * @param {string|[]} columns the name of the column to that the constraint will be added on. If there are multiple columns, separate them with commas or use an array.
     * @param {string} refTable the table that the foreign key references to.
     * @param {string|[]} refColumns the name of the column that the foreign key references to. If there are multiple columns, separate them with commas or use an array.
     * @param {string} [isDelete] the ON DELETE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
     * @param {string} [isUpdate] the ON UPDATE option. Most DBMS support these options: RESTRICT, CASCADE, NO ACTION, SET DEFAULT, SET NULL
     */
    addForeignKey: function (name, table, columns, refTable, refColumns, isDelete, isUpdate) {
        isDelete = isDelete || null;
        isUpdate = isUpdate || null;

        console.log('    > add foreign key name: table (' + [].concat(columns).join(',') + ') references refTable (' + [].concat(refColumns).join(',') + ') ...');
        var time = this._time();
            return this.db.createCommand().addForeignKey(name, table, columns, refTable, refColumns, isDelete, isUpdate).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds a SQL statement for dropping a foreign key constraint.
     * @param {string} name the name of the foreign key constraint to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose foreign is to be dropped. The name will be properly quoted by the method.
     */
    dropForeignKey: function (name, table) {
        console.log('    > drop foreign key name from table table ...');
        var time = this._time();
        return this.db.createCommand().dropForeignKey(name, table).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for creating a new index.()
     * @param {string} name the name of the index. The name will be properly quoted by the method.
     * @param {string} table the table that the new index() will be created for. The table name will be properly quoted by the method.
     * @param {string|[]} columns the column(s) that should be included in the index. If there are multiple columns, please separate them
     * by commas or use an array. Each column name will be properly quoted by the method. Quoting will be skipped for column names that
     * include a left parenthesis "(".
     * @param {boolean} [unique] whether to add UNIQUE constraint on the created index.
     */
    createIndex: function (name, table, columns, unique) {
        unique = unique || false;

        console.log('    > create' + (unique ? ' unique' : '') + ' index name on table (' + [].concat(columns).join(',') + ') ...');
        var time = this._time();
        return this.db.createCommand().createIndex(name, table, columns, unique).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },

    /**
     * Builds and executes a SQL statement for dropping an index.
     * @param {string} name the name of the index to be dropped. The name will be properly quoted by the method.
     * @param {string} table the table whose index is to be dropped. The name will be properly quoted by the method.
     */
    dropIndex: function (name, table) {
        console.log('    > drop index name ...');
        var time = this._time();
        return this.db.createCommand().dropIndex(name, table).then(function() {
            console.log(' done (time: ' + ((this._time() - time) / 1000)+ 's)\n');
        }.bind(this));
    },


    // SchemaBuildTrait


    /**
     * Creates a primary key column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    primaryKey: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_PK, length);
    },

    /**
     * Creates a big primary key column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    bigPrimaryKey: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_BIGPK, length);
    },

    /**
     * Creates a string column.
     * @param {number} [length] column size definition i.e. the maximum string length.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    string: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_STRING, length);
    },

    /**
     * Creates a text column.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    text: function () {
        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_TEXT);
    },

    /**
     * Creates a smallint column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    smallInteger: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_SMALLINT, length);
    },

    /**
     * Creates an integer column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    integer: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_INTEGER, length);
    },

    /**
     * Creates a bigint column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    bigInteger: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_BIGINT, length);
    },

    /**
     * Creates a float column.
     * @param {number} [precision] column value precision. First parameter passed to the column type, e.g. FLOAT(precision).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    float: function (precision) {
        precision = precision || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_FLOAT, precision);
    },

    /**
     * Creates a double column.
     * @param {number} [precision] column value precision. First parameter passed to the column type, e.g. DOUBLE(precision).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    double: function (precision) {
        precision = precision || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_DOUBLE, precision);
    },

    /**
     * Creates a decimal column.
     * @param {number} [precision] column value precision, which is usually the total number of digits.
     * First parameter passed to the column type, e.g. DECIMAL(precision, scale).
     * This parameter will be ignored if not supported by the DBMS.
     * @param {number} [scale] column value scale, which is usually the number of digits after the decimal point.
     * Second parameter passed to the column type, e.g. DECIMAL(precision, scale).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    decimal: function (precision, scale) {
        precision = precision || null;
        scale = scale || null;

        var length = [];
        if (precision !== null) {
            length.push(precision);
        }
        if (scale !== null) {
            length.push(scale);
        }
        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_DECIMAL, length);
    },

    /**
     * Creates a datetime column.
     * @param {number} [precision] column value precision. First parameter passed to the column type, e.g. DATETIME(precision).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    dateTime: function (precision) {
        precision = precision || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_DATETIME, precision);
    },

    /**
     * Creates a timestamp column.
     * @param {number} [precision] column value precision. First parameter passed to the column type, e.g. TIMESTAMP(precision).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    timestamp: function (precision) {
        precision = precision || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_TIMESTAMP, precision);
    },

    /**
     * Creates a time column.
     * @param {number} [precision] column value precision. First parameter passed to the column type, e.g. TIME(precision).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    time: function (precision) {
        precision = precision || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_TIME, precision);
    },

    /**
     * Creates a date column.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    date: function () {
        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_DATE);
    },

    /**
     * Creates a binary column.
     * @param {number} [length] column size or precision definition.
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    binary: function (length) {
        length = length || null;

        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_BINARY, length);
    },

    /**
     * Creates a boolean column.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    boolean: function () {
        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_BOOLEAN);
    },

    /**
     * Creates a money column.
     * @param {number} [precision] column value precision, which is usually the total number of digits.
     * First parameter passed to the column type, e.g. DECIMAL(precision, scale).
     * This parameter will be ignored if not supported by the DBMS.
     * @param {number} [scale] column value scale, which is usually the number of digits after the decimal point.
     * Second parameter passed to the column type, e.g. DECIMAL(precision, scale).
     * This parameter will be ignored if not supported by the DBMS.
     * @returns {Jii.sql.ColumnSchemaBuilder} the column instance which can be further customized.
     * @since 2.0.6
     */
    money: function (precision, scale) {
        precision = precision || null;
        scale = scale || null;

        var length = [];
        if (precision !== null) {
            length.push(precision);
        }
        if (scale !== null) {
            length.push(scale);
        }
        return this.db.getSchema().createColumnSchemaBuilder(Jii.sql.BaseSchema.TYPE_MONEY, length);
    },

    _time: function() {
        return (new Date()).getTime();
    }

});
