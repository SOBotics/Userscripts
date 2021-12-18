// ==UserScript==
// @name         Sentinel Reporter
// @namespace    https://github.com/SOBotics
// @version      1.5
// @description  Quick feedback to Natty directly from Sentinel's post page
// @author       Filnor
// @contributor  geisterfurz007
// @contributor  double-beep
// @include      https://sentinel.erwaysoftware.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelReporter.user.js
// @updateURL    https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelReporter.user.js
// ==/UserScript==

(function() {
    function init() {
        'use strict';

        function getFeedbackButton(type, title, icon) {
            const button = document.createElement('button');
            button.classList.add('fb-button');
            button.id = `feedback-${type}`
            button.title = `${type} - ${title}`;
            button.innerText = icon;
            button.type = 'button';

            return button;
        }

        const soboticsRoomId = 111347;
        const seboticsRoomId = 54445;
        const getFeedbackString = (postUrl, feedbackType) => `@Natty feedback ${postUrl} ${feedbackType}`;

        const answerUrl = document.querySelector('h3 a').href;
        const askubuntuRegex = /^https?:\/\/(www\.)?askubuntu/;
        const isAskUbuntuPost = askubuntuRegex.test(answerUrl);

        const chatHost = `chat.stack${isAskUbuntuPost ? 'exchange' : 'overflow'}.com`;
        const roomId = isAskUbuntuPost ? seboticsRoomId : soboticsRoomId;
        const postChatUrl = `https://${chatHost}/chats/${roomId}/messages/new`;
        const chatRoomUrl = `https://${chatHost}/rooms/${roomId}`;

        function handleEvent(text) {
            const newline = document.createElement('br');

            const eventSpan = document.querySelector('#sentinel-reporter-event-span');
            eventSpan.append(text, newline);
            eventSpan.parentElement.style.display = 'block';
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
                            parsedResponse.id && parsedResponse.time
                                ? resolve(true)
                            : reject('Failed to send chat message: conflict!'); // if both are null, it's a conflict
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
                        console.error(error);
                        reject(`Error ${error.status} while trying to fetch fkey from chat. See console for more details.`);
                    }
                });
            });
        }

        const feedbackWrapper = document.createElement('p');
        feedbackWrapper.id = 'feedback-line';

        const addFeedback = document.createElement('b');
        addFeedback.innerText = 'Add feedback:';

        const tpButton = getFeedbackButton('tp', 'true positive', '✔️');
        const fpButton = getFeedbackButton('fp', 'false positive', '❌');
        const neButton = getFeedbackButton('ne', 'needs editing', '✏️');

        feedbackWrapper.append(addFeedback, ' ', tpButton, fpButton, neButton);

        const eventHistoryHtml = document.createElement('div');
        eventHistoryHtml.classList.add('alert', 'alert-info');
        eventHistoryHtml.style.display = 'none';

        const eventHistorySpan = document.createElement('span');
        eventHistorySpan.id = 'sentinel-reporter-event-span';
        eventHistoryHtml.appendChild(eventHistorySpan);

        GM_addStyle('.fb-button { background: none; border: 0px solid black; }');

        document.querySelector('h3').after(feedbackWrapper); // insert buttons
        document.querySelector('#feedback-line').after(eventHistoryHtml);

        document.querySelectorAll('.fb-button').forEach(button => {
            button.addEventListener('click', async function() {
                const feedbackType = button.id.split('-')[1];

                try {
                    const chatFkey = await getFkeyFromChat();
                    const chatMessage = getFeedbackString(answerUrl, feedbackType);
                    await sendChatMessage(chatFkey, chatMessage);
                } catch(error) {
                    handleEvent(`❌ ${error}`);
                    return;
                }
                handleEvent('✔️ Feedback sent.');
            });
        });
    }

    const postsRegex = /\/posts\/\d+/;

    if (postsRegex.test(location.href)) init();
    document.addEventListener('turbolinks:load', () => {
        const newUrl = location.href;
        if (postsRegex.test(newUrl)) init();
    });
})();