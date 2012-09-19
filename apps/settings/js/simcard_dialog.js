/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
'use strict';

var _ = navigator.mozL10n.get;

var SimPinDialog = {
  dialog: document.getElementById('simpin-dialog'),
  dialogTitle: document.querySelector('#simpin-dialog header h2'),
  dialogDone: document.querySelector('#simpin-dialog button[type="submit"]'),

  pinArea: document.getElementById('pinArea'),
  pukArea: document.getElementById('pukArea'),
  newPinArea: document.getElementById('newPinArea'),
  confirmPinArea: document.getElementById('confirmPinArea'),

  pinInput: null,
  pukInput: null,
  newPinInput: null,
  confirmPinInput: null, 

  errorMsg: document.getElementById('errorMsg'),
  errorMsgHeader: document.getElementById('messageHeader'),
  errorMsgBody: document.getElementById('messageBody'),

  mobileConnection: null,

  lockType: 'pin',
  action: 'unlock',

  // Now we don't have a number-password type for input field
  // mimic one by binding one number input and one text input
  getNumberPasswordInputField: function spl_wrapNumberInput(name) {
    var valueEntered = '';
    var inputField = document.querySelector('input[name="'+name+'"]');
    var displayField = document.querySelector('input[name="'+name+'Vis"]');
    var self = this;
    inputField.addEventListener("keypress", function(evt) {
      if (evt.target !== inputField)
        return;
      evt.preventDefault();

      var key = String.fromCharCode(evt.charCode);
      if (key === '.') { // invalid
        return;
      }

      if (evt.charCode === 0) { // backspace
        valueEntered = valueEntered.substr(0, valueEntered.length - 1);
      } else {
        if (valueEntered.length >= 8)
          return;
        valueEntered += key;
      }
      displayField.value = encryption(valueEntered);
      if (displayField.value.length >= 4)
        self.dialogDone.disabled = false;
    });

    function encryption(str) {
      return (new Array(str.length + 1)).join('*');
    }

    function setValue(value) {
      valueEntered = value;
      inputField.value = value;
      displayField.value = encryption(valueEntered);
    }

    function setFocus() {
      inputField.focus();
    }

    return {
      get value() { return valueEntered; },
      set value(value) { setValue(value) },
      focus: setFocus,
    };
  },

  handleCardState: function spl_handleCardState() {
    var cardState = this.mobileConnection.cardState;
    switch (cardState) {
      case 'pinRequired':
        this.lockType = 'pin';
        this.errorMsg.hidden = true;
        this.inputFieldControl(true, false, false);
        this.pinInput.focus();
        break;
      case 'pukRequired':
        this.lockType = 'puk';
        this.errorMsgHeader.textContent = _('simCardLockedMsg');
        this.errorMsgBody.textContent = _('enterPukMsg');
        this.errorMsg.hidden = false;
        this.inputFieldControl(false, true, true);
        this.pukInput.focus();
        break;
      case 'absent':
        this.skip();
        break;
    }
    this.dialogTitle.textContent = _(this.lockType + 'Title');
  },

  showErrorMsg: function spl_showErrorMsg(retry, type) {
    this.errorMsgHeader.textContent = _(type + 'ErrorMsg');
    this.errorMsgBody.textContent = (retry === 1) ?
      _(type + 'LastChanceMsg') : _(type + 'AttemptMsg', {n: retry});

    this.errorMsg.hidden = false;
  },

  unlockPin: function spl_unlockPin() {
    var pin = this.pinInput.value;
    if (pin === '')
      return false;

    var options = {lockType: 'pin', pin: pin };
    this.unlockCardLock(options);
    this.clear();
  },

  unlockPuk: function spl_unlockPuk() {
    var puk = this.pukInput.value;
    var newPin = this.newPinInput.value;
    var confirmPin = this.confirmPinInput.value;
    if (puk === '' || newPin === '' || confirmPin === '')
      return false;

    if (newPin !== confirmPin) {
      this.errorMsgHeader.textContent = _('newPinErrorMsg');
      this.errorMsgBody.textContent = '';
      this.errorMsg.hidden = false;
      return false;
    }
    var options = {lockType: 'puk', pin: pin, newPin: newPin };
    this.unlockCardLock(options);
    this.clear();
  },

  unlockCardLock: function spl_unlockCardLock(options) {
    var self = this;
    var req = this.mobileConnection.unlockCardLock(options);
    req.onsuccess = function sp_unlockSuccess() {
      self.close();
    };
    req.onerror = function sp_unlockError() {
      var retry = (req.result && req.result.retryCount)? 
        parseInt(req.result.retryCount, 10) : -1;
      self.showErrorMsg(retry, 'pin');
      self.pinInput.focus();
    };
  },
  
  enableLock: function spl_enableLock(enabled) {
    var pin = this.pinInput.value;
    if (pin === '')
      return false;

    var enabled = SimPinLock.simPinCheckBox.checked;
    var options = {lockType: 'pin', pin: pin, enabled: enabled};
    this.setCardLock(options);
    this.clear();
  },

  changePin: function spl_changePin() {
    var pin = this.pinInput.value;
    var newPin = this.newPinInput.value;
    var confirmPin = this.confirmPinInput.value;
    if (pin === '' || newPin === '' || confirmPin === '')
      return false;

    if (newPin !== confirmPin) {
      this.errorMsgHeader.textContent = _('newPinErrorMsg');
      this.errorMsgBody.textContent = '';
      this.errorMsg.hidden = false;
      return false;
    }
    var options = {lockType: 'pin', pin: pin, newPin: newPin};
    this.setCardLock(options);
    this.clear();
  },
 
  setCardLock: function spl_setCardLock(options) {
    var self = this;
    var req = this.mobileConnection.setCardLock(options);
    req.onsuccess = function spl_enableSuccess() {
      self.close();
      if (self.onsuccess)
        self.onsuccess();
    };
    req.onerror = function spl_enableError() {
      var retry = (req.result && req.result.retryCount)? 
        parseInt(req.result.retryCount, 10) : -1;
      self.showErrorMsg(retry, 'pin');
      self.pinInput.focus();
    };
  },
  inputFieldControl: function spl_inputField(isPin,  isPuk, isNewPin) {
    this.pinArea.hidden = !isPin;
    this.pukArea.hidden = !isPuk;
    this.newPinArea.hidden = !isNewPin;
    this.confirmPinArea.hidden = !isNewPin;
  },
  
  verify: function spl_verify() {
    switch(this.action) {
      case 'unlock':
        if (this.lockType === 'pin')
          this.unlockPin();
        else {
          this.unlockPuk();
        }
        break;
      case 'enable':
        this.enableLock();
        break;
      case 'changePin':
        this.changePin();
        break;
    }
    return false;
  },


  clear: function spl_clear() {
    this.errorMsg.hidden = true;
    this.pinInput.value = '';
    this.pukInput.value = '';
    this.newPinInput.value = '';
    this.confirmPinInput.value = '';
  },

  onsuccess: null,
  oncancel: null,
  show: function spl_show(action, onsuccess, oncancel) {
    this.dialogDone.disabled = true;
    this.action = action;
    switch(action) {
      case 'unlock':
        this.handleCardState();
        break;
      case 'enable':
        this.inputFieldControl(true, false, false);
        break;
      case 'changePin':
        this.inputFieldControl(true, false, true);
        break;
    }

    if (onsuccess && typeof onsuccess === 'function')
      this.onsuccess = onsuccess;
    if (oncancel && typeof oncancel === 'function') 
      this.oncancel = oncancel;
    
    this.dialog.className = 'active';

    if (action == 'unlock' && this.lockType == 'puk')
      this.pukInput.focus();
    else
      this.pinInput.focus();
  },

  close: function spl_close() {
    this.clear();
    this.dialog.removeAttribute('class');
  },

  skip: function spl_skip() {
    this.close();
    if (this.oncancel) 
      this.oncancel();
    
    return false;
  },

  init: function spl_init() {
    this.mobileConnection = window.navigator.mozMobileConnection;
    this.mobileConnection.addEventListener('cardstatechange', 
        this.handleCardState.bind(this));
    this.dialog.onreset = this.skip.bind(this);
    this.dialog.onsubmit = this.verify.bind(this);

    this.pinInput = this.getNumberPasswordInputField('simpin');
    this.pukInput = this.getNumberPasswordInputField('simpuk');
    this.newPinInput = this.getNumberPasswordInputField('newSimpin');
    this.confirmPinInput = this.getNumberPasswordInputField('confirmNewSimpin');
  }
}

window.addEventListener('localized', function spl_ready() {
  SimPinDialog.init();
});
