const path = require('path'),
    Datastore = require('nedb'),
    { Window } = require('./utils/window'),
    consvol = 0.10,
    Player = require('mpris-service'),
    electron = require('electron'),
    { app, Menu, Tray, globalShortcut, session, ipcMain } = electron,
    trayicon = path.join(__dirname, 'assets', 'dist_icon.png');
process.env.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';
app.commandLine.appendSwitch('disable-features', 'MediaSessionService');

let cfgId, url, win, tray, db = new Datastore({ filename: `${app.getPath('userData')}/deezer.db`, autoload: true });

let singleton = null
const player = Player({
    name: 'Deezer',
    identity: 'Deezer media player',
    supportedUriSchemes: [],
    supportedMimeTypes: [],
    supportedInterfaces: ['player']
})

async function createWin() {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = process.env.userAgent;
        callback({ cancel: false, requestHeaders: details.requestHeaders })
    });
    db.findOne({}, (err, data) => {
        err && console.warn(err.message)
        if (data) {
            url = data.loadURL
            cfgId = data._id
            if (url.indexOf("deezer.com") < 0) url = undefined
        }
        tray = new Tray(trayicon)
        win = new Window(app, url, electron.screen.getPrimaryDisplay().workAreaSize);
        singleton = win;
        register_mediaKeys();
        update_tray();
        init_player_mpris();
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
        label: "Hide Window",
        enabled: true,
        click: () => {
            if (win.isVisible())
                win.hide();
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
        else
            win.hide();
    })
    tray.setContextMenu(new Menu.buildFromTemplate(model))
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (singleton) {
            if (singleton.isMinimized() || !singleton.isVisible()) singleton.restore()
            singleton.focus()
        }
    })

    app.on('ready', createWin)
}

app.on('browser-window-created', (e, window) => {
    window.setMenuBarVisibility(false);
})

function init_player_mpris() {
    // Start at position 0
    player.seeked(0);
    // Bind the deezer events to the mpris datas
    win.webContents.executeJavaScript(`
      var electron = require('electron')
      Events.subscribe(Events.player.playerReady, function(){
          electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
      })
      Events.subscribe(Events.player.updateCurrentTrack, function(){
          electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
      })
      Events.subscribe(Events.player.trackChange, function(){
          electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
      })
      Events.subscribe(Events.player.playing, function(){
          electron.ipcRenderer.send('readDZPlaying', dzPlayer.isPlaying())
          electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
      })
      Events.subscribe(Events.player.volume_changed, function(){
          electron.ipcRenderer.send('readDZVolume', dzPlayer.getVolume())
      })
      Events.subscribe(Events.player.shuffle_changed, function(){
          electron.ipcRenderer.send('readDZShuffle', dzPlayer.shuffle)
      })
      Events.subscribe(Events.player.repeat_changed, function(){
          electron.ipcRenderer.send('readDZRepeat', dzPlayer.getRepeat())
      })
      `);
    // The function used to know when to read the Deezer track position
    player.getPosition = function() {
      win.webContents.executeJavaScript(`
        var electron = require('electron')
        var value = dzPlayer.getPosition()
        electron.ipcRenderer.send('readDZCurPosition', value)`);
    };

    player.on('quit', function () {
        process.exit();
    });
}

// MPRIS side actions
player.on('pause', function () {
    win.webContents.executeJavaScript("dzPlayer.control.pause();");
})
player.on('play', function () {
    win.webContents.executeJavaScript("dzPlayer.control.play();");
})
player.on('playpause', function () {
    win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
})
player.on('loopStatus', function () {
    var repeat_status;
    switch(player.loopStatus){
        case "None":
            player.loopStatus = "Playlist";
            repeat_status = 1;
            break;
        case "Playlist":
            player.loopStatus = "Track";
            repeat_status = 2;
            break;
        case "Track":
            player.loopStatus = "None";
            repeat_status = 0;
            break;
    };
    win.webContents.executeJavaScript(`dzPlayer.control.setRepeat(${repeat_status});`);
})
player.on('shuffle', function () {
    var shuffle_status = arguments['0'];
    player.shuffle = shuffle_status;
    win.webContents.executeJavaScript(`dzPlayer.control.setShuffle(${shuffle_status});`);
})
player.on('next', function () {
    win.webContents.executeJavaScript("dzPlayer.control.nextSong();");
})
player.on('previous', function () {
    win.webContents.executeJavaScript("dzPlayer.control.prevSong();");
})
player.on('volume', function () {
    win.webContents.executeJavaScript(`dzPlayer.control.setVolume(${arguments['0']});`);
})
player.on('position', function () {
    var cur_pos = arguments['0']['position'];
    var length = player.metadata['mpris:length'];
    win.webContents.executeJavaScript(`dzPlayer.control.seek(${cur_pos/length});`);
})

// Deezer side actions
ipcMain.on('readDZCurSong', function(event, data){
  var song = data;
  var artists = [];
  if ('ARTISTS' in song) {
      song['ARTISTS'].forEach(function(artist){
          artists.push(artist['ART_NAME']);
      });
  }else {
      artists = [song['ART_NAME']];
  }
  player.metadata = {
      'mpris:trackid': player.objectPath('track/0'),
      'mpris:length': song['DURATION'] * 1000 * 1000, // In microseconds
      'mpris:artUrl': 'https://e-cdns-images.dzcdn.net/images/cover/'+song['ALB_PICTURE']+'/380x380-000000-80-0-0.jpg',
      'xesam:title': song['SNG_TITLE'],
      'xesam:album': song['ALB_TITLE'],
      'xesam:artist': artists
  };
});
ipcMain.on('readDZCurPosition', function(event, data){
  player.seeked(data * 1000 * 1000);
});
ipcMain.on('readDZPlaying', function(event, data){
  if (data)
    player.playbackStatus = Player.PLAYBACK_STATUS_PLAYING;
  else
    player.playbackStatus = Player.PLAYBACK_STATUS_PAUSED;
});
ipcMain.on('readDZVolume', function(event, data){
  player.volume = data;
});
ipcMain.on('readDZShuffle', function(event, data){
  player.shuffle = data;
});
ipcMain.on('readDZRepeat', function(event, data){
  switch(data){
      case 0:
          player.loopStatus = "None";
          break;
      case 1:
          player.loopStatus = "Playlist";
          break;
      case 2:
          player.loopStatus = "Track";
          break;
  };
});

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