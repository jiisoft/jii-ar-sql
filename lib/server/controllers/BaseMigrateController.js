/**
 * @author Ihor Skliar <skliar.ihor@gmail.com>
 * @license MIT
 */

'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

var fs = require('fs');

/**
 * Provides help information about console commands.
 *
 * This command displays the available command list in
 * the application or the detailed instructions about using
 * a specific command.
 *
 * This command can be used as follows on command line:
 *
 * ~~~
 * jii help [command name]
 * ~~~
 *
 * In the above, if the command name is not provided, all
 * available commands will be displayed.
 *
 * @property array commands All available command names. This property is read-only.
 * @class Jii.sql.controllers.BaseMigrateController
 * @extends Jii.console.Controller
 */
Jii.defineClass('Jii.sql.controllers.BaseMigrateController', /** @lends Jii.sql.controllers.BaseMigrateController.prototype */{

    __extends: 'Jii.console.Controller',

    __static: /** @lends Jii.sql.controllers.BaseMigrateController */{

        /**
         * The name of the dummy migration that marks the beginning of the whole migration history.
         */
        BASE_MIGRATION: 'm000000_000000_base'

    },

    /**
     * @type {string} the default command action.
     */
    defaultAction: 'up',

    /**
     * @type {string} the directory storing the migration classes. This can be either
     * a path alias or a directory.
     */
    migrationPath: '@app/migrations',

    migrationNamespace: 'app.migrations',

    /**
     * @type {string} the template file for generating new migrations.
     * This can be either a path alias (e.g. "@app/migrations/template.js")
     * or a file path.
     */
    templateFile: null,

    /**
     * @type {[]} a set of template paths for generating migration code automatically.
     *
     * The key is the template type, the value is a path or the alias. Supported types are:
     * - `create_table`: table creating template
     * - `drop_table`: table dropping template
     * - `add_column`: adding new column() template
     * - `drop_column`: dropping column template
     * - `create_junction`: create junction template
     */
    generatorTemplateFiles: null,

    /**
     * @type {[]} column definition strings used for creating migration code.
     * The format of each definition is `COLUMN_NAME:COLUMN_TYPE:COLUMN_DECORATOR`.
     * For example, `--fields=name:string(12):notNull` produces a string column of size 12 which is not null.
     * @since 2.0.7
     */
    fields: [],

    /**
     * @inheritdoc
     */
    options: function (actionID) {
        return this.__super(actionID)
            .concat('migrationPath') // global for all actions
            .concat(actionID === 'create' ? ['templateFile', 'templateFileGenerators', 'fields'] : []); // action create
    },

    /**
     * This method is invoked right before an action is to be executed (after all possible filters.)
     * It checks the existence of the [[migrationPath]].
     * @param {Jii.base.Action} action the action to be executed.
     * @returns {Promise} whether the action should continue to be executed.
     */
    beforeAction: function (action) {
        return this.__super(action).then(function (success) {
            if (!success) {
                return false;
            }

            var path = Jii.getAlias(this.migrationPath);
            if (!fs.existsSync(path)) {
                if (action.id !== 'create') {
                    throw new Jii.console.Exception("Migration failed. Directory specified in migrationPath doesn't exist: " + this.migrationPath);
                }
                fs.mkdirSync(path);
            }
            this.migrationPath = path;
            this._parseFields();

            var version = Jii.getVersion();
            this.stdout("Jii Migration Tool (based on Jii v" + version + ")\n\n");

            return true;
        }.bind(this));
    },

    /**
     * Upgrades the application by applying new migrations.
     * For example,
     *
     * ```
     * jii migrate     # apply all new migrations
     * jii migrate 3   # apply the first 3 new migrations
     * ```
     *
     * @param {number} limit the number of new migrations to be applied. If 0, it means
     * applying all available new migrations.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionUp: function (context) {
        var limit = context.request.get(0, 0);
        return this._actionUpInternal(limit);
    },

    _actionUpInternal: function (limit) {
        return this._getNewMigrations().then(function(migrations) {
            if (migrations.length === 0) {
                this.stdout("No new migration found. Your system is up-to-date.\n", Jii.helpers.Console.FG_GREEN);

                return this.__static.EXIT_CODE_NORMAL;
            }

            var total = migrations.length;
            limit = parseInt(limit, 0);
            if (limit > 0) {
                migrations = migrations.splice(0, limit);
            }

            var n = migrations.length;
            if (n === total) {
                this.stdout("Total " + n + " new " + (n === 1 ? 'migration' : 'migrations') + " to be applied:\n", Jii.helpers.Console.FG_YELLOW);
            } else {
                this.stdout("Total " + n + " out of " + total + " new " + (total === 1 ? 'migration' : 'migrations') + " to be applied:\n", Jii.helpers.Console.FG_YELLOW);
            }

            Jii._.each(migrations, function (migration) {
                this.stdout("\t" + migration + "\n");
            }.bind(this));
            this.stdout("\n");

            var applied = 0;
            return this.confirm('Apply the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(function(bool) {
                if (!bool) {
                    return this.__static.EXIT_CODE_ERROR;
                }

                var migrateQueueFn = function(migrations, i) {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateUp(migration).then(function(success) {
                            if (!success) {
                                this.stdout("\n" + applied + " from " + n + " " + (applied === 1 ? 'migration was' : 'migrations were') + " applied.\n", Jii.helpers.Console.FG_RED);
                                this.stdout("\nMigration failed. The rest of the migrations are canceled.\n", Jii.helpers.Console.FG_RED);

                                return this.__static.EXIT_CODE_ERROR;
                            }

                            applied++;
                            return migrateQueueFn(migrations, i + 1);
                        }.bind(this));
                    } else {
                        this.stdout("\n" + n + " " + (n === 1 ? 'migration was' : 'migrations were') + " applied.\n", Jii.helpers.Console.FG_GREEN);
                        this.stdout("\nMigrated up successfully.\n", Jii.helpers.Console.FG_GREEN);

                        return Promise.resolve()
                    }
                }.bind(this);
                return migrateQueueFn(migrations, 0);
            }.bind(this));
        }.bind(this));
    },

    /**
     * Downgrades the application by reverting old migrations.
     * For example,
     *
     * ```
     * jii migrate/down     # revert the last migration
     * jii migrate/down 3   # revert the last 3 migrations
     * jii migrate/down all # revert all migrations
     * ```
     *
     * @param {number} limit the number of migrations to be reverted. Defaults to 1,
     * meaning the last applied migration will be reverted.
     * @throws Exception if the number of the steps specified is less than 1.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionDown: function (context) {
        var limit = context.request.get(0, 1);
        return this._actionDownInternal(limit);
    },

    _actionDownInternal: function (limit) {
        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Jii.console.Exception('The step argument must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(function (migrations) {
            if (Jii._.isEmpty(migrations)) {
                this.stdout("No migration has been done before.\n", Jii.helpers.Console.FG_YELLOW);

                return this.__static.EXIT_CODE_NORMAL;
            }

            migrations = Jii._.keys(migrations);

            var n = migrations.length;
            this.stdout("Total " + n + " " + (n === 1 ? 'migration' : 'migrations') + " to be reverted:\n", Jii.helpers.Console.FG_YELLOW);
            Jii._.each(migrations, function (migration) {
                this.stdout("\t" + migration + "\n");
            }.bind(this));
            this.stdout("\n");

            var reverted = 0;
            return this.confirm('Revert the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(function(bool) {
                if (!bool) {
                    return this.__static.EXIT_CODE_ERROR;
                }

                var migrateQueueFn = function(migrations, i) {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateDown(migration).then(function(success) {
                            if (!success) {
                                this.stdout("\n" + reverted + " from " + n + " " + (reverted === 1 ? 'migration was' : 'migrations were') + " reverted.\n", Jii.helpers.Console.FG_RED);
                                this.stdout("\nMigration failed. The rest of the migrations are canceled.\n", Jii.helpers.Console.FG_RED);

                                return this.__static.EXIT_CODE_ERROR;
                            }

                            reverted++;
                            return migrateQueueFn(migrations, i + 1);
                        }.bind(this));
                    } else {
                        this.stdout("\n" + n + " " + (n === 1 ? 'migration was' : 'migrations were') + " reverted.\n", Jii.helpers.Console.FG_GREEN);
                        this.stdout("\nMigrated down successfully.\n", Jii.helpers.Console.FG_GREEN);

                        return Promise.resolve()
                    }
                }.bind(this);
                return migrateQueueFn(migrations, 0);
            }.bind(this));
        }.bind(this));
    },

    /**
     * Redoes the last few migrations.
     *
     * This command will first revert the specified migrations, and then apply
     * them again. For example,
     *
     * ```
     * jii migrate/redo     # redo the last applied migration
     * jii migrate/redo 3   # redo the last 3 applied migrations
     * jii migrate/redo all # redo all migrations
     * ```
     *
     * @param {number} limit the number of migrations to be redone. Defaults to 1,
     * meaning the last applied migration will be redone.
     * @throws Exception if the number of the steps specified is less than 1.
     *
     * @returns {number} the status of the action execution. 0 means normal, other values mean abnormal.
     */
    actionRedo: function (context) {
        var limit = context.request.get(0, 1);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Jii.console.Exception('The step argument must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(function (migrations) {
            if (Jii._.isEmpty(migrations)) {
                this.stdout("No migration has been done before.\n", Jii.helpers.Console.FG_YELLOW);

                return this.__static.EXIT_CODE_NORMAL;
            }

            migrations = Jii._.keys(migrations);

            var n = migrations.length;
            this.stdout("Total " + n + " " + (n === 1 ? 'migration' : 'migrations') + " to be redone:\n", Jii.helpers.Console.FG_YELLOW);
            Jii._.each(migrations, function (migration) {
                this.stdout("\t" + migration + "\n");
            }.bind(this));
            this.stdout("\n");

            return this.confirm('Redo the above ' + (n === 1 ? 'migration' : 'migrations') + '?').then(function(bool) {
                if (!bool) {
                    return this.__static.EXIT_CODE_ERROR;
                }

                var migrateDownQueueFn = function(migrations, i) {
                    var migration = migrations[i];
                    if (migration) {
                        return this._migrateDown(migration).then(function(success) {
                            if (!success) {
                                this.stdout("\nMigration failed. The rest of the migrations are canceled.\n", Jii.helpers.Console.FG_RED);
                                return this.__static.EXIT_CODE_ERROR;
                            }

                            return migrateDownQueueFn(migrations, i + 1);
                        }.bind(this));
                    }
                    return Promise.resolve()
                }.bind(this);

                return migrateDownQueueFn(migrations, 0).then(function() {
                    migrations.reverse();

                    var migrateUpQueueFn = function(migrations, i) {
                        var migration = migrations[i];
                        if (migration) {
                            return this._migrateUp(migration).then(function(success) {
                                if (!success) {
                                    this.stdout("\nMigration failed. The rest of the migrations migrations are canceled.\n", Jii.helpers.Console.FG_RED);

                                    return this.__static.EXIT_CODE_ERROR;
                                }

                                return migrateUpQueueFn(migrations, i + 1);
                            }.bind(this));
                        } else {
                            this.stdout("\n" + n + " " + (n === 1 ? 'migration was' : 'migrations were') + " redone.\n", Jii.helpers.Console.FG_GREEN);
                            this.stdout("\nMigration redone successfully.\n", Jii.helpers.Console.FG_GREEN);

                            return Promise.resolve()
                        }
                    }.bind(this);
                    return migrateUpQueueFn(migrations, 0);
                });
            }.bind(this));
        }.bind(this));
    },

    /**
     * Upgrades or downgrades till the specified version.
     *
     * Can also downgrade versions to the certain apply time in the past by providing
     * a UNIX timestamp or a string parseable by the strtotime() function. This means
     * that all the versions applied after the specified certain time would be reverted.
     *
     * This command will first revert the specified migrations, and then apply
     * them again. For example,
     *
     * ```
     * jii migrate/to 101129_185401                      # using timestamp
     * jii migrate/to m101129_185401_create_user_table   # using full name
     * jii migrate/to 1392853618                         # using UNIX timestamp
     * jii migrate/to "2014-02-15 13:00:50"              # using strtotime() parseable string
     * ```
     *
     * @param {string} version either the version name or the certain time value in the past
     * that the application should be migrated to. This can be either the timestamp,
     * the full name of the migration, the UNIX timestamp, or the parseable datetime
     * string.
     * @throws Exception if the version argument is invalid.
     */
    actionTo: function (context) {
        var version = context.request.get(0);
        var matches = /^m?(\d{6}_\d{6})(_.*?)?/.exec(version);
        if (matches) {
            return this._migrateToVersion('m' + matches[1]);
        }

        if (Number(version) == version) {
            return this._migrateToTime(version);
        }

        var time = (new Date(version)).getTime();
        if (time) {
            return this._migrateToTime(time);
        }

        throw new Jii.console.Exception("The version argument must be either a timestamp (e.g. 101129_185401),\n the full name of a migration (e.g. m101129_185401_create_user_table),\n a UNIX timestamp (e.g. 1392853000), or a datetime string parseable\nby the strtotime() function (e.g. 2014-02-15 13:00:50).");
    },

    /**
     * Modifies the migration history to the specified version.
     *
     * No actual migration will be performed.
     *
     * ```
     * jii migrate/mark 101129_185401                      # using timestamp
     * jii migrate/mark m101129_185401_create_user_table   # using full name
     * ```
     *
     * @param {string} version the version at which the migration history should be marked.
     * This can be either the timestamp or the full name of the migration.
     * @returns {Promise}
     * @throws Exception if the version argument is invalid or the version cannot be found.
     */
    actionMark: function (context) {
        var version = context.request.get(0);
        var originalVersion = version;
        var matches = /^m?(\d{6}_\d{6})(_.*?)?/.exec(version);
        if (matches) {
            version = 'm' + matches[1];
        } else {
            throw new Jii.console.Exception("The version argument must be either a timestamp (e.g. 101129_185401)\nor the full name of a migration (e.g. m101129_185401_create_user_table).");
        }

        // try mark up
        return this._getNewMigrations().then(function (migrations) {
            for (var i = 0, l = migrations.length; i < l; i++) {
                var migration = migrations[i];
                if (migration.indexOf(version + '_') === 0) {
                    return this.confirm("Set migration history at " + originalVersion + "?").then(function(bool) {
                        if (!bool) {
                            return this.__static.EXIT_CODE_NORMAL;
                        }

                        var promises = [];
                        for (var j = 0; j <= i; ++j) {
                            promises.push(this._addMigrationHistory(migrations[j]));
                        }

                        return Promise.all(promises).then(function() {
                            this.stdout("The migration history is set at " + originalVersion + ".\nNo actual migration was performed.\n", Jii.helpers.Console.FG_GREEN);
                            return this.__static.EXIT_CODE_NORMAL;
                        }.bind(this));
                    });
                }
            }

            // try mark down
            return this._getMigrationHistory(null).then(function(migrations) {
                for (var key in migrations) {
                    if (migrations.hasOwnProperty(key)) {
                        var migration = migrations[key];
                        if (migration.indexOf(version + '_') === 0) {
                            if (i === 0) {
                                this.stdout("Already at '" + originalVersion + "'. Nothing needs to be done.\n", Jii.helpers.Console.FG_YELLOW);
                            } else {
                                return this.confirm("Set migration history at " + originalVersion + "?").then(function(bool) {
                                    if (!bool) {
                                        return this.__static.EXIT_CODE_NORMAL;
                                    }

                                    var promises = [];
                                    for (var j = 0; j < i; ++j) {
                                        promises.push(this._removeMigrationHistory(migrations[j]));
                                    }

                                    return Promise.all(promises).then(function() {
                                        this.stdout("The migration history is set at " + originalVersion + ".\nNo actual migration was performed.\n", Jii.helpers.Console.FG_GREEN);
                                        return this.__static.EXIT_CODE_NORMAL;
                                    }.bind(this));
                                }.bind(this));
                            }
                        }
                    }
                }
            }.bind(this));
        }.bind(this)).then(function (result) {
            if (result !== this.__static.EXIT_CODE_NORMAL) {
                throw new Jii.console.Exception("Unable to find the version '" + originalVersion + "'.");
            }
        }.bind(this));
    },

    /**
     * Displays the migration history.
     *
     * This command will show the list of migrations that have been applied
     * so far. For example,
     *
     * ```
     * jii migrate/history     # showing the last 10 migrations
     * jii migrate/history 5   # showing the last 5 migrations
     * jii migrate/history all # showing the whole history
     * ```
     *
     * @param {number} limit the maximum number of migrations to be displayed.
     * If it is "all", the whole migration history will be displayed.
     */
    actionHistory: function (context) {
        var limit = context.request.get(0, 10);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Jii.console.Exception('The limit must be greater than 0.');
            }
        }

        return this._getMigrationHistory(limit).then(function(migrations) {
            if (Jii._.isEmpty(migrations)) {
                this.stdout("No migration has been done before.\n", Jii.helpers.Console.FG_YELLOW);
                return this.__static.EXIT_CODE_NORMAL;
            }

            var n = Jii._.size(migrations);
            if (limit > 0) {
                this.stdout("Showing the last " + n + " applied " + (n === 1 ? 'migration' : 'migrations') + ":\n", Jii.helpers.Console.FG_YELLOW);
            } else {
                this.stdout("Total " + n + " " + (n === 1 ? 'migration has' : 'migrations have') + " been applied before:\n", Jii.helpers.Console.FG_YELLOW);
            }
            Jii._.each(migrations, function (time, version) {
                this.stdout("\t(" + (new Date(time * 1000).toString()) + ') ' + version + "\n");
            }.bind(this));
        }.bind(this));
    },

    /**
     * Displays the un-applied new migrations.
     *
     * This command will show the new migrations that have not been applied.
     * For example,
     *
     * ```
     * jii migrate/new     # showing the first 10 new migrations
     * jii migrate/new 5   # showing the first 5 new migrations
     * jii migrate/new all # showing all new migrations
     * ```
     *
     * @param {number} limit the maximum number of new migrations to be displayed.
     * If it is `all`, all available new migrations will be displayed.
     * @throws \jii\console\Exception if invalid limit value passed
     */
    actionNew: function (context) {
        var limit = context.request.get(0, 10);

        if (limit === 'all') {
            limit = null;
        } else {
            limit = parseInt(limit);
            if (limit < 1) {
                throw new Jii.console.Exception('The limit must be greater than 0.');
            }
        }

        return this._getNewMigrations().then(function(migrations) {
            if (migrations.length === 0) {
                this.stdout("No new migrations found. Your system is up-to-date.\n", Jii.helpers.Console.FG_GREEN);
                return this.__static.EXIT_CODE_NORMAL;
            }

            var n = migrations.length;
            if (limit && n > limit) {
                migrations = migrations.slice(0, limit);
                this.stdout("Showing " + limit + " out of " + n + " new " + (n === 1 ? 'migration' : 'migrations') + ":\n", Jii.helpers.Console.FG_YELLOW);
            } else {
                this.stdout("Found " + n + " new " + (n === 1 ? 'migration' : 'migrations') + ":\n", Jii.helpers.Console.FG_YELLOW);
            }

            Jii._.each(migrations, function (migration) {
                this.stdout("\t" + migration + "\n");
            }.bind(this));
        }.bind(this));
    },

    /**
     * Creates a new migration.
     *
     * This command creates a new migration using the available migration template.
     * After using this command, developers should modify the created migration
     * skeleton by filling up the actual migration logic.
     *
     * ```
     * jii migrate/create create_user_table
     * ```
     *
     * @param {string} name the name of the new migration. This should only contain
     * letters, digits and/or underscores.
     * @throws Exception if the name argument is invalid.
     */
    actionCreate: function (context) {
        var name = context.request.get(0);
        if (!name || !name.match(/^\w+/)) {
            throw new Jii.console.Exception('The migration name should contain letters, digits and/or underscore characters only.');
        }

        var generateClassTime = function () {
            var t = new Date();
            return [
                t.getFullYear().toString().substr(2),
                (t.getMonth() < 10 ? '0' : '') + t.getMonth().toString(),
                (t.getDate() < 10 ? '0' : '') + t.getDate().toString(),
                '_',
                (t.getHours() < 10 ? '0' : '') + t.getHours().toString(),
                (t.getMinutes() < 10 ? '0' : '') + t.getMinutes().toString(),
                (t.getSeconds() < 10 ? '0' : '') + t.getSeconds().toString()
            ].join('');
        }

        var className = 'm' + generateClassTime() + '_' + name;
        var fullClassName = this.migrationNamespace + '.' + className;
        var file = this.migrationPath + '/' + className + '.js';

        return this.confirm("Create new migration '" + file + "'?").then(function(bool) {
            if (!bool) {
                return this.__static.EXIT_CODE_NORMAL;
            }

            var matches;
            var content = null;

            // @todo Generator templates
            /*matches = /^create_junction_(.+)_and_(.+)/.exec(name);
            if (!content && matches) {
                var firstTable = matches[1].toLowerCase();
                var secondTable = matches[2].toLowerCase();
                content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['create_junction']), {
                    className: className,
                    table: firstTable + '_' + secondTable,
                    field_first: firstTable,
                    field_second: secondTable
                });
            }

            matches = /^add_(.+)_to_(.+)/.exec(name);
            if (!content && matches) {
                content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['add_column']), {
                    className: className,
                    table: matches[2].toLowerCase(),
                    fields: this.fields
                });
            }

            matches = /^drop_(.+)_from_(.+)/.exec(name);
            if (!content && matches) {
                content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['drop_column']), {
                    className: className,
                    table: matches[2].toLowerCase(),
                    fields: this.fields
                });
            }

            matches = /^create_(.+)/.exec(name);
            if (!content && matches) {
                this._addDefaultPrimaryKey();
                content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['create_table']), {
                    className: className,
                    table: matches[1].toLowerCase(),
                    fields: this.fields
                });
            }

            matches = /^drop_(.+)/.exec(name);
            if (!content && matches) {
                this.addDefaultPrimaryKey();
                content = this.renderFile(Jii.getAlias(this.generatorTemplateFiles['drop_table']), {
                    className: className,
                    table: matches[1].toLowerCase(),
                    fields: this.fields
                });
            }*/

            if (!content) {
                // @todo renderFile
                content = Jii._.template(fs.readFileSync(Jii.getAlias(this.templateFile)).toString())({className: fullClassName});
            }

            fs.writeFileSync(file, content);
            this.stdout("New migration created successfully.\n", Jii.helpers.Console.FG_GREEN);
        }.bind(this));
    },

    /**
     * Upgrades with the specified migration class.
     * @param {string} className the migration class name
     * @returns {Promise}
     */
    _migrateUp: function (className) {
        if (className === this.__static.BASE_MIGRATION) {
            return Promise.resolve(true);
        }

        this.stdout("*** applying " + className + "\n", Jii.helpers.Console.FG_YELLOW);
        var start = (new Date()).getTime();
        var time;

        var migration = this._createMigration(className);
        return Promise.resolve().then(function() {
            return migration.up();
        }).then(function(isSuccess) {
            if (isSuccess !== false) {
                return this._addMigrationHistory(className).then(function() {
                    time = (new Date()).getTime() - start;
                    this.stdout("*** applied " + className + " (time: " + (time / 1000) + "s)\n\n", Jii.helpers.Console.FG_GREEN);

                    return true;
                }.bind(this));
            } else {
                time = (new Date()).getTime() - start;
                this.stdout("*** failed to apply " + className + " (time: " + (time / 1000) + "s)\n\n", Jii.helpers.Console.FG_RED);

                return false;
            }
        }.bind(this));
    },

    /**
     * Downgrades with the specified migration class.
     * @param {string} className the migration class name
     * @returns {Promise} whether the migration is successful
     */
    _migrateDown: function (className) {
        if (className === this.__static.BASE_MIGRATION) {
            return Promise.resolve(true);
        }

        this.stdout("*** reverting " + className + "\n", Jii.helpers.Console.FG_YELLOW);
        var start = (new Date()).getTime();
        var time;

        var migration = this._createMigration(className);
        return Promise.resolve().then(function() {
            return migration.down();
        }).then(function(isSuccess) {
            if (isSuccess !== false) {
                return this._removeMigrationHistory(className).then(function() {
                    time = (new Date()).getTime() - start;
                    this.stdout("*** reverted " + className + " (time: " + (time / 1000) + "s)\n\n", Jii.helpers.Console.FG_GREEN);

                    return true;
                }.bind(this));
            } else {
                time = (new Date()).getTime() - start;
                this.stdout("*** failed to revert " + className + " (time: " + (time / 1000) + "s)\n\n", Jii.helpers.Console.FG_RED);

                return false;
            }
        }.bind(this))
    },

    /**
     * Creates a new migration instance.
     * @param {string} className the migration class name
     * @returns {object} the migration instance
     */
    _createMigration: function (className) {
        var file = this.migrationPath + '/' + className + '.js';
        require(file);

        var classFn = Jii.namespace(this.migrationNamespace + '.' + className);
        return new classFn();
    },

    /**
     * Migrates to the specified apply time in the past.
     * @param {number} time
     */
    _migrateToTime: function (time) {
        var count = 0;

        return this._getMigrationHistory(null).then(function(migrations) {
            migrations = Jii._.values(migrations);

            while (count < migrations.length && migrations[count] > time) {
                ++count;
            }

            if (count === 0) {
                this.stdout("Nothing needs to be done.\n", Jii.helpers.Console.FG_GREEN);
            } else {
                return this._actionDownInternal(count);
            }
        });

    },

    /**
     * Migrates to the certain version.
     * @param {string} version name in the full format.
     * @returns {number} CLI exit code
     * @throws Exception if the provided version cannot be found.
     */
    _migrateToVersion: function (version) {
        var originalVersion = version;

        // try migrate up
        return this._getNewMigrations().then(function(migrations) {
            for (var i = 0, l = migrations.length; i < l; i++) {
                var migration = migrations[i];
                if (migration.indexOf(version + '_') === 0) {
                    return this._actionUpInternal(i + 1);
                }
            }

            // try migrate down
            return this._getMigrationHistory(null).then(function(migrations) {
                migrations = Jii._.keys(migrations);

                for (var i = 0, l = migrations.length; i < l; i++) {
                    var migration = migrations[i];
                    if (migration.indexOf(version + '_') === 0) {
                        if (i === 0) {
                            this.stdout("Already at '" + originalVersion + "'. Nothing needs to be done.\n", Jii.helpers.Console.FG_YELLOW);
                        } else {
                            return this._actionDownInternal(i);
                        }

                        return this.__static.EXIT_CODE_NORMAL;
                    }
                }

                throw new Jii.console.Exception("Unable to find the version 'originalVersion'.");
            }.bind(this));
        }.bind(this));
    },

    /**
     * Returns the migrations that are not applied.
     * @returns {Promise} list of new migrations
     */
    _getNewMigrations: function () {
        return this._getMigrationHistory(null).then(function(migrations) {
            var applied = {};
            Jii._.each(migrations, function (time, version) {
                applied[version.substr(1, 13)] = true;
            }.bind(this));

            var names = [];
            var files = fs.readdirSync(this.migrationPath);

            Jii._.each(files, function (file) {
                if (file.substr(0, 1) === '.') {
                    return;
                }

                var matches = /^(m(\d{6}_\d{6})_.*?)\.js/.exec(file);
                if (matches && !applied[matches[2]]) {
                    names.push(matches[1]);
                }
            }.bind(this));

            names.sort();

            return names;
        }.bind(this));

    },

    /**
     * Parse the command line migration fields
     * @since 2.0.7
     */
    _parseFields: function () {
        Jii._.each(this.fields, function (field, index) {
            var chunks = field.split(/\s?:\s?/);
            var property = chunks.shift();

            Jii._.each(chunks, function (chunk, i) {
                if (!chunk.match(/^(.+?)\(([^)]+)\)/)) {
                    chunks[i] += '()';
                }
            });
            this.fields[index] = {
                property: property,
                decorators: chunks.join('.')
            };
        }.bind(this));
    },

    /**
     * Adds default primary key to fields list if there's no primary key specified
     * @since 2.0.7
     */
    _addDefaultPrimaryKey: function () {
        var isFined = false;
        Jii._.each(this.fields, function (field) {
            if (field['decorators'] === 'primaryKey()') {
                isFined = true;
            }
        }.bind(this));

        if (!isFined) {
            this.fields.unshift({
                property: 'id',
                decorators: 'primaryKey()'
            });
        }
    },

    /**
     * Returns the migration history.
     * @param {number} limit the maximum number of records in the history to be returned. `null` for "no limit".
     * @returns {[]} the migration history
     */
    _getMigrationHistory: function (limit) {
        return new Promise();
    },

    /**
     * Adds new migration entry to the history.
     * @param {string} version migration version name.
     */
    _addMigrationHistory: function (version) {
        return new Promise();
    },

    /**
     * Removes existing migration from the history.
     * @param {string} version migration version name.
     */
    _removeMigrationHistory: function (version) {
        return new Promise();
    }

});