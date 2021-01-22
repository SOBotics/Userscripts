// ==UserScript==
// @name        Generic Bot Controls
// @namespace   https://github.com/SOBotics
// @description Adds [ untrack ] at the end of a "post has been edited" chat message
// @author      double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.5
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/GenericBot/GenericBot_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/GenericBot/GenericBot_Controls.user.js
// @require     ../ControlHelper.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT */

(function() {
  const botUserId = 7481043;
  const phraseToCheck = 'has been edited';
  const buttonsHtml = `<span class="generic-controls-buttons"> [ <a class="generic-untrack" href="#">untrack</a> ] </span>`;
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