// ==UserScript==
// @name          Stack Exchange Flag Tracker
// @namespace     https://so.floern.com/
// @version       1.2
// @description   Tracks flagged posts on Stack Exchange.
// @author        Floern
// @contributor   double-beep
// @include       /^https?:\/\/(?:[^/.]+\.)*(?:stackexchange\.com|stackoverflow\.com|serverfault\.com|superuser\.com|askubuntu\.com|stackapps\.com|mathoverflow\.net)\/(?:q(?:uestions)?)/
// @exclude       *://chat.stackoverflow.com/*
// @exclude       *://chat.stackexchange.com/*
// @exclude       *://chat.*.stackexchange.com/*
// @exclude       *://api.*.stackexchange.com/*
// @exclude       *://data.stackexchange.com/*
// @connect       so.floern.com
// @grant         GM_xmlhttpRequest
// @run-at        document-end
// @updateURL     https://github.com/SOBotics/Userscripts/raw/master/GenericBot/flagtracker.user.js
// @downloadURL   https://github.com/SOBotics/Userscripts/raw/master/GenericBot/flagtracker.user.js
// ==/UserScript==
/* globals StackExchange */

(function() {
  if (!StackExchange.options.user.isRegistered) return; // user is not logged in
  const key = 'Cm45BSrt51FR3ju';
  const myProfileElement = document.querySelector('.my-profile .gravatar-wrapper-24');
  const flaggername = myProfileElement ? myProfileElement.title : null;
  const sitename = window.location.hostname;
  const flagTrackerButtonHtml = '<div class="grid--cell">'
                              + '  <button class="flag-tracker-link s-btn s-btn__link" title="register this post to be tracked">track</button>'
                              + '</div>';

  function computeContentHash(postContent) {
    if (!postContent) return 0;
    var hash = 0;
    for (var i = 0; i < postContent.length; ++i) {
      hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }

  function addXHRListener(callback) {
    let open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('load', callback.bind(null, this), false);
      open.apply(this, arguments);
    };
  }

  function sendTrackRequest(postId, contentHash, flagTrackerButtonElement) {
    if (!flaggername || !postId || !contentHash) return; // one of these doesn't exist for whatever reason; return
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://so.floern.com/api/trackpost.php',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: 'key=' + key
          + '&postId=' + postId
          + '&site=' + sitename
          + '&contentHash=' + contentHash
          + '&flagger=' + encodeURIComponent(flaggername),
      onload: function (response) {
        if (response.status !== 200) {
          StackExchange.helpers.showToast('Flag Tracker Error: Status ' + response.status + '. See console for details', { type: 'danger' });
          console.error(response.responseText);
          return;
        }
        flagTrackerButtonElement.classList.add('flag-tracked');
        flagTrackerButtonElement.innerHTML = 'tracked';
      },
      onerror: function (response) {
        StackExchange.helpers.showToast('Flag Tracker Error. See console for details.', { type: 'danger' });
        console.error(response.responseText);
      }
    });
  }

  function trackFlag(element) {
    const postId = element.querySelector('.js-share-link').href.split('/')[4];
    const postContent = element.closest('.post-layout--right').querySelector('.s-prose').innerHTML.trim();
    const contentHash = computeContentHash(postContent);
    sendTrackRequest(postId, contentHash, element.querySelector('.flag-tracker-link'));
  }

  function handlePosts() {
    [...document.querySelectorAll('.post-layout .js-post-menu')].forEach(element => {
      if (element.innerText.match('track')) return; // element already exists
      element.children[0].insertAdjacentHTML('beforeend', flagTrackerButtonHtml);
      element.children[0].querySelector('.flag-tracker-link').addEventListener('click', () => trackFlag(element));
    });
  }

  addXHRListener(xhr => {
    if (/ajax-load-realtime/.test(xhr.responseURL)) handlePosts();
  });

  addXHRListener(function(xhr) {
    let matches = /flags\/posts\/(\d+)\/add\//.exec(xhr.responseURL);
    if (matches !== null && xhr.status === 200) {
      const postId = matches[1];
      const postIsQuestion = document.querySelector('.question').getAttribute('data-questionid') == postId;
      const element = postIsQuestion ? document.querySelector('.question .js-post-menu') : document.querySelector(`#answer-${postId} .js-post-menu`);
      trackFlag(element);
    }
  });

  handlePosts();
})();