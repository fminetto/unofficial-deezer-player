const electron = require('electron');
const path = require('path');
const fs = require('fs');

/**
 *  Wrapper that reads files if it's first time accessing them,
 *  otherwise stores them in dictionary and returns the contents on demand
 *  */
class LazyReader {
    constructor() {
        let files = {}
    }

    get(file, callback, ...args) {
        if (file in files) {
            return this.files[file];
        }
        this.loadFile(file);
        this.asyncLoading(file, callback, args);
    }

    asyncLoading(file, callback, ...args) {
        if (file in this.files) {
            callback(args);
        } else {
            setTimeout(this.asyncLoading(file, 100));
        }
    }

    loadFile(file) {
        fs.readFile(path.join(__dirname, file), 'utf-8', (err, data) => {
        if (err) {
            console.error("An error while trying to read a file occured ", err);
            return;
        }

        this.files[file] = data;
    });
    }
}