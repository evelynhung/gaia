'use strict';

var KeyboardManager = (function() {
  function getKeyboardURL() {
    // TODO: Retrieve it from Settings, allowing 3rd party keyboards
    var host = document.location.host;
    var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');
    var protocol = document.location.protocol;

    return protocol + '//keyboard.' + domain + '/';
  }

  function generateKeyboard(container, keyboardURL, manifestURL) {
    var keyboard = document.createElement('iframe');
    keyboard.src = keyboardURL;
    keyboard.setAttribute('mozbrowser', 'true');
    keyboard.setAttribute('mozpasspointerevents', 'true');
    keyboard.setAttribute('mozapp', manifestURL);
    //keyboard.setAttribute('remote', 'true');

    container.appendChild(keyboard);
    return keyboard;
  }

  function getDefaultInputMethodURL() {
    var host = document.location.host;
    var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');
    var protocol = document.location.protocol;

    return protocol + '//input-method-1.' + domain + '/';
  }

  function generaeInputMethod(container, inputMethodURL, manifestURL) {
    var inputMethod = document.createElement('iframe');
    inputMethod.src = inputMethodURL;
    inputMethod.setAttribute('mozbrowser', 'true');
    inputMethod.setAttribute('mozpasspointerevents', 'true');
    inputMethod.setAttribute('mozapp', manifestURL);

    container.appendChild(inputMethod);
    return inputMethod;
  }

  function switchInputMethod(container, inputMethodList, inputType, inputMethodIndex) {
    var inputMethod = container.getElementsByTagName('iframe')[0];
    var inputMethodType = inputType;
    var inputMethodURL = '';
    var manifestURL = '';

    if (inputMethodList[inputType] === undefined) {
      inputMethodType = 'text';
    }

    inputMethodURL = inputMethodList[inputMethodType][inputMethodIndex].launch_path;
    manifestURL = inputMethodList[inputMethodType][inputMethodIndex].manifest_url;

    inputMethod.src = inputMethodURL;
    inputMethod.setAttribute('mozbrowser', 'true');
    inputMethod.setAttribute('mozpasspointerevents', 'true');
    inputMethod.setAttribute('mozapp', manifestURL);
  }

  function getInputMethodList() {
    // search the input method apps
    navigator.mozApps.mgmt.getAll().onsuccess = function mozAppGotAll(evt) {
      var apps = evt.target.result;

      apps.forEach(function(app) {
        var manifest = app.manifest ? app.manifest : app.updateManifest;
        if (manifest['input-method'] !== undefined) {
          console.log('app: ' + manifest.name);
        }
      });
    };

    var host = document.location.host;
    var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');
    var protocol = document.location.protocol;
    var inputMethodUrl = [
      protocol + '//input-method-1.' + domain + '/',
      protocol + '//input-method-2.' + domain + '/'
    ];
    console.log('inputMethodUrl: ' + inputMethodUrl[0]);
    var list = {
      'text': [
        {
          'launch_path': inputMethodUrl[0] + 'index.html',
          'manifest_url': inputMethodUrl[0] + 'manifest.webapp',
          'name': 'English Layout',
          'locale': 'en_US',
          'input_mode': 'keyboard'
        },
        {
          'launch_path': inputMethodUrl[1] + 'index.html',
          'manifest_url': inputMethodUrl[1] + 'manifest.webapp',
          'name': 'Chinese Layout',
          'locale': 'zh_TW',
          'input_mode': 'keyboard'
        }
      ]
    };
    return list;
  }

  // Generate a <iframe mozbrowser> containing the keyboard.
  var container = document.getElementById('keyboard-frame');
  /*
  var keyboardURL = getKeyboardURL() + 'index.html';
  var manifestURL = getKeyboardURL() + 'manifest.webapp';
  var keyboard = generateKeyboard(container, keyboardURL, manifestURL);
  */
  var inputMethodURL = getDefaultInputMethodURL() + 'index.html';
  var manifestURL = getDefaultInputMethodURL() + 'manifest.webapp';
  var keyboard = generaeInputMethod(container, inputMethodURL, manifestURL);

  // Listen for mozbrowserlocationchange of keyboard iframe.
  var previousHash = '';
  var urlparser = document.createElement('a');
  var inputMethodIndex = 0;
  keyboard.addEventListener('mozbrowserlocationchange', function(e) {
    urlparser.href = e.detail;
    //if (previousHash == urlparser.hash)
    //  return;
    previousHash = urlparser.hash;

    var inputMethodList = getInputMethodList();
    var type = urlparser.hash.split('=');
    switch (type[0]) {
      case '#show':
        var updateHeight = function updateHeight() {
          container.removeEventListener('transitionend', updateHeight);
          if (container.classList.contains('hide')) {
            // The keyboard has been closed already, let's not resize the
            // application and ends up with half apps.
            return;
          }

          var detail = {
            'detail': {
              'height': parseInt(type[1])
            }
          };

          dispatchEvent(new CustomEvent('keyboardchange', detail));
        }

        if (container.classList.contains('hide')) {
          container.classList.remove('hide');
          container.addEventListener('transitionend', updateHeight);
          return;
        }

        updateHeight();
        break;
      case '#hide':
        // inform window manager to resize app first or
        // it may show the underlying homescreen
        dispatchEvent(new CustomEvent('keyboardhide'));
        container.classList.add('hide');
        break;
      case '#switch':
        if (inputMethodIndex === 0) {
          inputMethodIndex = 1;
        } else {
          inputMethodIndex = 0;
        }
        switchInputMethod(container, inputMethodList, 'text', inputMethodIndex);
        console.log('mozbrowserlocationchange: switch input method');
        break;
    }
  });

  // For Bug 812115: hide the keyboard when the app is closed here,
  // since it would take a longer round-trip to receive focuschange
  window.addEventListener('appwillclose', function closeKeyboard() {
      dispatchEvent(new CustomEvent('keyboardhide'));
      container.classList.add('hide');
  });
})();
