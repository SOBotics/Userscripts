// ==UserScript==
// @name        Queen Controls
// @namespace   https://github.com/SOBotics
// @description Adds quick links for [tp|fp|nc|sk] to Queen reports.
// @author      double-beep
// @include     https://chat.stackoverflow.com/rooms/111347/*
// @include     https://chat.stackoverflow.com/rooms/167908/*
// @version     1.0.2
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Queen/Queen_Controls.user.js
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Queen/Queen_Controls.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* jshint esversion: 6 */
/* globals CHAT */

(function() {
  const queenUserId = 6294609;
  const phraseToCheck = 'SCORE';
  const currentRoomId = CHAT.CURRENT_ROOM_ID;
  const buttonsHtml = `<span class="que-controls-buttons"> [ <a class="que-tp" href="#">tp</a> | <a class="que-fp" href="#">fp</a>
                       | <a class="que-nc" href="#">nc</a> | <a class="que-sk" href="#">sk</a> ] </span>`;
  const generateReply = (toReplyId, text) => `:${toReplyId} ${text}`;
  const chatFkey = window.fkey().fkey;
  const chatHost = window.location.host;

  async function sendMessageToChat(messageText) {
    const parameters = new FormData();
    parameters.append('text', messageText);
    parameters.append('fkey', chatFkey);
    await fetch(`https://${chatHost}/chats/${currentRoomId}/messages/new`, {
      method: 'POST',
      body: parameters
    });
  }

  function getMessageIdFromElement(element) {
    return element.parentElement.parentElement.parentElement.id.split('-')[1];
  }

  function decorateChatMessage(messageContentElement) {
    messageContentElement.insertAdjacentHTML('afterbegin', buttonsHtml);
    [...messageContentElement.children[0].children].forEach(el => {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        const messageId = getMessageIdFromElement(el);
        sendMessageToChat(generateReply(messageId, el.className.split('-')[1]))
      });
    });
  }

  function decorateNotDecoratedMessages() {
    [...document.querySelectorAll(`.user-${queenUserId}.monologue .message .content`)].forEach(el => {
      if (!el.innerHTML.match(phraseToCheck) || el.children[0].classList.contains('que-controls-buttons')) return;
      decorateChatMessage(el);
    });
  }

  function newChatEventOccured(event) {
    // Event should happen in the current room, it should be a new message (type 1) or an edit (type 2), by Queen (userId 6294609). It should be a report.
    if (event.room_id == currentRoomId && event.event_type < 2 && event.user_id == queenUserId && event.content.match(phraseToCheck)) {
      setTimeout(() => decorateChatMessage(document.querySelector(`#message-${event.message_id} .content`)), 0); // hacky setTimeout; element is not found otherwise
    }
  }

  function init() {
    decorateNotDecoratedMessages();
    CHAT.addEventHandlerHook(newChatEventOccured);
  }

  const ready = CHAT.Hub.roomReady.fire;
  CHAT.Hub.roomReady.fire = function() {
    ready.apply(this, arguments);
    init(); // chat page loaded
  }
})();