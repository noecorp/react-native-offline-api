# Using your own driver for caching

This wrapper has been written with the goal of **being storage-agnostic**. This means that by default, it will make use of react-native's `AsyncStorage` API, but feel free to write your own driver and use anything you want, like the amazing [realm](https://github.com/realm/realm-js).

Your custom driver must implement these 3 methods that are promises.

* `getItem(key: string): Promise<any>;`
* `setItem(key: string, value: string): Promise<void>;`
* `removeItem(key: string): Promise<void>;`
* `multiRemove(keys: string[]): Promise<void>;`

## SQLite Driver

As of `2.2.0`, an SQLite driver is baked-in with the module. Install SQLite in your project by [following these instructions](https://github.com/andpor/react-native-sqlite-storage) and set it as your custom driver like this :

```javascript
import OfflineFirstAPI, { drivers } from 'react-native-offline-api';
import SQLite from 'react-native-sqlite-storage';

// ...

const api = new OfflineFirstAPI(API_OPTIONS, API_SERVICES);

drivers.sqliteDriver(SQLite, { debug: false }).then((driver) => {
    api.setCacheDriver(driver);
});
```