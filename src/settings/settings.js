const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const filename = "preferences.json";

// Defaults
const defaults = {
    closeToTray: 'true'
}

class Settings {
    constructor() {
        this.preferences_file = path.join(app.getPath('userData'), filename);

        // Try to load user's preferences
        this.load();
    }

    save() {
        let json = JSON.stringify(this.preferences);

        fs.writeFile(this.preferences_file, json, 'utf-8', (err) => {
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

        fs.access(this.preferences_file, (err) => {
            if (err) {
                // Either file is inaccessible or doesn't exist
                return
            }
            fs.readFile(this.preferences_file, 'utf-8', (err, data) => {
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

    set_attribute(key, value) {
        this.preferences[key] = value;
        this.save();
    }

    get_attribute(key) {
        return this.preferences[key];
    }
}

module.exports = { Settings };