const path = require('path'),
    consvol = 0.05,
    electron = require('electron'),
    { app, BrowserWindow, Menu, Tray, globalShortcut, dialog } = electron,
    disticon = path.join(__dirname, 'assets', 'dist_icon.png'),
    trayicon = path.join(__dirname, 'assets', 'dist_icon.png');
let win, tray, isQuit = false;
function createWin() {
    register_mediaKeys();
    let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    tray = new Tray(trayicon)
    win = new BrowserWindow({
        width: width,
        height: height,
        title: "Deezer Player",
        icon: disticon,
        webPreferences: {
            devTools: false
        },
        backgroundColor: '#2e2c29',
        show:false
    });
    win.setMenuBarVisibility(false)
    win.loadURL("https://deezer.com");
    win.webContents.on('did-fail-load', (e, errCode, errMessage)=>{
        console.error(errCode, errMessage);
        dialog.showErrorBox("Load failed", `Please check your connection`);
        isQuit = true;
        app.quit(-1);
    })
    win.on('ready-to-show', ()=>{
        win.show();
    })
    win.on("close", event => {
        if (!isQuit) {
            event.preventDefault();
            win.hide();
            return false;
        }
    })
    update_tray();
}

function register_mediaKeys() {
    globalShortcut.register('medianexttrack', () => {
        win.webContents.executeJavaScript("dzPlayer.control.nextSong()");
    });

    globalShortcut.register('mediaplaypause', () => {
        win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
    });

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
    },{
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
            win.restore();
        }
    }, {
        label: "Quit",
        enabled: true,
        click: () => {
            isQuit = true;
            app.quit()
        }
    }];
    tray.setContextMenu(new Menu.buildFromTemplate(model))
}

app.on('ready', createWin)