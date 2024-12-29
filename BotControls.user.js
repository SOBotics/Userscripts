// ==UserScript==
// @name         Bot Controls
// @namespace    https://github.com/SOBotics
// @description  Simplifies the process of sending feedback to most SOBotics bots
// @author       double-beep
// @match        https://chat.stackoverflow.com/rooms/111347/*
// @match        https://chat.stackoverflow.com/rooms/167908/*
// @version      1.0.0
// @downloadURL  https://github.com/SOBotics/Userscripts/raw/master/BotControls.user.js
// @updateURL    https://github.com/SOBotics/Userscripts/raw/master/BotControls.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
/* globals CHAT */

(function () {
    'use strict';

    function intercept(callback) {
        const open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
            this.addEventListener('load', () => {
                if (!/messages\/\d+\/history/.test(this.responseURL)) return;
                callback();
            }, false);
            open.apply(this, arguments);
        };
    }

    class Control {
        constructor(botId, phrase, feedbacks) {
            this.botId = botId;
            this.phrase = phrase;
            this.feedbacks = feedbacks;

            this.roomId = CHAT.CURRENT_ROOM_ID;
            this.chatFkey = window.fkey().fkey;
        }

        generateReply(toReplyId, text) {
            return `:${toReplyId} ${text}`;
        }

        async sendMessageToChat(messageText) {
            const params = new FormData();
            params.append('text', messageText);
            params.append('fkey', this.chatFkey);

            await fetch(`/chats/${this.roomId}/messages/new`, {
                method: 'POST',
                body: params
            });
        }

        decorateChatMessage(element) {
            const messageId = element.closest('.message')?.id.split('-')[1];
            const container = document.createElement('span');
            container.classList.add(`controls-${this.botId}`, 'controls-container');

            container.append(' [ ');

            this.feedbacks.forEach((feedback, index) => {
                const anchor = document.createElement('a');
                anchor.classList.add(`${feedback}-${this.botId}`);
                anchor.href = '#';
                anchor.textContent = feedback;

                anchor.addEventListener('click', event => {
                    event.preventDefault();

                    const message = this.generateReply(messageId, feedback);
                    this.sendMessageToChat(message);
                });

                container.append(anchor);

                if (index !== this.feedbacks.length - 1) container.append(' | ');
            });

            container.append(' ] ');

            element.prepend(container);
        }

        decorateNotDecoratedMessages() {
            document.querySelectorAll(`.user-${this.botId}.monologue .message .content`)
                .forEach(el => {
                    if (!el.innerHTML.match(this.phrase) || el.querySelector('.controls-container')) return;

                    this.decorateChatMessage(el);
                });
        }

        runOnNewMessage({ room_id, event_type, user_id, content, message_id }) {
            if (room_id !== this.roomId // event happened in the current room
                || (event_type !== 1 && event_type !== 2) // new message posted/existing message edited
                || user_id !== this.botId // the author of the message is the bot in question
                || !content?.includes(this.phrase) // the new/edited message is a report
            ) return;

            setTimeout(() => {
                this.decorateChatMessage(document.querySelector(`#message-${message_id} .content`));
            }, 0); // hacky setTimeout; element is not found otherwise
        }

        init() {
            this.decorateNotDecoratedMessages();
            CHAT.addEventHandlerHook(event => this.runOnNewMessage(event));

            intercept(this.decorateNotDecoratedMessages.bind(this));
        }
    }

    const ready = CHAT.Hub.roomReady.fire;
    CHAT.Hub.roomReady.fire = function() {
        ready.apply(this, arguments);

        const natty = new Control(6817005, 'Link to Post', ['tp', 'fp', 'ne']);
        const queen = new Control(6294609, 'SCORE', ['tp', 'fp', 'nc', 'sk']);
        const generic = new Control(7481043, 'has been edited', ['untrack']);
        const belisarius = new Control(13903854, 'All revisions', ['tp', 'fp']);
        const guttenberg = new Control(7418352, 'is possible', ['k', 'f']);

        natty.init();
        queen.init();
        generic.init();
        belisarius.init();
        guttenberg.init();
    };
})();