// ==UserScript==
// @name        Sentinel Links 
// @namespace   https://github.com/SOBotics/Userscripts
// @version     0.01011
// @description Adds a Sentinel link to answers
// @author      Bhargav
// @match       *://*.stackoverflow.com/*
// @grant       none
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelLinks.js
// ==/UserScript==


(function(){
  $(".js-share-link").parent().parent().each ( function (index) {
      var thisObj = $(this);
      var postLink  = thisObj.find('a[class="short-link"]').attr("href");
      if(postLink && postLink.indexOf('a')>=0){
      thisObj.append('<span class="lsep">|</span><a href="http://sentinel.erwaysoftware.com/posts/aid/' + postLink.split("/")[2]  +'">sentinel</a>');
    }
  } );
}());
