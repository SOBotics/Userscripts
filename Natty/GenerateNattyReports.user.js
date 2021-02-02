// ==UserScript==
// @name        Generate Natty Reports
// @namespace   https://github.com/SOBotics
// @version     1.0.0
// @author      double-beep
// @match       https://chat.stackoverflow.com/rooms/111347/*
// @description Enables you to generate a reports.sobotics.org link directly from the SOBotics chat room
// @updateURL   https://github.com/SOBotics/Userscripts/raw/master/Natty/GenerateNattyReports.user.js
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Natty/GenerateNattyReports.user.js
// @run-at      document-body
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       GM_openInTab
// @connect     logs.sobotics.org
// @connect     reports.sobotics.org
// ==/UserScript==
/* globals toastr, CHAT */

(async function() {
  'use strict';

  const currentRoomUser = CHAT.RoomUsers.current();
  const canSeeDeletedPosts = currentRoomUser.reputation >= 10000;
  const reportsApiUrl = 'https://reports.sobotics.org/api/v2/report/create';
  const napiUrl = 'https://logs.sobotics.org/napi/api/reports/all';
  const appName = 'a userscript';
  const appUrl = 'https://github.com/SOBotics/Userscripts';

  function getReportsUrl(reportsJson) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: reportsApiUrl,
        data: JSON.stringify(reportsJson),
        headers:  {
          'Content-Type': 'application/json'
        },
        onload: function(response) {
          if (response.status === 200) {
            const jsonResponse = JSON.parse(response.responseText);
            resolve(jsonResponse.reportURL);
          } else {
            reject(`Failed to get the reports URL from reports.sobotics.org with error ${response.status}. See console for more details.`);
            console.error(response);
          }
        },
        onerror: function(errorResponse) {
          reject(errorResponse);
        }
      });
    });
  }

  function getAllNattyReports() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: napiUrl,
        onload: function(response) {
          const parsedResponse = JSON.parse(response.responseText);
          if (parsedResponse.message === 'success') {
            resolve(parsedResponse);
          } else {
            reject(response);
          }
        },
        onerror: function(error) {
          reject(error);
        }
      });
    });
  }

  function validateOptions() {
    const reportsToFetch = document.querySelector('#natty-reports-options-number').value;
    const amount = Number(document.querySelector('#natty-reports-amount').innerHTML);
    const numberReportsToFetch = Number(reportsToFetch);
    if (!reportsToFetch) {
      toastr.error('The number of reports to fetch was not provided.');
      return;
    } else if (!numberReportsToFetch || numberReportsToFetch < 0) {
      toastr.error('The number of reports to fetch is either 0 or invalid.');
      return;
    } else if (reportsToFetch > amount) {
      toastr.error('Number of reports to fetch is larger than the number of current reports.');
      return;
    }
    return true;
  }

  function getJsonObjectToPost(jsonReports, isSentinel) {
    const jsonToReturn = {
      appName: appName,
      appURL: appUrl,
      fields: []
    };

    jsonReports.forEach(report => {
      const reasonNames = report.reasons.map(reason => reason.reasonName).join(', ');
      const postId = report.name;
      const answerLink = isSentinel ? 'https://sentinel.erwaysoftware.com/posts/aid/' + postId : report.link;
      const naaScore = report.naaValue;
      const dateIso = new Date(report.timestamp).toISOString().replace(/.\d+Z/, '');

      const titleJson = { id: 'title', name: postId, value: answerLink, type: 'link' };
      const scoreJson = { id: 'score', name: 'NAA Score', value: naaScore };
      const reasonsJson = { id: 'reasons', name: 'Reasons', value: reasonNames };
      const dateJson = { id: 'date', name: 'Date', value: dateIso, type: 'date' };

      const fieldsArray = [];
      fieldsArray.push(titleJson, scoreJson, reasonsJson, dateJson);
      jsonToReturn.fields.push(fieldsArray);
    });

    return jsonToReturn;
  }

  async function handleGenerateLinkButton() {
    if (!validateOptions()) return;
    const numberOfReports = Number(document.querySelector('#natty-reports-options-number').value);
    const fetchFromBack = document.querySelector('#natty-reports-option-back').checked;
    const fetchFromSentinel = document.querySelector('#natty-reports-option-sentinel').checked;
    let reports;
    try {
      reports = await getAllNattyReports();
    } catch(error) {
      toastr.error('An error occurred while trying to fetch reports from logs.sobotics.org. See console for more details.');
      console.error(error);
      return;
    }

    const jsonObject = getJsonObjectToPost(reports.items.splice(fetchFromBack ? (reports.items.length - numberOfReports) : 0, numberOfReports), fetchFromSentinel);
    try {
      const reportsUrl = await getReportsUrl(jsonObject);
      GM_openInTab(reportsUrl, true);
      toastr.success('Link opened in a new tab.');
      return;
    } catch(error) {
      toastr.error(error);
    }

    toastr.error('Failed to open link in a new tab.');
  }

  function updateReportCount() {
    setTimeout(() => getAllNattyReports().then(reports => document.querySelector('#natty-reports-amount').innerHTML = reports.items.length), 3000);
  }

  async function addUserscriptHtml() {
    let reports;
    try {
      reports = await getAllNattyReports();
    } catch(error) {
      toastr.error('An error occurred while trying to fetch reports from logs.sobotics.org. See console for more details.');
      console.error(error);
      return;
    }

    const popupHtml = `
<div class="input-hint-container" id="natty-reports-options-containter" style="display: none;">
  <div class="input-hint">
    <div>
      Reports to fetch <input id="natty-reports-options-number" type="number" min="0" style="width: 50px"><br>
      <label><input type="checkbox" id="natty-reports-option-back">Fetch from the back of the list.</label><br>
      <label><input type="checkbox" id="natty-reports-option-sentinel">Fetch from Sentinel.</label><br>
      <button class="button" id="natty-reports-generate">Generate & open in a new tab!</button>&nbsp;&nbsp;
      <span id="natty-reports-amount">${reports.items.length}</span> items total
    </div>
  </div>
</div>`;
    document.querySelector('#input-area table').insertAdjacentHTML('beforebegin', popupHtml);
    if (!reports.items.length) { // 0 reports; nothing to do
      document.querySelector('#natty-reports-generate').disabled = true;
    }
    if (!canSeeDeletedPosts) {
      // <10k can't see deleted posts, so enable Sentinel by default
      const sentinelOption = document.querySelector('#natty-reports-option-sentinel');
      sentinelOption.checked = true;
      sentinelOption.disabled = true;
    }
    document.querySelector('#natty-reports-generate').addEventListener('click', handleGenerateLinkButton);
  }

  await addUserscriptHtml();

  const getReportLinkButton = document.createElement('button');
  getReportLinkButton.classList.add('button');
  getReportLinkButton.id = 'natty-reports-get-links';
  getReportLinkButton.innerHTML = 'Get report link';
  const brElement = document.createElement('br');
  const buttonsGroup = document.querySelector('#chat-buttons');
  buttonsGroup.appendChild(brElement);
  buttonsGroup.appendChild(getReportLinkButton);

  const optionsContainer = document.querySelector('#natty-reports-options-containter');
  getReportLinkButton.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', event => {
    if (!optionsContainer.contains(event.target) && event.target !== document.querySelector('#natty-reports-get-links')) optionsContainer.style.display = 'none';
  });
  CHAT.addEventHandlerHook(updateReportCount);

  GM_addStyle(`
.input-hint-container {
  top: 93%;
  left: 650px;
  position: fixed;
}

.input-hint {
  padding: 10px !important;
}`);
})();