// ==UserScript==
// @name        Natty Controls
// @namespace   http://tinygiant.io
// @description Adds quick links for [tp|fp|ne] to Natty reports.
// @author      TinyGiant
// @contributor double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.5
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Natty/Natty_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Natty/Natty_Controls.user.js
// @require     ../ControlHelper.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT */

(function() {
  const botUserId = 6817005;
  const phraseToCheck = 'Link to Post';
  const buttonsHtml = `<span class="nat-controls-buttons"> [ <a class="nat-tp" href="#">tp</a>
                       | <a class="nat-fp" href="#">fp</a> | <a class="nat-ne" href="#">ne</a> ] </span>`;
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