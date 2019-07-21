const path = require('path'),
    Datastore = require('nedb'),
    { Window } = require('./utils/window'),
    consvol = 0.10,
    electron = require('electron'),
    { app, Menu, Tray, globalShortcut } = electron,
    trayicon = path.join(__dirname, 'assets', 'dist_icon.png');

let cfgId, url, win, tray, db = new Datastore({ filename: `${app.getPath('userData')}/deezer.db`, autoload: true });

async function createWin() {
    db.findOne({}, (err, data) => {
        err && console.warn(err.message)
        if (data) {
            url = data.loadURL
            cfgId = data._id
            if(url.indexOf("deezer.com") < 0) url = undefined
        }
        tray = new Tray(trayicon)
        win = new Window(app, url, electron.screen.getPrimaryDisplay().workAreaSize);
        register_mediaKeys();
        update_tray();
    })
}

function register_mediaKeys() {
    if (!globalShortcut.isRegistered("medianexttrack"))
        globalShortcut.register('medianexttrack', () => {
            win.webContents.executeJavaScript("dzPlayer.control.nextSong()");
        });
    if (!globalShortcut.isRegistered("mediaplaypause"))
        globalShortcut.register('mediaplaypause', () => {
            win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
        });
    if (!globalShortcut.isRegistered("mediaprevioustrack"))
        globalShortcut.register('mediaprevioustrack', () => {
            win.webContents.executeJavaScript("dzPlayer.control.prevSong()");
        });
}

function update_tray() {
    let model = [{
        label: "Controls",
        enabled: false
    }, {
        label: "Play/Pause",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
        }
    }, {
        label: "Next",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript("dzPlayer.control.nextSong()");
        }
    }, {
        label: "Previous",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript("dzPlayer.control.prevSong()");
        }
    }, {
        label: "Unfavourite/Favourite",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript("document.querySelectorAll('.player-bottom .track-actions button')[2].click();");
        }
    }, {
        label: "Volume",
        enabled: false
    }, {
        label: "Volume UP",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript(`vol = dzPlayer.volume; vol += ${consvol}; vol > 1 && (vol = 1); dzPlayer.control.setVolume(vol);`)
        }
    }, {
        label: "Volume Down",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript(`vol = dzPlayer.volume; vol -= ${consvol}; vol < 0 && (vol = 0); dzPlayer.control.setVolume(vol);`)
        }
    }, {
        label: "Volume Mute",
        enabled: true,
        click: () => {
            win.webContents.executeJavaScript("dzPlayer.control.mute(!dzPlayer.muted)")
        }
    }, {
        label: "APP",
        enabled: false
    }, {
        label: "Show Window",
        enabled: true,
        click: () => {
            if (!win.isVisible())
                win.restore();
        }
    }, {
        label: "Quit",
        enabled: true,
        click: () => {
            saveData();
            win.destroy()
            app.quit()
        }
    }];
    tray.on("click", () => {
        if (!win.isVisible())
            win.restore();
    })
    tray.setContextMenu(new Menu.buildFromTemplate(model))
}

app.on('ready', createWin)
app.on('browser-window-created', (e, window) => {
    window.setMenuBarVisibility(false);
})

async function saveData() {
    if (cfgId) {
        await db.update({
            _id: cfgId
        }, {
                $set: {
                    loadURL: win.webContents.getURL()
                }
            })
    } else {
        await db.insert({ loadURL: win.webContents.getURL() })
    }
}