const path = require('path'),
    { BrowserWindow, dialog } = require('electron');
class Window extends BrowserWindow {
    constructor(app, url, { width, height }) {
        let params = {
            width,
            height,
            title: "Deezer Player",
            icon: path.join(__dirname, '..', 'assets', 'dist_icon.png'),
            webPreferences: {
                nodeIntegration: true,
                nativeWindowOpen: true,
                devTools: false,
                contextIsolation: false
            },
            backgroundColor: '#2e2c29',
            show: false
        };
        super(params);
        this.setMenuBarVisibility(false);
        this.loadURL(url || "https://deezer.com", { userAgent: process.env.userAgent });
        this._app = app;
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
            event.preventDefault();
            this.hide();
            return false;
        })
        this.on("blur", event => {
            this.webContents.executeJavaScript(`
            var logo = document.getElementById("central_logo");
            if (!logo) {
                var list = document.querySelectorAll(".logo.logo-deezer-black");
                logo = list[0].cloneNode(true);
                logo.id = "central_logo";
                logo.style = "opacity: 0;background-repeat: no-repeat;transform: scale(0,0)";
                document.body.appendChild(logo);
            }

            document.getElementById("dzr-app").style = "display: none;";
            document.body.style = "overflow-y: hidden;display: flex;justify-content: center;align-items: center;";
            logo.style = "transition: opacity 2s ease-in, transform 3s ease-out;opacity: 1;transform: scale(1.4,1.4)";
            `);
        })
        this.on("focus", event => {
            this.webContents.executeJavaScript(`
            var logo = document.getElementById("central_logo");
            if (logo) {
                logo.style = "opacity: 0;transform: scale(0,0)";
            }
            document.getElementById("dzr-app").style = "display: block;";
            document.body.style = "overflow-y: scroll;";
            `);
        })
    }
}

module.exports = { Window };