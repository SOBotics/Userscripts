// ==UserScript==
// @name         Sentinel Reporter
// @namespace    https://github.com/SOBotics
// @version      1.2.0
// @description  Quick feedback to Natty/Sentinel directly from Sentinel's post page
// @author       Filnor
// @contributor  geisterfurz007
// @include      https://sentinel.erwaysoftware.com/posts/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/SOBotics/Userscripts/SentinelReporter/raw/master/SentinelReporter.user.js
// ==/UserScript==

const room = 111347;
const test_room = 167908;
const sebotics = 54445;

const feedbackString = "@Natty feedback ";

(function() {

	'use strict';

	if (typeof GM !== 'object') {
		GM = {};
	}

	if (typeof GM_xmlhttpRequest === 'function' && !GM.xmlHttpRequest) {
		GM.xmlHttpRequest = GM_xmlhttpRequest;
	}

    GM_addStyle(".fb-button { background: none; border: 0px solid black; }");
    
    window.addEventListener("click", ev => {
        if (ev.target.id == "feedback-tp") {
            addFeedback();
        } else if (ev.target.id == "feedback-fp") {
            addFeedback("fp");
        } else if (ev.target.id == "feedback-ne") {
            addFeedback("ne");
        } else {

        }
    });

    addFeedbackButtons();
})();

function addFeedback(feedback_type = "tp") {
	//Get post's URL
	var answerUrl = $("div.col-md-offset-1.col-md-10 a").attr("href");
	var index = answerUrl.lastIndexOf("/");
	var answerId = answerUrl.substring(index + 1);


	GM.xmlHttpRequest({
		method: 'GET', 
		url: 'http://logs.sobotics.org/napi/api/feedback/' + answerId + (isAUFeedback() ? '/au' : ''),
		onload: function (samserverResponse) {
		  if (samserverResponse.status !== 200) {
				alert('Error while reporting: status ' + samserverResponse.status);
				return;
		  }
			sendChatMessage(`${feedbackString} ${answerUrl} ${feedback_type}`);
			$("#feedback-line").html("Feedback sent.");
		},
		onerror: function (samserverResponse) {
		  alert('Error while reporting: ' + samserverResponse.responseText);
		}
        });
}

function addFeedbackButtons(preSelector) {
	preSelector = preSelector || "";
	preSelector = preSelector.trim() + " ";
    $($($("div.col-md-offset-1.col-md-10 a")[0]).parent()).after('<p id="feedback-line"><b>Add feedback:</b> <button type="button" class="fb-button" id="feedback-tp" title="tp - true positive">✔️</button> <button type="button" class="fb-button" id="feedback-fp" title="fp - false positive">❌</a> <button type="button" class="fb-button" id="feedback-ne" title="ne - needs editing">✏️</a></p>');
}

function sendChatMessage(msg) {
  var roomURL = getChatRequestURL('rooms');
  GM.xmlHttpRequest({
    method: 'GET',
    url: roomURL,
    onload: function (response) {
      var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
      GM.xmlHttpRequest({
        method: 'POST',
        url: getChatRequestURL('chats') + '/messages/new',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'text=' + encodeURIComponent(msg.trim()) + '&fkey=' + fkey,
        onload: function (r) {
        }
      });
    }
  });
}

function isAUFeedback() {
   return !!$("h3 a").attr("href").match(/https?:\/\/(www\.)?askubuntu.*/);
}

function getChatRequestURL(apiTarget) {
    var auFeedback = isAUFeedback();
    var result = 'https://chat.';
    result += auFeedback ? 'stackexchange' : 'stackoverflow';
    result += '.com/' + apiTarget + '/';
    result += auFeedback ? sebotics : room;
    return result;
}
