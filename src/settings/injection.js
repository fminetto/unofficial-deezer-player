const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');

let injected = false;

// Gets called first
function pollTopbar() {
    const topbar = document.getElementById("page_topbar");
    if (topbar != null &&
        (settingsElement.content !== null && settingsElement.content !== undefined) &&
        (settings.content !== null && settings.content !== undefined)
    ) {
        if (settingsElement.content == "error" || settings.content == "error") {
            console.error("An error while reading files occured");
            return;
        }
        inject(topbar);
        // initSettingsJavascript()
    } else {
        setTimeout(pollTopbar, 100);
    }
}

// Injects new button onto the top bar next to notifications
function inject(topbar) {
    let poppers = topbar.getElementsByClassName("popper-wrapper");
    if (topbar != null && poppers != null && poppers.length > 1 && poppers[1] != null) {
        let div = document.createElement("div");
        div.className = "popper-wrapper topbar-action";
        div.innerHTML = settingsElement.content;
        topbar.insertBefore(div, poppers[1]);
        initSettingsJavacript();
    } else {
        console.warn("There's nowhere to put settings button");
    }
}

// Changes contents of site
function initSettingsJavacript() {
    let settingsButton = document.getElementById("injected_settings");
    if (settingsButton != null) {
        settingsButton.addEventListener('click', () => {
            // Removes highlight from sidebar
            let sidebar = document.getElementById("page_sidebar")
            let activeLinks = sidebar.getElementsByClassName("is-active");
            for (let i = 0, len = activeLinks.length; i < len; i++) {
                activeLinks[i].classList.remove('is-active');
            }

            // Proceeds with injection
            if (injected) {
                document.getElementById('app_settings').style = null;
                changeContentVisiblity(true);
                return;
            }

            injected = true;

            // Hides page content
            let pageContent = document.getElementById("page_content");
            for (let i = 0, len = pageContent.childElementCount; i < len; i++) {
                pageContent.childNodes[i].style.display = 'none';
            }

            // Prevents destroying DOM events and adds settings
            let container = document.createElement('div');
            container.innerHTML = settings.content;

            while (container.firstChild) {
                pageContent.appendChild(container.firstChild);
            }

            // Create script that takes care of settings    
            readFile("settings-deezer.js", settingsJavascript);
            injectSettingsJavascript();

            // If user clicks on profile and generates more <a> tags, we need to hook those new as well
            let profile_button = document.getElementsByClassName("topbar-profile")[0];
            profile_button.addEventListener('click', pollAccountPopper);

            // Hook also search bar
            // but how?

            bindLinks();
        });
    } else {
        console.warn("Unable to show settings currently");
    }
}

// Appends script that takes care of settings 
function injectSettingsJavascript() {
    if (settingsJavascript.content != null) {
        let script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.innerHTML = settingsJavascript.content;
        document.body.appendChild(script);
    } else {
        setTimeout(injectSettingsJavascript, 100);
    }
}

function bindLinks() {
    let all_a = document.body.getElementsByTagName("a");
    for (let i = 0, len = all_a.length; i < len; i++) {
        all_a[i].addEventListener('click', onclickHideSettings);
    }
}

// Waits for account popper to appear after clicking profile
function pollAccountPopper() {
    const account_popper = document.getElementsByClassName("popper-account");
    if (account_popper != null && account_popper.length > 0) {
        bindLinks();
    } else {
        setTimeout(pollAccountPopper, 100);
    }
}

function onclickHideSettings(e) {
    let app_settings = document.getElementById('app_settings');
    if (app_settings != null) {
        app_settings.style.display = 'none';
    }
    changeContentVisiblity(false);
}

// Change visibility of everything but settings
function changeContentVisiblity(hide) {
    let visibility = hide ? 'none' : '';
    let pageContent = document.getElementById('page_content');
    for (let i = 0, len = pageContent.childElementCount; i < len; i++) {
        if (pageContent.childNodes[i].id != "app_settings") {
            pageContent.childNodes[i].style.display = visibility;
        }
    }
}

// Fills property content of objectWrapper data with file contents.
function readFile(file, objectWrapper) {
    let filepath = path.join(__dirname, file);
    fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
            console.error("An error while trying to read a file occured ", err);
            objectWrapper.content = "error";
            return;
        }

        objectWrapper.content = data;
    });
}

// Workaround to achieve pointer-like behavior
let settingsJavascript = { content: null };
let settingsElement = { content: null };
let settings = { content: null };
readFile('settings-element.html', settingsElement);
readFile('settings.html', settings);
pollTopbar(settingsElement, settings);