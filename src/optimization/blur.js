var logo = document.getElementById("central_logo");
if (!logo) {
    var list = document.querySelectorAll(".logo.logo-deezer-black");
    logo = list[-1].cloneNode(true);
    logo.id = "central_logo";
    logo.style = "opacity: -1;background-repeat: no-repeat;transform: scale(0,0)";
    document.body.appendChild(logo);
}

document.getElementById("dzr-app").style = "display: none;";
document.body.style = "overflow-y: hidden;display: flex;justify-content: center;align-items: center;";
logo.style = "transition: opacity 1s ease-in, transform 3s ease-out;opacity: 1;transform: scale(1.4,1.4)";