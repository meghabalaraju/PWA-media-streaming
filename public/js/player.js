const manifestUri1 = 'https://storage.googleapis.com/shaka-demo-assets/sintel/dash.mpd';
const manifestUri2 = 'https://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest(format=mpd-time-csf)';
const manifestUri3 = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd';

const manifestMap = {
    'sintel': manifestUri1,
    'microsoft_azure': manifestUri2,
    'art_of_motion': manifestUri3,
    'downloaded': "downloaded"
};

const contentTable = document.getElementById('content-table');

function initApp() {
    const closeBtn = document.getElementById('closeBtn');
    const x = window.matchMedia("(max-width: 768px)");

    init(x); // Call listener function at run time
    x.addListener(init);

    closeBtn.addEventListener('click', function() {
        const nav = document.getElementById('sidenav');
        nav.style.width = '0';
    });

    shaka.polyfill.installAll();

    if (shaka.Player.isBrowserSupported()) {
        initPlayer();
    } else {
        console.error('Browser not supported!');
    }

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

function setDefaultBandWidth(){
    var config = {abr: {
            enabled: true,
            defaultBandwidthEstimate: 8e5
        }};
    var abr = new shaka.abr.SimpleAbrManager();
    abr.setDefaultEstimate(8e5);
    config.abr.manager = abr;
    config.abr.defaultBandwidthEstimate = 8e5;
    window.player.configure(config);
}

function initPlayer() {
    // Create a Player instance.
    const video = document.getElementById('video');
    const manifestName = video.getAttribute('data-manifestName');
    const manifest = manifestMap[manifestName];

    const player = new shaka.Player(video);

    initStorage(player);

    // Buttons
    const playButton = document.getElementById("playPauseButton");
    const giantPlayButton = document.getElementById("giantPlayButton");
    const muteButton = document.getElementById("muteButton");
    const captionButton = document.getElementById("captionButton");
    const openFullScreenButton = document.getElementById("openFullscreenButton");
    const closeFullScreenButton = document.getElementById("closeFullscreenButton");
    const downloadButton = document.getElementById("downloadButton");


    // Sliders
    const seekBar = document.getElementById("seekBar");
    const volumeBar = document.getElementById("volumeBar");

    // Attach player to the window to make it easy to access in the JS console.
    window.player = player;
    // Listen for error events.
    player.addEventListener('error', onErrorEvent);
    player.addEventListener('adaptation', onTrackChanged);

    // Event listener for the video control buttons
    playButton.addEventListener('click', playPauseVideoHandler);
    giantPlayButton.addEventListener('click', playPauseVideoHandler);
    muteButton.addEventListener('click', muteVideo);
    openFullScreenButton.addEventListener('click', openFullScreen);
    closeFullScreenButton.addEventListener('click', closeFullScreen);
    volumeBar.addEventListener('change', changeVolume);
    downloadButton.addEventListener('click', downloadClickHandler);

    seekBar.addEventListener('change', seekVideo);
    seekBar.addEventListener('mousedown', pauseVideo);
    seekBar.addEventListener('mouseup', playVideo);

    video.addEventListener('timeupdate', updateSeekBar);
    video.addEventListener('click', playPauseVideoHandler);
    video.addEventListener('loadedmetadata', function () {
        const totalDuration = document.getElementById('totalDuration');
        const value = secondsTohhmmss(video.duration);
        console.log(value);
        totalDuration.innerHTML = "/ " + value;
    });

    // Try to load a manifest.
    // This is an asynchronous process.
    if (manifest !== "downloaded") {
        player.load(manifest).then(function () {
            // This runs if the asynchronous load is successful.
            console.log('The video has now been loaded!');

            setDefaultBandWidth();
            console.log(window.player.getConfiguration());
        })
    }
    refreshContentList();
}

function onErrorEvent(event) {
    onError(event.detail);
}


function onTrackChanged(event){
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
}

function selectTracks(tracks) {
    // Store the highest bandwidth variant.
    var found = tracks
        .filter(function (track) {
            return track.type == 'variant';
        })
        .sort(function (a, b) {
            return a.bandwidth - b.bandwidth;
        })
        .pop();
    console.log('Offline Track bandwidth: ' + found.bandwidth);
    return [found];
}

function setDownloadProgress(content, progress) {

    console.log('download progress initiated');
    var progressContainer = document.getElementById('downloadProgressBarContainer');
    var progressBar = document.getElementById('downloadProgressBar');
    progressContainer.style.display = 'block';
    progressBar.value = progress * progressBar.max;
}

function initStorage(player) {
    // Create a storage instance and configure it with optional
    // callbacks. Set the progress callback so that we visualize
    // download progress and override the track selection callback.
    window.storage = new shaka.offline.Storage(player);
    window.storage.configure({
        progressCallback: setDownloadProgress,
        trackSelectionCallback: selectTracks
    });
}

function downloadContent(manifestUri, name) {
    // Construct a metadata object to be stored along side the content.
    // This can hold any information the app wants to be stored with the
    // content.
    var metadata = {
        'title': name,
        'downloaded': Date()
    };

    return window.storage.store(manifestUri, metadata);
}

function playContent(content) {
    window.player.load(content.offlineUri);
}

function listContent() {
    return window.storage.list();
}

function removeContent(content) {
    return window.storage.remove(content.offlineUri);
}

function downloadClickHandler() {
    const downloadButton = document.getElementById("downloadButton");
    const manifestName = video.getAttribute('data-manifestName');
    const manifest = manifestMap[manifestName];

    downloadButton.disabled = true;

    downloadContent(manifest, manifestName)
        .then(function (content) {
            setDownloadProgress(null, 1);
            downloadButton.disabled = false;
        })
        .catch(function (error) {
            // In the case of an error, re-enable the download button so
            // that the user can try to download another item.
            downloadButton.disabled = false;
            onError(error);
        });

}

function playPauseVideoHandler() {
    const playButton = this;
    const playPauseButton = document.getElementById("playPauseButton");
    const giantButtonDiv = document.getElementById("giantPlayButtonContainer");

    switch (playButton.id) {
        case 'playPauseButton':
            playPauseVideo(playPauseButton, giantButtonDiv);
            break;
        case 'giantPlayButton':
            giantButtonDiv.style.display = "none";
            playPauseVideo(playPauseButton);
            break;
        case 'video':
            playPauseVideo(playPauseButton, giantButtonDiv);
            break;
    }
}

function muteVideo() {
    const muteButton = this;
    const volumeBar = document.getElementById('volumeBar');

    if (video.volume !== 0) {
        const value = volumeBar.value;
        volumeBar.setAttribute('data-prevVol', value);
        video.volume = 0;
        volumeBar.value = 0;
        muteButton.innerHTML = "<i class=\"fas fa-volume-mute\"></i>"
    } else {
        video.volume = 1;
        volumeBar.value = volumeBar.getAttribute('data-prevVol');
        muteButton.innerHTML = "<i class=\"fas fa-volume-up\"></i>"
    }

}

function openFullScreen() {
    const videoContainer = document.getElementById('videoContainer');
    const controlsContainer = document.getElementById('controlsContainer');
    const video = document.getElementById('video');

    video.style.height = "100%";
    controlsContainer.style.bottom = "0";
    document.getElementById("openFullscreenButton").style.display = "none";
    document.getElementById("closeFullscreenButton").style.display = "block";

    if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
    } else if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen(); // Firefox
    } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen(); // Chrome and Safari
    } else if (videoContainer.msRequestFullscreen) { /* IE/Edge */
        videoContainer.msRequestFullscreen();
    }
}

