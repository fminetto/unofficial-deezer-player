const { ipcRenderer } = require("electron");

// Create animations
let content = document.getElementById('page_content');
if (content != null) {
    let inputs = content.getElementsByClassName('input-switch');
    for (let i = 0, len = inputs.length; i < len; i++) {
        inputs[i].addEventListener('click', function (e) {
            let node = e.target;
            node.classList.toggle('is-checked');
        });
    }
}

// Initialize values based on settings
let closeToTrayLabel = document.getElementById("closeToTray");
let closeToTray = ipcRenderer.send("requestSettings")

ipcRenderer.on("receiveSettings", (event, arg) => {
    if (arg.closeToTray == 'true') {
        closeToTrayLabel.classList.add('is-checked');
    }
});

// All the settings...
closeToTrayLabel.addEventListener('click', function (e) {
    ipcRenderer.send("setSetting", "closeToTray",
        closeToTrayLabel.classList.contains('is-checked') ? "true" : "false");
});