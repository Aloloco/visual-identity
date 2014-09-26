(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var recorder = require('./audioRecorder');
// var polykit = require('./identikit');

var startButton = document.querySelector('button#start');
var stopButton = document.querySelector('button#stop');

var cont = document.querySelector('div.polycontainer');

recorder.init();
recorder.start();

var timerDiv = document.querySelector('div.timer');

var interval;
var timeout;

cont.onclick = function (argument) {
    clearInterval(interval);
    clearTimeout(timeout);
    recorder.polyRunning = true;
    var idx = 5 + (Math.random() * 5 | 0);
    var size = Math.pow(2, idx);
    console.log(idx, size)
    recorder.analyser.fftSize = size;
    recorder.poly.init();
    timeout = startTimer();
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




},{"./audioRecorder":2}],2:[function(require,module,exports){

module.exports = {

    init: function() {

        // fork getUserMedia for multiple browser versions, for those
        // that need prefixes

        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.analyser = this.audioCtx.createAnalyser();

        // XXX fix up these constants
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        this.analyser.smoothingTimeConstant = 0.85;
        this.analyser.fftSize = 128;

        // setup a canvas for the audio display
        this.canvas = document.querySelector('canvas.visualiser');
        this.ctx = this.canvas.getContext("2d");

        this.identity = [];
        this.poly = require('./identikit');


    },

    // start processing the audio
    start: function() {

        // zero out the identity array
        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
            this.identity[i] = 0;
        }

        // reference
        var an = this;

        this.time = 0;

        this.poly.init();

        if (navigator.getUserMedia) {

            navigator.getUserMedia(

                { audio: true},
                // success callback
                function (stream) {

                    document.querySelector('p.mic').style.display = 'none';
                    document.querySelector('div.timer').style.display = 'block';

                    // create a handle to the stream;
                    an.stream = stream;
                    // plug it to the audiocontext
                    an.source = an.audioCtx.createMediaStreamSource(stream);
                    // and connect it to the analyser
                    an.source.connect(an.analyser);

                    // then call visualise
                    an.visualise();

                },
                // error callback
                function (err) {
                    console.error('Error ocurred with getUserMedia', err);
                }

            );

        } else {
            console.error('microphone not supported');
        }


    },

    visualise: function () {
        var W = this.canvas.width;
        var H = this.canvas.height;

        var bufferLength = this.analyser.frequencyBinCount;

        console.log(bufferLength);

        this.dataArray = new Uint8Array(bufferLength);

        this.drawVisual;
        var an = this;

        this.ctx.clearRect(0, 0, W, H);

        function draw() {
            an.drawVisual = requestAnimationFrame(draw);
            an.analyser.getByteFrequencyData(an.dataArray);
            // an.analyser.getByteTimeDomainData(an.dataArray);

            an.ctx.fillStyle = 'rgb(255,255,255)';
            an.ctx.fillRect(0, 0, W, H);

            var barWidth = (W / bufferLength);// * 2.5; /// why 2.5?

            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = an.dataArray[i];

                an.ctx.fillStyle = 'rgba(40,' + (barHeight + 100) + ',' + barHeight + 100 + ', 0.3)';
                an.ctx.fillRect( x, H - barHeight/2, barWidth, barHeight/2);

                x += barWidth + 1;

                an.identity[i] += barHeight;

            }
            an.time++;

            an.runPoly();

        }

        draw();
    },

    runPoly: function() {

        if (!this.polyRunning) {
            return;
        }

        var averageSpectrum = this.calcAverageSpectrum();

        this.poly.createPolygon(this.dataArray);
    },

    calcAverageSpectrum : function() {
        var averageSpectrum = [];

        // normalize the identity
        for (var i = 0; i < this.identity.length; i++) {
            averageSpectrum[i] = this.identity[i] / this.time;
        }

        return averageSpectrum;
    },

    // stop processing the audio
    finish: function() {
        // XXX might break firefox
        if (this.stream.stop) {
            this.stream.stop();
        }

        cancelAnimationFrame(this.drawVisual);

        var W = this.canvas.width;
        var H = this.canvas.height;
        this.ctx.clearRect(0, 0, W, H);

        return this.calcAverageSpectrum();
    }


};
},{"./identikit":3}],3:[function(require,module,exports){
module.exports = {

    init: function (argument) {
        var canvas = document.querySelector('canvas.polygon');
        this.canvas = canvas;
        this.w = canvas.width;
        this.h = canvas.height;
        this.ctx = canvas.getContext("2d");
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.saveButton = document.querySelector('button#save');


        this.saveButton.onclick = this.saveFlower.bind(this);

        this.initAngle = 0;
        this.angleSpeed = map_range(Math.random(), 0, 1, 0, 0.025);
        this.bgAlpha = 0.001;
        this.inkAlpha = 0.025;

        this.hueSpeed = map_range(Math.random(), 0, 1, 0, 0.5);

        this.hue = Math.random() * (2 * Math.PI) * (180/Math.PI);
    },

    createPolygon: function (spectrum) {
        var ctx = this.ctx;

        ctx.rect(0, 0, this.w, this.h);
        ctx.fillStyle = "rgba(255, 255, 255, " + this.bgAlpha + ")";
        ctx.fill();

        var angle = (2*Math.PI)/(spectrum.length - 1) * 2.5;
        var mid = (this.w) / 2;
        var maxV = max_val(spectrum);

        var currAngle = this.initAngle;//-Math.PI/2;
        var xPos, yPos;
        var val;

        var points = [];

        for (var i = 0; i < spectrum.length; i++) {

            val = map_range(spectrum[i], 0, maxV, 0, mid - 50);

            xPos = val * Math.sin(currAngle);
            yPos = val * Math.cos(currAngle);

            points.push([xPos, yPos]);

            currAngle -= angle;
        }

        ctx.save();
        ctx.translate(mid, mid);
        ctx.beginPath();
        // draw three points
        var p = points[0];

        // ctx.moveTo(p[0], p[1]);

        for (var i = 0; i < points.length; i++) {
            p = points[i];
            ctx.lineTo(p[0], p[1]);
        }

        ctx.closePath();

        this.hue += this.hueSpeed ;

        ctx.fillStyle = "hsla(" + this.hue + ", 100%, 50%, " + this.inkAlpha + ")";

        ctx.fill();

        // ctx.beginPath();
        // for (var i = 0; i < points.length; i++) {

        //     p = points[i];
        //     ctx.moveTo(0, 0)
        //     ctx.lineTo(p[0], p[1]);
        // }
        // ctx.strokeStyle = "rgb(255, 255, 0)";
        // ctx.stroke();

        ctx.restore();

        this.initAngle -= this.angleSpeed;
    },

    saveFlower: function () {

        var out = document.createElement('canvas');
        out.width = this.w;
        out.height = this.h;

        var outCtx = out.getContext("2d");
        // white BG
        outCtx.fillStyle ='rgb(255,255,255)';
        outCtx.rect(0, 0, this.w, this.h);
        outCtx.fill();
        outCtx.drawImage(this.canvas, 0, 0);

        var imgURI = out.toDataURL("image/png");
        window.open(imgURI);
    }

}


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function max_val(array) {
    return Math.max.apply(Math, array);
}
},{}]},{},[1,2,3])