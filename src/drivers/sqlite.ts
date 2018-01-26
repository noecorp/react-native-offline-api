export interface ISQLiteBinding {
    DEBUG: (enabled: boolean) => void;
    enablePromise: (enabled: boolean) => void;
    openDatabase: (options: any) => Promise<any>;
    deleteDatabase: (dbname: string) => Promise<void>;
}

export interface ISQLiteDriverOptions {
    debug?: boolean;
    openDatabaseOptions?: { name: string; location: 'default' | 'Library' | 'Documents' };
}

interface ISQLiteDatabase {
    transaction: (callback: (tx: ITransaction) => void) => void;
}

interface ITransaction {
    executeSql: (
        query: string,
        args?: any[],
        callback?: (tx: ITransaction, results: IQueryResults) => void
    ) => Promise<[ITransaction, IQueryResults]>;
}

interface IQueryResults {
    insertId?: number;
    rows: { item: (index: number) => any; raw: (index: number) => any; length: number };
    rowsAffected: number;
}

export default async (SQLite: ISQLiteBinding, options: ISQLiteDriverOptions ) => {
    SQLite.DEBUG(options.debug || false);
    SQLite.enablePromise(true);

    try {
        const db: ISQLiteDatabase = await SQLite.openDatabase(
            {
                name: 'offlineapi.db',
                location: 'default',
                ...(options.openDatabaseOptions || {})
            }
        );

        db.transaction((tx: ITransaction) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY NOT NULL, value TEXT);');
        });

        return {
            getItem: getItem(db),
            setItem: setItem(db),
            removeItem: removeItem(db),
            multiRemove: multiRemove(db)
        };
    } catch (err) {
        throw new Error(`react-native-offline-api : Cannot open SQLite database : ${err}. Check your SQLite configuration.`);
    }
};

function getItem (db: ISQLiteDatabase) {
    return (key: string) => {
        return new Promise((resolve, reject) => {
            db.transaction((tx: ITransaction) => {
                tx.executeSql('SELECT * FROM cache WHERE id=?', [key])
                .then((res) => {
                    const results = res[1];
                    const item = results.rows.item(0);
                    return resolve(item && item.value || null);
                })
                .catch((err: Error) => {
                    return reject(err);
                });
            });
        });
    };
}

function setItem (db: ISQLiteDatabase) {
    return (key: string, value: string) => {
        return new Promise((resolve, reject) => {
            db.transaction((tx: ITransaction) => {
                tx.executeSql('INSERT OR REPLACE INTO cache VALUES (?,?)', [key, value])
                .then(() => {
                    return resolve();
                }).
                catch((err: Error) => {
                    return reject(err);
                });
            });
        });
    };
}

function removeItem (db: ISQLiteDatabase) {
    return (key: string) => {
        return new Promise((resolve, reject) => {
            db.transaction((tx: ITransaction) => {
                tx.executeSql('DELETE FROM cache WHERE id=?', [key])
                .then((res) => {
                    return resolve();
                })
                .catch((err: Error) => {
                    return reject(err);
                });
            });
        });
    };
}

function multiRemove (db) {
    return (keys: string[]) => {
        return new Promise((resolve, reject) => {
            // This implmementation is not the most efficient, must delete using
            // WHERE id IN (...,...) doesn't seem to be working at the moment.
            db.transaction((tx) => {
                let promises = [];
                keys.forEach((key) => {
                    promises.push(tx.executeSql('DELETE FROM cache WHERE id=?', [key]));
                });

                Promise.all(promises)
                .then((deleteResults) => {
                    return resolve();
                })
                .catch((err: Error) => {
                    return reject(err);
                });
            });
        });
    };
}
