const path = require('path');
const { BrowserWindow, dialog } = require('electron');
const LazyReader = require('./lazy_reader');

class Window extends BrowserWindow {
    constructor(app, parent, { width, height }) {
        let params = {
            width,
            height,
            title: "Deezer Player",
            icon: path.join(__dirname, '..', 'assets', 'dist_icon.png'),
            webPreferences: {
                nodeIntegration: true,
                nativeWindowOpen: true,
                devTools: false,
                contextIsolation: false,
                preload: path.join(app.getAppPath(), "settings", "injection.js")
            },
            backgroundColor: '#2e2c29',
            show: false
        };
        super(params);
        this.app = app;
        this.parent = parent;
        this.setMenuBarVisibility(false);
        this.loadURL(this.parent.dbWrapper.url || "https://deezer.com", { userAgent: process.env.userAgent });   
        this.createEvents();
        
        this.checkOptimize();
        this.parent.settings.setCallback("optimizeApp", () => {
            this.checkOptimize();
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
            if (this.parent.settings.getAttribute("closeToTray") == "true") {
                event.preventDefault();
                this.hide();
                return false;
            } else {
                this.parent.dbWrapper.saveData();
                this.destroy();
                this.app.quit();
            }
        })
    }

    checkOptimize() {
        if (this.parent.settings.getAttribute("optimizeApp") == 'true') {
            this.addListener("blur", this.blurWindow);
            this.addListener("focus", this.focusWindow);
        } else {
            this.removeListener("blur", this.blurWindow);
            this.removeListener("focus", this.focusWindow);
            if (this.blur) {
                this.focusWindow();
            }
            LazyReader.unload(path.join("..", "optimization", "blur.js"));
            LazyReader.unload(path.join("..", "optimization", "focus.js"));
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
