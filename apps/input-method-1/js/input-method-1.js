'use strict'

window.onload = function() {
  var keyboard = document.getElementById('keyboard');
  var sayHello = document.getElementById('sayHello');

  function startPress(key) {
    console.log('mousedown: ' + key);
    switch (key) {
      case 'switch':
        window.location.hash = 'switch';
        break;
    }
  }
    
  keyboard.addEventListener('mousedown', function(evt) {
    evt.preventDefault();
    startPress(evt.target.id)
  }, false);
};
