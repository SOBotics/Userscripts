// ==UserScript==
// @name         CopyPastor Reporter
// @version      1.0
// @description  Quick feedback to Guttenberg directly from CopyPastor's post page
// @author       double-beep
// @include      *://copypastor.sobotics.org/posts/*
// @downloadURL  https://github.com/SOBotics/Userscripts/raw/master/Guttenberg/CopypastorReporter.user.js
// @updateURL    https://github.com/SOBotics/Userscripts/raw/master/Guttenberg/CopypastorReporter.user.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
  const copypastorPostId = window.location.pathname.split('/').pop();
  const copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj'; // key copied from AF
  const feedbackButtonHtml = '<div class="container">'
                           + '  <p id="feedback-line">&nbsp;'
                           + '    <b>Add feedback:</b>'
                           + '    <button type="button" class="fb-button" id="tp">✔️</button>'
                           + '    <button type="button" class="fb-button" id="fp">❌</button>'
                           + '  </p>'
                           + '</div>';

  const getUsername = () => GM_getValue('username');
  const setUsername = value => GM_setValue('username', value);
  const getUserId = () => GM_getValue('user_id');
  const setUserId = value => GM_setValue('user_id', value);
  let username = getUsername(), userId = getUserId;

  const getHtmlAnchorEl = postId => `<a href="https://copypastor.sobotics.org/posts/${postId}">https://copypastor.sobotics.org/posts/${postId}</a><br>`;

  function sendFeedbackToCopyPastor(feedback_type, username, userId) {
    const chatProfileLink = 'https://chat.stackoverflow.com/users/' + userId;
    GM_xmlhttpRequest({
      method: 'POST',
      url: '/feedback/create',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `post_id=${copypastorPostId}&feedback_type=${feedback_type}&username=${username}&link=${chatProfileLink}&key=${copypastorKey}`
    });
  }

  function storeUserInformation() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://stackoverflow.com/users/current',
        onload: function(response) {
          if (!response.finalUrl.match(/\d+/)) { // should contain user's id to avoid errors
            reject('ERROR: CopyPastor Reporter: You must be logged in on Stack Overflow to send feedback to CopyPastor!');
          }
          const userIdUrl = response.finalUrl.split('/')[4], usernameUrl = response.finalUrl.split('/')[5];
          setUsername(usernameUrl);
          setUserId(userIdUrl);
          username = getUsername();
          userId = getUserId();
          resolve(true);
        }
      });
    });
  }

  function addLinksOnPendingPosts() {
    const pageContent = document.querySelector('pre').innerHTML;
    JSON.parse(pageContent).posts.forEach(postId => document.body.insertAdjacentHTML('beforeend', getHtmlAnchorEl(postId)));
  }

  async function initOnPost() {
    try {
      if (!username || !userId) await storeUserInformation(); // info doesn't exist; try getting it
    } catch(error) {
      console.error(error);
      return;
    }
    const double = document.querySelector('#double');
    double.previousElementSibling.remove();
    double.insertAdjacentHTML('beforebegin', feedbackButtonHtml); // insert buttons
    document.querySelectorAll('.fb-button').forEach(el => {
      el.addEventListener('click', function() {
        sendFeedbackToCopyPastor(this.id, username, userId);
        document.querySelector('#feedback-line').innerHTML = 'Feedback sent';
      });
    });
  }

  window.location.pathname.match(/\d+/) ? initOnPost() : addLinksOnPendingPosts();

    GM_addStyle(`
#feedback-line {
  margin-bottom: -5px;
}

.fb-button {
  background: none;
  border: 0px;
  cursor: pointer;
}`);
})();