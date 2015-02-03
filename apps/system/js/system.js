'use strict';

const HOLD_INTERVAL = 2; // hold 2 seconds power button to power off.

var SystemControl = {
  timer: undefined,

  init: function() {
    window.addEventListener('keydown', this);
    window.addEventListener('mozChromeEvent', this); // backward compatible
    this.attachVideoElement();
    var lockOrientation = screen.lockOrientation || screen.mozLockOrientation;
    var locked = lockOrientation.call(window.screen,'landscape-primary');
    if (!locked) {
      console.log('==== can not lock orientation');
    }
  },

  attachVideoElement: function() {
    var video = document.createElement('video');
    video.id = 'demo';
    video.src = 'test_media/demo.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.controls = true;

    var self = this;
    video.addEventListener('timeupdate', function() {
      // When the video is about to the end, remove it and attach another one
      // to workaround a Gonk issue. See bug 1125760 comment 6.
      if ( (video.duration - video.currentTime) < 0.5) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        document.body.removeChild(video);
        self.attachVideoElement();
      }
    });

    document.body.appendChild(video);
  },

  handleEvent: function(evt) {
    console.log('==== event ' + evt.detail.type);

    switch (evt.detail.type) {
      case 'sleep-button-press':
        var self = this;
        this.timer = setTimeout(function() {
          self.powerOff();
        }, HOLD_INTERVAL * 1000);
        break;
      case 'sleep-button-release':
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = undefined;
        }
        break;
    }
  },

  powerOff: function() {
    console.log('==== power off!');
    navigator.mozPower.powerOff();
  }
};

window.addEventListener('load', function() {
  SystemControl.init();
});
