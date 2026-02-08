'use strict';

let peer = null;
let localStream = null;
let currentCall = null;

const videoEl = document.getElementById('videoElement');
const volSlider = document.getElementById('volumeSlider');

async function startSharing(){
    if (!window.Peer) {
        notify.error("PeerJS library not loaded. Please check your internet connection.");
        return;
    }
    try{
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: {cursor: "always"},
            audio: true,
        })

        localStream.getVideoTracks()[0].onended = () => stopSharing();

        videoEl.muted = true;
        volSlider.value = 0;

        const shortId = Math.floor(1000 + Math.random() * 9000).toString();
        peer = new window.Peer('toolsuite-' + shortId);
        
        peer.on('open', (id) => {
            enterDisplayMode(true);
            document.getElementById('share-id-display').innerText = shortId;
            updateStatus("Waiting for connection...");
        });

        peer.on('call', (call) => {
            console.log("Incoming connection...")
            call.answer(localStream);
            currentCall = call;

            updateStatus("Device Connected! Streaming...");
            
            call.on('close', () => updateStatus("Viewer disconnected. Waiting..."));
        })

        peer.on('error', (err) => {
            notify.error("Connection Error: " + err.type);
            stopSharing();
        });


    }catch (err) {
        console.error(err);
        if (err.name !== 'NotAllowedError') {
            notify.error("Failed to start screen share: " + err.message);
        }
    }
}

function joinStream(){
    const code = document.getElementById('joinCode').value.trim();
    if (code.length !== 4) return notify.info("Please enter the 4-digit code.");

    updateStatus("Connecting to Host...");

    peer = new window.Peer();

    peer.on('open', ()=> {
        enterDisplayMode(false);

        const canvas = document.createElement('canvas');
        canvas.width = 1; 
        canvas.height = 1;
        const dummyStream = canvas.captureStream(1);
        const call = peer.call('toolsuite-' + code, dummyStream);
        currentCall = call;

        call.on('stream', (remoteStream) => {
            console.log("Stream received!");
            const video = document.getElementById('videoElement');
            video.srcObject = remoteStream;
            video.muted = false;
            
            updateStatus("Live Feed");

            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    updateStatus("Tap video to start playing");
                });
            }
        });

        call.on('close', () => {
            notify.info("Host stopped sharing.");
            stopSharing();
        });

        peer.on('error', (err) => {
            if (err.type === 'peer-unavailable') {
                notify.error("Invalid Code or Host is offline.");
            } else {
                notify.error("Error: " + err.type);
            }
            stopSharing();
        });
    })
}

function stopSharing(){
    if(localStream){
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if(currentCall){
        currentCall.close();
        currentCall = null;
    }

    if (peer) {
        peer.destroy();
        peer = null;
    }

    document.getElementById('setup-zone').classList.remove('hidden');
    document.getElementById('display-zone').classList.add('hidden');
    document.getElementById('videoElement').srcObject = null;
    document.getElementById('joinCode').value = "";

    if (document.pictureInPictureElement) document.exitPictureInPicture();
    if (document.fullscreenElement) document.exitFullscreen();
}

function enterDisplayMode(isHost) {
    document.getElementById('setup-zone').classList.add('hidden');
    document.getElementById('display-zone').classList.remove('hidden');
    
    document.getElementById('host-info').style.display = isHost ? 'block' : 'none';
}

function updateStatus(msg) {
    document.getElementById('status-text').innerText = msg;
}

function setVolume(val) {
    videoEl.volume = val;
    videoEl.muted = (val === "0");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        videoEl.requestFullscreen().catch(err => {
            notify.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

async function togglePip() {
    try {
        if (videoEl !== document.pictureInPictureElement) {
            await videoEl.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
    } catch (error) {
        notify.error("Picture-in-Picture failed: " + error.message);
    }
}