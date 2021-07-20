const path = require('path');
const { BrowserWindow, dialog } = require('electron');
const LazyReader = require('./lazy_reader');

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
                // devTools: false,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), "settings", "injection.js")
            },
            backgroundColor: '#2e2c29',
            show: false
        };
        super(params);
        this.setMenuBarVisibility(false);
        this.loadURL(url || "https://deezer.com", { userAgent: process.env.userAgent });
        this.app = app;
        this.settings = settings;
        this.createEvents();
        
        this.setOptimize();
        this.settings.setCallback("optimizeApp", () => {
            this.setOptimize();
        });
    }

    createEvents() {
        this.webContents.on('did-fail-load', (e, errCode, errMessage) => {
            //On some systems, this error occurs without explanation
            if (errCode == -3)
                return false;
            console.error(errCode, errMessage);
            dialog.showErrorBox("Load failed", `Please check your connection`);
            this.destroy()
            this.app.quit(-1);
        })
        this.on('ready-to-show', () => {
            this.show();
        })
        this.on("close", event => {
            if (this.settings.getAttribute("closeToTray") == "true") {
                event.preventDefault();
                this.hide();
                return false;
            } else {
                this.webContents.send("quit");
            }
        })
    }

    setOptimize() {
        if (this.settings.getAttribute("optimizeApp") == 'true') {
            this.addListener("blur", this.blurWindow);
            this.addListener("focus", this.focusWindow);
        } else {
            this.removeListener("blur", this.blurWindow);
            this.removeListener("focus", this.focusWindow);
            if (this.blur) {
                this.focusWindow();
            }
        }
    }

    blurWindow() {
        LazyReader.get(path.join("..", "optimization", "blur.js"), (data) => {
            this.webContents.executeJavaScript(data);
        });
    }

    focusWindow() {
        LazyReader.get(path.join("..", "optimization", "focus.js"), (data) => {
            this.webContents.executeJavaScript(data);
        });
    }
}

module.exports = Window;