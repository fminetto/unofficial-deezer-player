const path = require('path'),
    { BrowserWindow, dialog } = require('electron');
class Window extends BrowserWindow {
    constructor(app, url, { width, height }, settings) {
        let params = {
            width,
            height,
            title: "Deezer Player",
            icon: path.join(__dirname, '..', 'assets', 'dist_icon.png'),
            webPreferences: {
                nodeIntegration: true,
                nativeWindowOpen: true,
                //devTools: false,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), "settings", "injection.js")
            },
            backgroundColor: '#2e2c29',
            show: false
        };
        super(params);
        this.setMenuBarVisibility(false);
        this.loadURL(url || "https://deezer.com", { userAgent: process.env.userAgent });
        this._app = app;
        this._settings = settings;
        this.createEvents();
    }

    createEvents() {
        this.webContents.on('did-fail-load', (e, errCode, errMessage) => {
            //On some systems, this error occurs without explanation
            if (errCode == -3)
                return false;
            console.error(errCode, errMessage);
            dialog.showErrorBox("Load failed", `Please check your connection`);
            this.destroy()
            this._app.quit(-1);
        })
        this.on('ready-to-show', () => {
            this.show();
        })
        this.on("close", event => {
            if (this._settings.get_attribute("closeToTray") == "true") {
                event.preventDefault();
                this.hide();
                return false;
            } else {
                this.webContents.send("quit");
            }
        })
    }
}

module.exports = { Window };