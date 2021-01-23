// ==UserScript==
// @name         Sentinel Reporter
// @namespace    https://github.com/SOBotics
// @version      1.4
// @description  Quick feedback to Natty directly from Sentinel's post page
// @author       Filnor
// @contributor  geisterfurz007
// @contributor  double-beep
// @include      https://sentinel.erwaysoftware.com/posts/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelReporter.user.js
// @updateURL    https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelReporter.user.js
// ==/UserScript==

(function() {
  'use strict';

  const soboticsRoomId = 111347;
  const seboticsRoomId = 54445;
  const getFeedbackString = (postUrl, feedbackType) => `@Natty feedback ${postUrl} ${feedbackType}`;

  const isAskUbuntuPost = !!document.querySelector('h3 a').href.match(/^https?:\/\/(www\.)?askubuntu/);
  const answerUrl = document.querySelector('h3 a').href;
  const chatHost = `chat.stack${isAskUbuntuPost ? 'exchange' : 'overflow'}.com`, roomId = isAskUbuntuPost ? seboticsRoomId : soboticsRoomId;
  const postChatUrl = `https://${chatHost}/chats/${roomId}/messages/new`, chatRoomUrl = `https://${chatHost}/rooms/${roomId}`;
  const feedbackButtonsHtml = '<p id="feedback-line">'
                            + '   <b>Add feedback:</b>&nbsp;'
                            + '   <button type="button" class="fb-button" id="feedback-tp" title="tp - true positive">✔️</button>'
                            + '   <button type="button" class="fb-button" id="feedback-fp" title="fp - false positive">❌</button>'
                            + '   <button type="button" class="fb-button" id="feedback-ne" title="ne - needs editing">✏️</button>'
                            + '</p>';
  const eventHistoryHtml = document.createElement('div');
  eventHistoryHtml.classList.add('alert', 'alert-info', 'sentinel-reporter-d-none');
  const eventHistorySpan = document.createElement('span');
  eventHistorySpan.id = 'sentinel-reporter-event-span';
  eventHistoryHtml.appendChild(eventHistorySpan);

  GM_addStyle('.fb-button { background: none; border: 0px solid black; } .sentinel-reporter-d-none { display: none !important }');

  function handleEvent(text) {
    const eventSpan = document.querySelector('#sentinel-reporter-event-span');
    eventSpan.insertAdjacentHTML('beforeend', text + '<br>');
    if (eventSpan.parentElement.classList.contains('sentinel-reporter-d-none')) eventSpan.parentElement.classList.remove('sentinel-reporter-d-none');
  }

  function sendChatMessage(fkey, messageToSend) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: postChatUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: `text=${encodeURIComponent(messageToSend)}&fkey=${fkey}`,
        onload: function(response) {
          if (response.status === 200) {
            const parsedResponse = JSON.parse(response.responseText);
            parsedResponse.id && parsedResponse.time ? resolve(true) : reject('Failed to send chat message: conflict!');
          } else {
            reject('Failed to send chat message: ' + response.status + '.' + response.responseText);
          }
        },
        onerror: function(error) {
          reject('Error while trying to send chat message: ' + error.status + '. See console for more details or retry.');
          console.error(error.responseText);
        }
      });
    });
  }

  function getFkeyFromChat() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: chatRoomUrl,
        onload: function (response) {
          const domParser = new DOMParser();
          const parsedHtml = domParser.parseFromString(response.responseText, 'text/html');
          const fkey = parsedHtml.querySelector('#fkey').value;
          resolve(fkey);
        },
        onerror: function(error) {
          reject('Error ' + error.status + ' while trying to fetch fkey from chat. See console for more details.');
          console.error(error);
        }
      });
    });
  }

  document.querySelector('h3').insertAdjacentHTML('afterend', feedbackButtonsHtml); // insert buttons
  document.querySelector('#feedback-line').insertAdjacentElement('afterend', eventHistoryHtml);
  [...document.querySelectorAll('.fb-button')].forEach(el => {
    el.addEventListener('click', async function() {
      try {
        const chatFkey = await getFkeyFromChat();
        const chatMessage = getFeedbackString(answerUrl, el.id.split('-')[1]);
        await sendChatMessage(chatFkey, chatMessage);
      } catch(error) {
        handleEvent('❌ ' + error);
        return;
      }
      handleEvent('✔️ Feedback sent.');
    });
  });
})();