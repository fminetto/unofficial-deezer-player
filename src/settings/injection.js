const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');

let injected = false;

function read_file(file, _data) {
    let _path = path.join(__dirname, file);
    fs.readFile(_path, 'utf-8', (err, data) => {
        if (err) {
            console.error("An error while trying to read a file occured ", err);
            _data.content = "error";
            return;
        }

        _data.content = data;
    });
}

// Injects new button onto the top bar next to notifications
function inject(topbar) {
    let poppers = topbar.getElementsByClassName("popper-wrapper");
    if (topbar != null && poppers != null && poppers.length > 1 && poppers[1] != null) {
        let div = document.createElement("div");
        div.className = "popper-wrapper topbar-action";
        div.innerHTML = settings_element.content;
        topbar.insertBefore(div, poppers[1]);
        init_settings_javacript();
    } else {
        console.warn("There's nowhere to put settings button");
    }
}

// Changes contents of site
function init_settings_javacript() {
    let settings_button = document.getElementById("injected_settings");
    if (settings_button != null) {
        settings_button.addEventListener('click', () => {
            // Removes highlight from sidebar
            let sidebar = document.getElementById("page_sidebar")
            let active_links = sidebar.getElementsByClassName("is-active");
            for (let i = 0, len = active_links.length; i < len; i++) {
                active_links[i].classList.remove('is-active');
            }

            // Proceeds with injection
            if (injected) {
                document.getElementById('app_settings').style.display = '';
                let other_div = document.getElementById('page_content');
                for (let i = 0, len = other_div.childElementCount; i < len; i++) {
                    if (other_div.childNodes[i].id != "app_settings") {
                        other_div.childNodes[i].style.display = 'none';
                    }
                }
                return;
            }

            injected = true;

            let page_content = document.getElementById("page_content");
            for (let i = 0, len = page_content.childElementCount; i < len; i++) {
                page_content.childNodes[i].style.display = 'none';
            }

            // Prevents destroying DOM events
            let container = document.createElement('div');
            container.innerHTML = settings.content;

            while (container.firstChild) {
                page_content.appendChild(container.firstChild);
            }

            // Create script that takes care of settings    
            read_file("settings-deezer.js", settings_javascript);
            inject_settings_javascript();

            // If user clicks on profile and generates more <a> tags, we need to hook those new as well
            let profile_button = document.getElementsByClassName("topbar-profile")[0];
            profile_button.addEventListener('click', pollAccountPopper);

            // Hook also search bar
            // but how???

            hook_custom_onclick();
        });
    } else {
        console.warn("Unable to show settings currently");
    }
}

function inject_settings_javascript() {
    if (settings_javascript.content != null) {
        let script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.innerHTML = settings_javascript.content;
        document.body.appendChild(script);
    } else {
        setTimeout(inject_settings_javascript, 100);
    }
}

function hook_custom_onclick() {
    let all_a = document.body.getElementsByTagName("a");
    for (let i = 0, len = all_a.length; i < len; i++) {
        all_a[i].addEventListener('click', onclick_redirect);
    }
}

function pollAccountPopper() {
    const account_popper = document.getElementsByClassName("popper-account");
    if (account_popper != null && account_popper.length > 0) {
        hook_custom_onclick();
    } else {
        setTimeout(pollAccountPopper, 100);
    }
}

function pollDOM() {
    const topbar = document.getElementById("page_topbar");
    if (topbar != null &&
        (settings_element.content !== null && settings_element.content !== undefined) &&
        (settings.content !== null && settings.content !== undefined)
    ) {
        if (settings_element.content == "error" || settings.content == "error") {
            console.error("An error while reading files occured");
            return;
        }
        inject(topbar);
    } else {
        setTimeout(pollDOM, 100);
    }
}

function onclick_redirect(e) {
    // If href is the same, just restore content
    if (window.location.href == this.href) {
        let other_div = document.getElementById('page_content');
        for (let i = 0, len = other_div.childElementCount; i < len; i++) {
            if (other_div.childNodes[i].id != "app_settings") {
                other_div.childNodes[i].style.display = '';
            }
        }
    }
    let app_settings = document.getElementById('app_settings');
    if (app_settings != null) {
        app_settings.style.display = 'none';
    }
}

// Workaround to achieve pointer-like behavior
let settings_javascript = { content: null };
let settings_element = { content: null };
let settings = { content: null };
read_file('settings-element.html', settings_element);
read_file('settings.html', settings);
pollDOM(settings_element, settings);