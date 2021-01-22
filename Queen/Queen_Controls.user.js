// ==UserScript==
// @name        Queen Controls
// @namespace   https://github.com/SOBotics
// @description Adds quick links for [tp|fp|nc|sk] to Queen reports.
// @author      double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.5
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Queen/Queen_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Queen/Queen_Controls.user.js
// @require     ../ControlHelper.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT, ControlHelper */

(function() {
  const botUserId = 6294609;
  const phraseToCheck = 'SCORE';
  const buttonsHtml = `<span class="que-controls-buttons"> [ <a class="que-tp" href="#">tp</a> | <a class="que-fp" href="#">fp</a>
                       | <a class="que-nc" href="#">nc</a> | <a class="que-sk" href="#">sk</a> ] </span>`;
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