function closeFullScreen() {
    const controlsContainer = document.getElementById('controlsContainer');
    const video = document.getElementById('video');

    video.style.height = "";
    controlsContainer.style.bottom = "";
    document.getElementById("openFullscreenButton").style.display = "block";
    document.getElementById("closeFullscreenButton").style.display = "none";

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function changeVolume() {
    const volumeBar = this;
    video.volume = volumeBar.value;

    if (video.volume === 0) {
        document.getElementById('muteButton').innerHTML = "<i class=\"fas fa-volume-mute\"></i>";
    } else {
        document.getElementById('muteButton').innerHTML = "<i class=\"fas fa-volume-up\"></i>"
    }
}

function seekVideo() {
    const seekBar = this;
    // Update the video time
    video.currentTime = video.duration * (seekBar.value / 1);
}

function updateSeekBar() {
    const seekBar = document.getElementById('seekBar');
    const timer = document.getElementById('currentTime');
    const hhmmssValue = secondsTohhmmss(video.currentTime);
    timer.innerHTML = hhmmssValue;
    const seekBarValue = (1 / video.duration) * video.currentTime;
    seekBar.value = isNaN(seekBarValue) ? 0 : seekBarValue;
}

function pauseVideo() {
    video.pause();
}

function playVideo() {
    video.play();
}

function secondsTohhmmss(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    let seconds = Math.floor(totalSeconds - (hours * 3600) - (minutes * 60));

    // round seconds
    // seconds = Math.round(seconds * 100) / 100;

    let result = (hours < 10 ? "0" + hours : hours);
    result += ":" + (minutes < 10 ? "0" + minutes : minutes);
    result += ":" + (seconds < 10 ? "0" + seconds : seconds);
    return result;
}

async function playPauseVideo(item, hideItem = undefined) {
    if (video.paused) {
        if (hideItem) {
            hideItem.style.display = "none";
        }
        item.innerHTML = "<i class=\"fas fa-pause\"></i>\n";
        video.play();
    } else {
        if (hideItem) {
            hideItem.style.display = "block";
        }
        item.innerHTML = "<i class=\"fas fa-play\"></i>\n";
        video.pause();
    }
}

// Creation of table for downloaded videos

function refreshContentList() {

    // Clear old rows from the table.
    while (contentTable.rows.length) {
        contentTable.deleteRow(0);
    }

    const addRow = function (content) {
        const append = -1;

        const row = contentTable.insertRow(append);
        row.insertCell(append).innerHTML = content.offlineUri;
        Object.keys(content.appMetadata)
            .map(function (key) {
                return content.appMetadata[key];
            })
            .forEach(function (value) {
                row.insertCell(append).innerHTML= value;
                var downloadsRow1 = contentTable.getElementsByTagName('tr')[0].getElementsByTagName('td')[0];
                var downloadsRow2 = contentTable.getElementsByTagName('tr')[0].getElementsByTagName('td')[1];
                downloadsRow1.setAttribute("style", "display:none; border-right: 2px solid red;");
                downloadsRow2.setAttribute("style", " padding:20px;");
            });

        row.insertCell(append).appendChild(createButton(
            'LOAD',
            function () {
                playContent(content);
            }));
        tableLoad();

        row.insertCell(append).appendChild(createButton(
            'REMOVE',
            function () {
                removeContent(content).then(function () {
                    refreshContentList();
                })
            }));
        tableRemove();
    };

    return listContent()
        .then(function (content) {
            content.forEach(addRow);
        });
}

function createButton(text, action) {

    var button = document.createElement('button');
    button.innerHTML = text;
    button.onclick = action;
    return button;
}

// downloads table design
function tableLoad() {
    contentTable.getElementsByTagName('tr')[0].setAttribute("style", "font-size:12px; font-family: 'Work Sans', sans-serif;" );
    var loadButton = contentTable.getElementsByTagName('tr')[0].getElementsByTagName('td')[3].getElementsByTagName('button')[0];
    loadButton.setAttribute("style",
        "color: white; " +
        "       background: #3071a9;   " +
        "       border: 2px solid #3071a9; " +
        "       border-radius: 6px; " +
        "       outline: none; " +
        "       padding: 10px 14px; \n" +
        "      text-align: center;\n" +
        "      display: inline-block;\n" +
        "      font-size: 10px;\n" +
        "       letter-spacing: 2px;\n" +
        "      margin: 4px 8px;\n" +
        "      -webkit-transition-duration: 0.4s; /* Safari */\n" +
        "      transition-duration: 0.4s;\n" +
        "      cursor: pointer;\n" +
        "      text-decoration: none;\n" +
        "      text-transform: uppercase; ");
}

function tableRemove() {
    contentTable.getElementsByTagName('tr')[0].setAttribute("style", "font-size:12px; font-family: 'Work Sans', sans-serif;" );
    var removeButton = contentTable.getElementsByTagName('tr')[0].getElementsByTagName('td')[4].getElementsByTagName('button')[0];
    removeButton.setAttribute("style",
        "color: white; " +
        "       background: #3071a9;   " +
        "       border: 2px solid #3071a9; " +
        "       outline:none; " +
        "       border-radius: 6px; " +
        "       padding: 10px 14px; \n" +
        "      text-align: center;\n" +
        "      display: inline-block;\n" +
        "      font-size: 10px;\n" +
        "       letter-spacing: 2px;\n" +
        "      margin: 4px 8px;\n" +
        "      -webkit-transition-duration: 0.4s; /* Safari */\n" +
        "      transition-duration: 0.4s;\n" +
        "      cursor: pointer;\n" +
        "      text-decoration: none;\n" +
        "      text-transform: uppercase; ");
}



// to select variant tracks(resolution)
function toggleFunction() {
    document.getElementById("resolutionDropdown").classList.toggle("show");
}


function resolution(height){
    var player = window.player;
    var tracks = player.getVariantTracks();
    console.log(tracks);
    track = tracks.find(function(x){if(x.height === height){
        console.log(x.height);
        return x
    }});

    player.configure({abr:
            {
                enabled: false
            }
    });
    player.selectVariantTrack(track, true);
    player.configure({abr:
            {
                enabled: true
            }
    });
}

window.resolution = resolution;

document.addEventListener('DOMContentLoaded', initApp);
