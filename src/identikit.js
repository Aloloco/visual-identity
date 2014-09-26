// annoyingly it sets Firebase to be a global.
require('firebase');

var $ = require('jquery');
// PFFFFT FUCKING SHIT
window.jQuery = $;
window.$ = $;
require('magnific-popup');

var database = new Firebase('https://visual-identity.firebaseio.com/');

var imagesRef = database.child("images");

var currentRef = database.child("current");

module.exports = {

    init: function (argument) {

        // add a flag so we don't publish twice.
        this.published = false;

        var canvas = document.querySelector('canvas.polygon');
        this.canvas = canvas;
        this.w = canvas.width;
        this.h = canvas.height;
        this.ctx = canvas.getContext("2d");
        this.ctx.clearRect(0, 0, this.w, this.h);

        this.saveButton = document.querySelector('a#save');

        this.publishButton = document.querySelector('a.publish');
        this.publishButton.innerHTML = 'publish';
        this.publishButton.onclick = this.publishFlower.bind(this);

        this.saveButton.onclick = this.saveFlower.bind(this);

        this.initAngle = 0;
        this.angleSpeed = map_range(Math.random(), 0, 1, 0, 0.025);
        this.bgAlpha = 0.001;
        this.inkAlpha = 0.025;

        this.hueSpeed = map_range(Math.random(), 0, 1, 0, 0.5);

        this.hue = Math.random() * (2 * Math.PI) * (180/Math.PI);

        this.sendFrame();
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

        this.hue += this.hueSpeed % 360;

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

        this.sendFrame();

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

        this.imgURI = imgURI;

        var anchor = document.createElement('a');
        anchor.href = imgURI;
        anchor.download = new Date().toISOString() + '.png';

        var img = document.createElement('img');
        img.src = imgURI;

        anchor.appendChild(img);


        $('#save-modal .image').html(anchor);

        $.magnificPopup.open({
            items : {
                type: 'inline',
                src: '#save-modal',
            },
            modal: true
        });

        $(document).on('click', '.popup-modal-dismiss', function (e) {
            e.preventDefault();
            $.magnificPopup.close();
        });



    },


    sendFrame: function() {

        var out = document.createElement('canvas');
        out.width = this.w;
        out.height = this.h;

        var outCtx = out.getContext("2d");
        // white BG
        outCtx.fillStyle ='rgb(255,255,255)';
        outCtx.rect(0, 0, this.w, this.h);
        outCtx.fill();
        outCtx.drawImage(this.canvas, 0, 0);

        var frame = out.toDataURL();

        currentRef.set({
            dataURI: frame
        });

    },


    publishFlower: function() {

        if (this.published) {
            return;
        }

        var self = this;

        imagesRef.push({
                date: new Date().toISOString(),
                dataURI: this.imgURI
            }, function(error) {
                if (error) {
                    return console.error('could not publish!');
                }

                self.publishButton.innerHTML = 'published';

                self.published = true;


        });


    }

}


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function max_val(array) {
    return Math.max.apply(Math, array);
}