'use strict';


// ===============================
// AUDIO VARIABLES
// ===============================

let audioContext = null;
let audioBuffer = null;
let sourceNode = null;
let isPlaying = false;


// ===============================
// DOM ELEMENTS
// ===============================

const fileInput = document.getElementById("file-input");

const canvas = document.getElementById("waveform-canvas");

const ctx = canvas 
    ? canvas.getContext("2d") 
    : null;


const startSlider =
document.getElementById("start-slider");


const endSlider =
document.getElementById("end-slider");


const overlayLeft =
document.getElementById("overlay-left");


const overlayRight =
document.getElementById("overlay-right");


const startTimeDisplay =
document.getElementById("start-time-display");


const endTimeDisplay =
document.getElementById("end-time-display");


const durationDisplay =
document.getElementById("duration-display");


const previewBtn =
document.getElementById("btn-preview");


const downloadBtn =
document.getElementById("btn-download");




// ===============================
// EVENT LISTENERS
// ===============================


if(fileInput){

    fileInput.addEventListener(
        "change",
        handleFileUpload
    );

}


if(startSlider){

    startSlider.addEventListener(
        "input",
        updateUI
    );

}


if(endSlider){

    endSlider.addEventListener(
        "input",
        updateUI
    );

}


if(previewBtn){

    previewBtn.addEventListener(
        "click",
        togglePreview
    );

}


if(downloadBtn){

    downloadBtn.addEventListener(
        "click",
        downloadTrimmedAudio
    );

}




// ===============================
// UPLOAD AUDIO
// ===============================


async function handleFileUpload(event){


    const file =
    event.target.files[0];


    if(!file)
        return;



    document.getElementById(
        "waveform-ui"
    ).style.display="block";


    document.getElementById(
        "slider-ui"
    ).style.display="block";


    document.getElementById(
        "controls-ui"
    ).style.display="flex";



    if(!audioContext){

        audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    }



    try{


        const arrayBuffer =
        await file.arrayBuffer();



        audioBuffer =
        await audioContext.decodeAudioData(
            arrayBuffer
        );


        drawWaveform();


        resetSliders();


        updateUI();



    }
    catch(error){


        console.error(error);


        alert(
            "Invalid audio file"
        );


    }

}




// ===============================
// DRAW WAVEFORM
// ===============================


function drawWaveform(){


    if(!canvas || !ctx || !audioBuffer)
        return;



    const width =
    canvas.width =
    canvas.offsetWidth;



    const height =
    canvas.height =
    canvas.offsetHeight;



    const rawData =
    audioBuffer.getChannelData(0);



    const step =
    Math.ceil(
        rawData.length / width
    );



    const amp =
    height / 2;



    ctx.clearRect(
        0,
        0,
        width,
        height
    );



    ctx.fillStyle =
    "#00ff88";



    for(
        let i=0;
        i<width;
        i++
    ){


        let min=1;

        let max=-1;



        for(
            let j=0;
            j<step;
            j++
        ){


            const value =
            rawData[
                i * step + j
            ];



            if(value < min)
                min=value;



            if(value > max)
                max=value;


        }



        ctx.fillRect(

            i,

            (1+min)*amp,

            1,

            Math.max(
                1,
                (max-min)*amp
            )

        );


    }


}




// ===============================
// RESET SLIDER
// ===============================


function resetSliders(){


    startSlider.value = 0;

    endSlider.value = 100;


}




// ===============================
// UPDATE DISPLAY
// ===============================


function updateUI(){


    if(!audioBuffer)
        return;



    let start =
    Number(startSlider.value);



    let end =
    Number(endSlider.value);



    if(start >= end){


        start =
        end - 0.1;


        startSlider.value =
        start;


    }




    overlayLeft.style.width =
    start + "%";



    overlayRight.style.width =
    (100-end)+"%";




    const total =
    audioBuffer.duration;



    const startTime =
    total * start /100;



    const endTime =
    total * end /100;




    startTimeDisplay.textContent =
    `Start: ${startTime.toFixed(2)}s`;



    endTimeDisplay.textContent =
    `End: ${endTime.toFixed(2)}s`;



    durationDisplay.textContent =
    `Total: ${total.toFixed(2)}s`;


}




