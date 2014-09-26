var recorder = require('./audioRecorder');
// var polykit = require('./identikit');

var startButton = document.querySelector('button#start');
var stopButton = document.querySelector('button#stop');

var cont = document.querySelector('div.polycontainer');

recorder.init();
recorder.start();

var timerDiv = document.querySelector('div.timer');

var interval;

cont.onclick = function (argument) {
    clearInterval(interval);
    recorder.polyRunning = true;
    var idx = 5 + (Math.random() * 5 | 0);
    var size = Math.pow(2, idx);
    console.log(idx, size)
    recorder.analyser.fftSize = size;
    recorder.poly.init();
    startTimer();
}

stopButton.onclick = function () {
    recorder.polyRunning = false;
}




function startTimer() {
    var count = 10;
    timerDiv.innerHTML = --count;

    timerDiv.style.display = null;

    interval = setInterval(function() {
        timerDiv.innerHTML = --count;
    }, 1000);


    return setTimeout(function() {
        timerDiv.innerHTML = --count;
        recorder.polyRunning = false;
        clearInterval(interval);
        timerDiv.style.display = 'none';
    }, 1000 * count);
}



