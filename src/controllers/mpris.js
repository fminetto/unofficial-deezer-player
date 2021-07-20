const Player = require('mpris-service');

class Mpris {
    constructor(win) {
        this.win = win
        this.player = Player({
            name: 'Deezer',
            identity: 'Deezer media this.player',
            supportedUriSchemes: [],
            supportedMimeTypes: [],
            supportedInterfaces: ['player']
        });

        this.initMprisPlayer();
        this.bindEvents();
    }

    initMprisPlayer() {
        // Start at position 0
        this.player.seeked(0);
        // Bind the deezer events to the mpris datas
        this.win.webContents.executeJavaScript(`
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
        this.player.getPosition = function () {
            this.win.webContents.executeJavaScript(`
            var electron = require('electron')
            var value = dzPlayer.getPosition()
            electron.ipcRenderer.send('readDZCurPosition', value)`);
        };
    }

    bindEvents() {
        this.player.on('quit', function () {
            process.exit();
        });

        // MPRIS side actions
        this.player.on('pause', function () {
            this.win.webContents.executeJavaScript("dzPlayer.control.pause();");
        })
        this.player.on('play', function () {
            this.win.webContents.executeJavaScript("dzPlayer.control.play();");
        })
        this.player.on('playpause', function () {
            this.win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
        })
        this.player.on('loopStatus', function () {
            var repeat_status;
            switch (player.loopStatus) {
                case "None":
                    this.player.loopStatus = "Playlist";
                    repeat_status = 1;
                    break;
                case "Playlist":
                    this.player.loopStatus = "Track";
                    repeat_status = 2;
                    break;
                case "Track":
                    this.player.loopStatus = "None";
                    repeat_status = 0;
                    break;
            };
            this.win.webContents.executeJavaScript(`dzPlayer.control.setRepeat(${repeat_status});`);
        })
        this.player.on('shuffle', function () {
            var shuffle_status = arguments['0'];
            this.player.shuffle = shuffle_status;
            this.win.webContents.executeJavaScript(`dzPlayer.control.setShuffle(${shuffle_status});`);
        })
        this.player.on('next', function () {
            this.win.webContents.executeJavaScript("dzPlayer.control.nextSong();");
        })
        this.player.on('previous', function () {
            this.win.webContents.executeJavaScript("dzPlayer.control.prevSong();");
        })
        this.player.on('volume', function () {
            this.win.webContents.executeJavaScript(`dzPlayer.control.setVolume(${arguments['0']});`);
        })
        this.player.on('position', function () {
            var cur_pos = arguments['0']['position'];
            var length = this.player.metadata['mpris:length'];
            this.win.webContents.executeJavaScript(`dzPlayer.control.seek(${cur_pos / length});`);
        })
    }
}

module.exports = Mpris;