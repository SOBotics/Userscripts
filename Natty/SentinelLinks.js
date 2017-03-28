// ==UserScript==
// @name        Sentinel Links 
// @description Adds a Sentinel link to answers
// @namespace   https://github.com/SOBotics/Userscripts
// @author      Bhargav
// @match       *://*.stackoverflow.com/*
// @version     0.01010
// @downloadURL https://github.com/SOBotics/Userscripts/raw/master/Natty/SentinelLinks.js
// ==/UserScript==


(function(){
  $(".post-menu").each ( function (index) {
      var thisObj = $(this)
    var postLink  = thisObj.find('a[class="short-link"]').attr("href");
      if(postLink && postLink.indexOf('a')>=0){
      thisObj.append('<span class="lsep">|</span><a href="http://sentinel.erwaysoftware.com/posts/aid/' + postLink.split("/")[2]  +'">sentinel</a>');
    }
  } );
}());
