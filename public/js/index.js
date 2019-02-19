function initApp() {
    const closeBtn = document.getElementById('closeBtn');
    const videoElements = document.getElementsByClassName('executeVideo');

    const x = window.matchMedia("(max-width: 768px)");
    init(x); // Call listener function at run time
    x.addListener(init);// Attach listener function on state changes

    Array.from(videoElements).forEach(function(elem) {
        elem.addEventListener('click', openVideo);
    });

    closeBtn.addEventListener('click', function() {
        const nav = document.getElementById('sidenav');
        nav.style.width = '0';
    });

    updateOnlineStatus();
    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
    var signal = document.getElementById('online-signal');
    if (navigator.onLine) {
        signal.style.background = 'green';
    } else {
        signal.style.background = 'red';
    }
}

function openVideo() {
    const elem = this;
    const manifestName = elem.getAttribute('data-manifest');
    window.location.assign("/"+ manifestName);
}

function init(x) {
    if (x.matches) {
        const slideLink = document.getElementById('slidelink');
        slideLink.addEventListener('click', function() {
            const nav = document.getElementById('sidenav');
            nav.style.width = '250px';
        });
    }
}

document.addEventListener('DOMContentLoaded', initApp);
