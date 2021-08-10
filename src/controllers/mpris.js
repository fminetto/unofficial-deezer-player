const Player = require('mpris-service');

class Mpris {
    constructor(win) {
        this.win = win
        // To obtain current position
        this.songStart;
        this.songOffset;

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
        // Bind the deezer events to the mpris datas
        this.win.webContents.executeJavaScript(`
            var electron = require('electron')
            Events.subscribe(Events.player.playerReady, function(){
                electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
                electron.ipcRenderer.send('readDZCurPosition', dzPlayer.getPosition());
            })
            Events.subscribe(Events.player.updateCurrentTrack, function(){
                electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
                electron.ipcRenderer.send('readDZCurPosition', dzPlayer.getPosition());
            })
            Events.subscribe(Events.player.trackChange, function(){
                electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
                electron.ipcRenderer.send('readDZCurPosition', dzPlayer.getPosition());
            })
            Events.subscribe(Events.player.playing, function(){
                electron.ipcRenderer.send('readDZPlaying', dzPlayer.isPlaying())
                electron.ipcRenderer.send('readDZCurSong', dzPlayer.getCurrentSong())
                electron.ipcRenderer.send('readDZCurPosition', dzPlayer.getPosition());
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
        // We have no clue about the position, but we can calculate that easily by knowing
        // the time when the song started and knowing the time of asking for the position
        // Seeking a position moves the offset
        this.player.getPosition = () => {
            let songCurrent = new Date();
            return (songCurrent - this.songStart) * 1000 + this.songOffset;
        };

        this.player.on('quit', () => {
            process.exit();
        });
    }

    bindEvents() {
        // MPRIS side actions
        this.player.on('pause', () => {
            this.win.webContents.executeJavaScript("dzPlayer.control.pause();");
        })
        this.player.on('play', () => {
            this.win.webContents.executeJavaScript("dzPlayer.control.play();");
        })
        this.player.on('playpause', () => {
            this.win.webContents.executeJavaScript("dzPlayer.control.togglePause();");
        })
        this.player.on('loopStatus', () => {
            let repeat_status;
            switch (this.player.loopStatus) {
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
        this.player.on('shuffle', () => {
            let shuffle_status = arguments['0'];
            this.player.shuffle = shuffle_status;
            this.win.webContents.executeJavaScript(`dzPlayer.control.setShuffle(${shuffle_status});`);
        })
        this.player.on('next', () => {
            this.win.webContents.executeJavaScript("dzPlayer.control.nextSong();");
        })
        this.player.on('previous', () => {
            this.win.webContents.executeJavaScript("dzPlayer.control.prevSong();");
        })
        this.player.on('volume', () => {
            this.win.webContents.executeJavaScript(`dzPlayer.control.setVolume(${arguments['0']});`);
        })
        // For setting the exact position(for example): playerctl position 10
        this.player.on('position', (event) => {
            // Track ID should match (currently they would always match)
            let position = event.position / 1000000;
            let length = this.player.metadata['mpris:length'] / 1000000;
            this.win.webContents.executeJavaScript(`dzPlayer.control.seek(${position / length});`);
        })
        // For setting the position(for example): playerctl position 10+
        this.player.on('seek', (offset) => {
            // Note that offset may be negative
            offset /= 1000000
            let length = this.player.metadata['mpris:length'] / 1000000;
            this.win.webContents.executeJavaScript(`dzPlayer.control.seek((dzPlayer.getPosition() + ${offset}) / ${length});`);
        });
    }
}

module.exports = Mpris;
