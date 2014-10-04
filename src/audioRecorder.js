
module.exports = {

    recording: false,

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

        console.log("Bin Count", this.analyser.frequencyBinCount);

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

            var barWidth = (W / an.analyser.frequencyBinCount);/// * 2.5; /// why 2.5?

            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = an.dataArray[i];
                if (an.recording) {
                    an.ctx.fillStyle = 'rgba(' + barHeight + 150 + ',' + (barHeight + 100) + ', 40, 0.63)';
                } else {
                    an.ctx.fillStyle = 'rgba(40,' + (barHeight + 100) + ',' + barHeight + 100 + ', 0.1)';
                }
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

        if (!this.recording) {
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