// ===============================
// PREVIEW
// ===============================


function togglePreview(){


    if(isPlaying){


        if(sourceNode)
            sourceNode.stop();



        isPlaying=false;


        previewBtn.textContent =
        "▶ Preview Trim";


        return;

    }




    if(!audioBuffer)
        return;




    const duration =
    audioBuffer.duration;



    const start =
    duration *
    Number(startSlider.value)
    /100;



    const end =
    duration *
    Number(endSlider.value)
    /100;




    sourceNode =
    audioContext.createBufferSource();



    sourceNode.buffer =
    audioBuffer;



    sourceNode.connect(
        audioContext.destination
    );



    sourceNode.start(
        0,
        start,
        end-start
    );



    isPlaying=true;



    previewBtn.textContent =
    "⏹ Stop Preview";




    sourceNode.onended =
    ()=>{


        isPlaying=false;


        previewBtn.textContent =
        "▶ Preview Trim";


    };


}




// ===============================
// DOWNLOAD WAV
// ===============================


function downloadTrimmedAudio(){


    if(!audioBuffer)
        return;



    const sampleRate =
    audioBuffer.sampleRate;



    const start =
    Math.floor(

        audioBuffer.duration *

        Number(startSlider.value)

        /100 *

        sampleRate

    );



    const end =
    Math.floor(

        audioBuffer.duration *

        Number(endSlider.value)

        /100 *

        sampleRate

    );



    const frameCount =
    end-start;



    const channels =
    audioBuffer.numberOfChannels;



    const newBuffer =
    audioContext.createBuffer(

        channels,

        frameCount,

        sampleRate

    );




    for(
        let ch=0;
        ch<channels;
        ch++
    ){


        newBuffer
        .getChannelData(ch)
        .set(

            audioBuffer
            .getChannelData(ch)
            .subarray(
                start,
                end
            )

        );


    }



    const wav =
    bufferToWave(
        newBuffer,
        frameCount
    );



    const url =
    URL.createObjectURL(wav);



    const link =
    document.createElement("a");


    link.href=url;


    link.download =
    "trimmed_audio.wav";


    link.click();



    URL.revokeObjectURL(url);


}






// ===============================
// WAV ENCODER FIXED
// ===============================


function bufferToWave(buffer,len){


    const channels =
    buffer.numberOfChannels;


    const bytes =
    2;



    const dataSize =
    len *
    channels *
    bytes;



    const arrayBuffer =
    new ArrayBuffer(
        44 + dataSize
    );



    const view =
    new DataView(
        arrayBuffer
    );



    let offset=0;




    function uint32(value){

        view.setUint32(
            offset,
            value,
            true
        );


        offset+=4;

    }



    function uint16(value){

        view.setUint16(
            offset,
            value,
            true
        );


        offset+=2;

    }





    // HEADER


    uint32(0x46464952);

    uint32(
        36 + dataSize
    );


    uint32(0x45564157);


    uint32(0x20746d66);


    uint32(16);


    uint16(1);


    uint16(channels);


    uint32(
        buffer.sampleRate
    );


    uint32(
        buffer.sampleRate *
        channels *
        bytes
    );


    uint16(
        channels *
        bytes
    );


    uint16(16);



    uint32(0x61746164);


    uint32(dataSize);





    const channelData=[];



    for(
        let i=0;
        i<channels;
        i++
    ){

        channelData.push(
            buffer.getChannelData(i)
        );

    }






    // AUDIO DATA LOOP

    for(
        let frame=0;
        frame<len;
        frame++
    ){


        for(
            let ch=0;
            ch<channels;
            ch++
        ){


            let sample =
            channelData[ch][frame];



            sample =
            Math.max(
                -1,
                Math.min(
                    1,
                    sample
                )
            );



            sample =
            sample < 0

            ?

            sample * 32768

            :

            sample * 32767;



            view.setInt16(

                offset,

                sample,

                true

            );


            offset +=2;


        }


    }




    return new Blob(
        [
            arrayBuffer
        ],
        {
            type:"audio/wav"
        }
    );


}
