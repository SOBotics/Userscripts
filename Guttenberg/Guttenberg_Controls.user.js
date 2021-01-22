// ==UserScript==
// @name        Guttenberg Controls
// @namespace   http://tinygiant.io
// @description Adds quick links for [k|f] to Guttenberg reports.
// @author      TinyGiant
// @contributor double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.5
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Guttenberg/Guttenberg_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Guttenberg/Guttenberg_Controls.user.js
// @require     ../ControlHelper.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT, ControlHelper */

(function() {
  const botUserId = 7418352;
  const phraseToCheck = 'is possible';
  const buttonsHtml = '<span class="gut-controls-buttons"> [ <a class="gut-k" href="#">k</a> | <a class="gut-f" href="#">f</a> ] </span>';
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