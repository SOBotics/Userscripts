/* globals CHAT */

// eslint-disable-next-line no-unused-vars
class ControlHelper {
  constructor(botId, phrase, buttonsHtml) {
    this.botId = botId;
    this.phrase = phrase;
    this.buttonsHtml = buttonsHtml;
    this.roomId = CHAT.CURRENT_ROOM_ID;
    this.chatFkey = window.fkey().fkey;
  }

  generateReply(toReplyId, text) {
      return `:${toReplyId} ${text}`;
  }

  async sendMessageToChat(messageText) {
    const parameters = new FormData();
    parameters.append('text', messageText);
    parameters.append('fkey', this.chatFkey);
    await fetch(`/chats/${this.roomId}/messages/new`, {
      method: 'POST',
      body: parameters
    });
  }

  getMessageIdFromElement(element) {
    return element.parentElement.parentElement.parentElement.id.split('-')[1];
  }

  decorateChatMessage(messageContentElement) {
    messageContentElement.insertAdjacentHTML('afterbegin', this.buttonsHtml);
    [...messageContentElement.children[0].children].forEach(el => {
      el.addEventListener('click', event => {
        event.preventDefault();
        const messageId = this.getMessageIdFromElement(el);
        this.sendMessageToChat(this.generateReply(messageId, el.className.split('-')[1]));
      });
    });
  }

  decorateNotDecoratedMessages() {
    [...document.querySelectorAll(`.user-${this.botId}.monologue .message .content`)].forEach(el => {
      if (!el.innerHTML.match(this.phrase) || el.children[0].classList.contains('beli-controls-buttons')) return;
      this.decorateChatMessage(el);
    });
  }

  newChatEventOccured({room_id, event_type, user_id, content, message_id}) {
    // Event should happen in the current room, it should be a new message (type 1) or an edit (type 2). It should be a report.
    if (!(room_id == this.roomId && event_type <= 2 && user_id == this.botId && content && content.match(this.phrase))) return;
    setTimeout(() => this.decorateChatMessage(document.querySelector(`#message-${message_id} .content`)), 0); // hacky setTimeout; element is not found otherwise
  }
}