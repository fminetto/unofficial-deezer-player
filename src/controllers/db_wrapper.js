const Datastore = require('nedb');
const { app } = require('electron');

class DbWrapper {
    constructor() {
        this.db = new Datastore({ filename: `${app.getPath('userData')}/deezer.db`, autoload: true });
        this.win = null;
        this.cfgId = null;
        this.url = null;
    }

    setWindow(win) {
        this.win = win;
    }

    async saveData() {
        if (this.cfgId) {
            await this.db.update({
                _id: this.cfgId
            }, {
                $set: {
                    loadURL: this.win.webContents.getURL()
                }
            })
        } else {
            await this.db.insert({ loadURL: this.win.webContents.getURL() })
        }
    }

    setData(data) {
        if (data) {
            this.url = data.loadURL
            this.cfgId = data._id
            if (this.url.indexOf("deezer.com") < 0) this.url = undefined
        }
    }
}

module.exports = DbWrapper;
