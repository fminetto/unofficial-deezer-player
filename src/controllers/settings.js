const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const filename = "preferences.json";

const defaults = {
    closeToTray: 'true',
    optimizeApp: 'false'
}

class Settings {
    constructor() {
        this.preferencesFile = path.join(app.getPath('userData'), filename);
        this.callbacks = {};

        // Try to load user's preferences
        this.load();
    }

    save() {
        let json = JSON.stringify(this.preferences);

        fs.writeFile(this.preferencesFile, json, 'utf-8', (err) => {
            if (err) {
                console.error(err)
                return;
            }

            // Preferences were successfully saved
        });
    }

    load() {
        // In case we can't create a new file and can't change any of the settings
        // user will be forced to use default settings
        this.preferences = defaults;

        fs.access(this.preferencesFile, (err) => {
            if (err) {
                // Either file is inaccessible or doesn't exist
                return
            }
            fs.readFile(this.preferencesFile, 'utf-8', (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }

                try {
                    this.preferences = JSON.parse(data);
                } catch (jsonError) {
                    console.error(jsonError);
                }
            });

        });
    }

    /**
     * Sets preference key and launches callback if any is set
     * @param {*} key 
     * @param {*} value 
     */
    setAttribute(key, value) {
        this.preferences[key] = value;
        this.save();
        if (key in this.callbacks) {
            this.callbacks[key]();
        }
    }

    getAttribute(key) {
        return this.preferences[key];
    }

    setCallback(key, callback) {
        this.callbacks[key] = callback;
    }
}

module.exports = Settings;