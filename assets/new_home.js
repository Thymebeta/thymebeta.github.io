function zfill(number, places) {
  number = Math.floor(number).toString();
  var zero = places - number.length + 1;
  return new Array(+(zero > 0 && zero)).join("0") + number;
}
function formatTimestamp(position, duration) {
  var p_days = Math.floor(position / 86400);
  position = position - (p_days * 86400);
  var p_hours = Math.floor(position / 3600);
  position = position - (p_hours * 3600);
  var p_minutes = zfill(Math.floor(position / 60), 2);
  var p_seconds = zfill(position - (p_minutes * 60), 2);

  var d_days = Math.floor(duration / 86400);
  duration = duration - (d_days * 86400);
  var d_hours = Math.floor(duration / 3600);
  duration = duration - (d_hours * 3600);
  var d_minutes = zfill(Math.floor(duration / 60), 2);
  var d_seconds = zfill(duration - (d_minutes * 60), 2);

  if (d_days) {
    return p_days + ':' + p_hours + ':' + p_minutes + ':' + p_seconds + ' / ' +
           d_days + ':' + d_hours + ':' + d_minutes + ':' + d_seconds;
  } else if (d_hours) {
    return p_hours + ':' + p_minutes + ':' + p_seconds + ' / ' +
           d_hours + ':' + d_minutes + ':' + d_seconds;
  } else {
    return p_minutes + ':' + p_seconds + ' / ' +
           d_minutes + ':' + d_seconds;
  }
}
function toggle_fs(e) {
  var elem = $(e.target).parent().parent().parent().get(0);

  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  e.stopImmediatePropagation();
}

