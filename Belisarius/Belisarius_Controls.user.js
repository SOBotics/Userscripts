// ==UserScript==
// @name        Belisarius Controls
// @namespace   http://tinygiant.io
// @description Adds quick links for [tp|fp] to Belisarius reports.
// @author      TinyGiant
// @contributor double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.5
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Belisarius/Belisarius_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Belisarius/Belisarius_Controls.user.js
// @require     ../ControlHelper.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT */

(function() {
  const botUserId = 13903854;
  const phraseToCheck = 'All revisions';
  const buttonsHtml = `<span class="beli-controls-buttons"> [ <a class="beli-tp" href="#">tp</a> | <a class="beli-fp" href="#">fp</a> ] </span>`;
  const controlHelper = new ControlHelper(botUserId, phraseToCheck, buttonsHtml);

  function init() {
    controlHelper.decorateNotDecoratedMessages();
    CHAT.addEventHandlerHook(controlHelper.newChatEventOccured.bind(controlHelper));
  }

  const ready = CHAT.Hub.roomReady.fire;
  CHAT.Hub.roomReady.fire = function() {
    ready.apply(this, arguments);
    init(); // chat page loaded
  };
})();