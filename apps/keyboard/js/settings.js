'use strict'

var Settings = {
  keyboardSettingsData: {
    'language.current': 'en-US',
    'keyboard.wordsuggestion': false,
    'keyboard.vibration': false,
    'keyboard.clicksound': false,
    'keyboard.layouts.english': false,
    'keyboard.layouts.dvorak': false,
    'keyboard.layouts.otherlatins': false,
    'keyboard.layouts.cyrillic': false,
    'keyboard.layouts.arabic': false,
    'keyboard.layouts.hebrew': false,
    'keyboard.layouts.zhuyin': false,
    'keyboard.layouts.pinyin': false,
    'keyboard.layouts.greek': false,
    'keyboard.layouts.japanese': false,
    'keyboard.layouts.portuguese': false,
    'keyboard.layouts.spanish': false
  },
  preInit: function settingsPreinit() {
    var settings = window.navigator.mozSettings;
    var that = this;

    settings.onsettingchange = function settingChanged(event) {
      var name = event.settingName;
      var value = event.settingValue;
      var settingsData = {};
      var keyboardSettingsData = that.keyboardSettingsData;

      keyboardSettingsData[name] = value;
      settingsData[name] = value;
      that.setPanel(settingsData);
    };
  },
  init: function settingsInit() {
    var keyboardSettingsData = this.keyboardSettingsData;
    var that = this;

    this.getSettings(keyboardSettingsData, function synckeyboardSettingsData(settingsData) {
      for (var key in settingsData) {
        keyboardSettingsData[key] = settingsData[key];
      }
      that.refreshPanel();
    });
  },
  getSettings: function getKeyboardSettings(query, callback) {
    var settings = window.navigator.mozSettings;
    var results = {};
    var settingNames = Object.keys(query);
    var numSettings = settingNames.length;
    var numResults = 0;

    try {
      var lock = settings.createLock();
    } catch (e) {
      // If settings is broken, just return the default values
      console.warn('Exception in mozSettings.createLock():', e,
                   '\nUsing default values');
      callback(query);
    }

    for (var name in query) {
      requestSetting(name);
    }

    function requestSetting (name) {
      try {
        var request = lock.get(name);
      } catch (e) {
        console.warn('Exception querying setting', name, ':', e,
                     '\nUsing default value');
        recordResult(name, query[name]);
        return;
      }
      request.onsuccess = function() {
        var value = request.result[name];
        if (value === undefined) {
          value = query[name];
        }
        recordResult(name, value);
      };
      request.onerror = function(evt) {
        console.warn('Error querying setting', name, ':', evt.error);
        recordResult(name, query[name]);
      }; 
    }

    function recordResult(name, value) {
      results[name] = value;
      numResults++;
      if (numResults === numSettings) {
        callback(results);
      }
    }
  },
  setPanel: function setSettingsPanel(settingsData) {
    var checkboxes = [];
    
    for (var key in settingsData) {
      checkboxes = document.getElementsByName(key);
      if (checkboxes.length !== 0) {
        checkboxes[0].checked = !!settingsData[key]
      }
    }
  },
  refreshPanel: function refreshSettingsPanel() {
    var keyboardSettingsData = this.keyboardSettingsData;
    this.setPanel(keyboardSettingsData);
  }
};

var rule = 'input[type="checkbox"]';
var checkboxes = document.querySelectorAll(rule);

for(var i = 0; i < checkboxes.length; i++) {
  checkboxes[i].addEventListener('change', function(evt) {
    var settings = window.navigator.mozSettings;
    var lock = settings.createLock();
    var key = evt.target.name;
    var value = evt.target.checked;
    var keyboardSettingsData = Settings.keyboardSettingsData;
    var settingsData = {};

    keyboardSettingsData[key] = value;
    settingsData[key] = value;
    lock.set(settingsData);
  }, false);
}

window.addEventListener('load', function initialize() {
  Settings.init();
});

// startup & language switching
window.addEventListener('localized', function showLanguages() {
  // set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;
  navigator.mozL10n.translate(document);
});

Settings.preInit();