$().ready(function() {
  var temp_s = $("script#minitemp").html();
  var MINI_TEMP = Handlebars.compile(temp_s);
  temp_s = $("script#fulltemp").html();
  var FULL_TEMP = Handlebars.compile(temp_s);

  Handlebars.registerHelper('commentHelper', function(children) {
    var template = Handlebars.compile($('script#commenttemp').html());
    return template({comments: children}).slice(2);
  });
  Handlebars.registerHelper('videoHelper', function(url) {
    var template = Handlebars.compile($('script#videotemp').html());
    return template({videourl: url}).slice(2);
  });

  temp_s = $("script#commenttemp").html();
  var COMMENT_TEMP = Handlebars.compile(temp_s);

  $(".comment-tog").text("SHOW COMMENTS");
  $(".comments").hide();

  $("div").on("click touchstart", ".comments-tog", function() {
    var $cblock = $(this).parent().children(".comments").first();
    if ($cblock.is(":visible")) {
      $cblock.hide();
      $(this).text("SHOW COMMENTS");
    } else {
      $cblock.show();
      $(this).text("HIDE COMMENTS");
    }
  });
  $("div").on("click touchstart", ".mini-show-more", function() {
    var $dblock = $(this).parent().parent().children(".description").first().children(".more").first();
    if ($dblock.is(":visible")) {
      $dblock.hide();
      $(this).text("SHOW MORE");
    } else {
      $dblock.show();
      $(this).text("SHOW LESS");
    }
  });

  function appendShortBlock(title, author, views, desc, descmore, pfp, thumb) {
    ne = MINI_TEMP({
      title: title,
      author: author,
      views: views + " Views",
      desc: desc,
      descmore: descmore,
      pfp: pfp,
      thumb: thumb
    });
    $("#central-column").append(ne.slice(2));
  }
  function appendLargeBlock(title, author, views, pfp, videourl) {
    ne = FULL_TEMP({
      title: title,
      author: author,
      views: views + " Views",
      pfp: pfp,
      videourl: videourl,
      comments: [
        {auth: 'hi', root: true, time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: []}]}, {auth: 'hi', time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: []}]}]},
        {auth: 'hi', root: true, time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: []}]}, {auth: 'hi', time: 'today', content: 'no', children: [{auth: 'hi', time: 'today', content: 'no', children: []}]}]}
      ]
    });
    $("#central-column").append(ne.slice(2));
  }

  appendShortBlock('a', 'b', 'c', 'd', 'e', "https://cdn.discordapp.com/attachments/399292546854944772/422066928475963395/DXlCmv9VAAA9CDW.jpg", "https://files.catbox.moe/nrbq69.jpg");
  appendShortBlock('e', 'd', 'c', 'b', 'a', "https://files.catbox.moe/nrbq69.jpg", "https://cdn.discordapp.com/attachments/399292546854944772/422066928475963395/DXlCmv9VAAA9CDW.jpg");
  appendLargeBlock('a', 'b', 'c', "https://cdn.discordapp.com/attachments/399292546854944772/422066928475963395/DXlCmv9VAAA9CDW.jpg", "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4");
  appendLargeBlock('a', 'b', 'c', "https://cdn.discordapp.com/attachments/399292546854944772/422066928475963395/DXlCmv9VAAA9CDW.jpg", "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4");
  appendLargeBlock('a', 'b', 'c', "https://cdn.discordapp.com/attachments/399292546854944772/422066928475963395/DXlCmv9VAAA9CDW.jpg", "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4");

  /*var $video = $("#main-video");
  var $bar = $(".c-seek-bar");
  var $scrubber = $(".c-sb-scrub");
  var $progress = $(".c-sb-prog");
  var $buffer = $(".c-sb-buff");
  var $handle = $(".c-sb-handle");
  var $timestamp = $("#timestamp");
  var $playpause = $("#play-pause-btn");
  var $fullscreen = $("#fs-btn");*/
  var timeoutt

  function play(e) {
    $("video").each(function() {
      pause({target: this, stopImmediatePropagation: function() {}});
    });
    var $video = $(e.target).parent().children('video').first();
    $video.trigger('play');
    var $playpause = $(e.target).parent().children(".video-controls").first().children(".inner-controls").first().children(".c-play-pause").first();
    var i = $playpause.children().first();
    i.removeClass('fa-play');
    i.addClass('fa-pause');
    e.stopImmediatePropagation();
  }
  function pause(e) {
    var $video = $(e.target).parent().children('video').first();
    $video.trigger('pause');
    $vc = $(e.target).parent().children(".video-controls").first();
    $vc.css({'opacity': 1});
    var $playpause = $vc.children(".inner-controls").first().children(".c-play-pause").first();
    var i = $playpause.children().first();
    i.removeClass('fa-pause');
    i.addClass('fa-play');
    e.stopImmediatePropagation();
  }

  $('div').on('click touchstart', '.card-video-sec', function(e) {
    var $video = $(e.target).parent().children('video').first();
    $video.get(0).paused ? play(e) : pause(e);
  });
  $('div').on('click touchstart', '.c-play-pause', function(e) {
    var $video = $(e.target).parent().parent().parent().children('video').first();
    e.target = $(e.target).parent().parent();
    $video.get(0).paused ? play(e) : pause(e);
  });
  $("div").on("click touchstart", ".c-full-screen", toggle_fs);
  $("div").on('click touchstart', ".inner-controls", function(e) {
    e.stopImmediatePropagation();
  });

  function hideControls() {
    var video = $(this).parent().children('video').first().get(0);
    if (video.currentTime == 0 | !video.paused) {
      $(this).css("opacity", "0");
    }
  }
  $(".video-controls").hover(function(){
    $(this).css('opacity', '1');
  }, hideControls);


  function resetTimer() {
    //$(".video-controls").css("opacity", "1");
    clearTimeout(timeoutt);
    timeoutt = setTimeout(hideControls, 3000);
  }
  $("div").on('mousemove click', ".video-area", resetTimer);

  $("div").on("touch click", ".c-seek-bar", barMouseDownHandler)

  function barMouseDownHandler(e) {
    var $this = $(this);
    var x = e.pageX - $this.offset().left;
    var percent = x / $this.width();
    var $sb = $this.parent()
    updateProgressWidth($this, percent);
    updateVideoTime($this.parent().parent().children("video").first().get(0), percent);

    e.stopImmediatePropagation();
  }
  function updateScrubberWidth($sb, percent) {
    $sb.children(".c-sb-scrub").width((percent * 100) + "%");
  }
  function updateBufferWidth($sb, end, percent) {
    $sb.children(".c-sb-buff").css({'left': (end * 100) + "%", 'width': (percent * 100) + "%"});
  }
  function barMouseMoveHandler(e) {
      var $this = $(this);
      var x = e.pageX - $this.offset().left;
      var percent = x / $this.width();
      updateScrubberWidth($this, percent);
  }
  function updateVideoTime(video, percent) {
    video.currentTime = percent * video.duration;
  }
  function videoTimeUpdateHandler(e) {
    var video = $(this).get(0);
    var percent = video.currentTime / video.duration;
    updateProgressWidth($(this).parent().children(".video-controls").first().children(".c-seek-bar").first(), percent);
  }
  function updateProgressWidth($sb, percent) {
    $sb.children(".c-sb-prog").width((percent * 100) + "%");
    $sb.children(".c-sb-handle").css({left: (percent * 100) + "%"})
  }

  $("video").on("timeupdate", videoTimeUpdateHandler)
  $("div").on("mousemove", ".c-seek-bar", barMouseMoveHandler)

  function updateLoop() {
    $("video").each(function() {
      if (this.buffered.length) {
        var percent = this.buffered.end(0) / this.duration;
        var time = this.currentTime;
        var range = 0;
        var bf = this.buffered;
        if (time < this.duration) {
          while(!(bf.start(range) <= time && time <= bf.end(range))) {
              range += 1;
          }
          var start = bf.start(range) / this.duration;
          var end = bf.end(range) / this.duration;
          updateBufferWidth($(this).parent().children(".video-controls").first().children(".c-seek-bar").first(), start, end - start);
        }
      }
      $(this).parent().children(".video-controls").first().children().last().children(".timestamp").text(formatTimestamp(this.currentTime, this.duration));
    });
  }
  setInterval(updateLoop, 150);
});
