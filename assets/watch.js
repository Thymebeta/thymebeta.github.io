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

$().ready(function () {
  var $video = $("#main-video");
  var $bar = $(".c-seek-bar");
  var $scrubber = $(".c-sb-scrub");
  var $progress = $(".c-sb-prog");
  var $buffer = $(".c-sb-buff");
  var $handle = $(".c-sb-handle");
  var $timestamp = $("#timestamp");

  $video.bind("timeupdate", videoTimeUpdateHandler);
  $bar.bind("mousemove", barMouseMoveHandler);
  $bar.bind("mousedown", barMouseDownHandler);

  var vid = document.getElementById("main-video");
  if (vid.addEventListener) {
      vid.addEventListener("timeupdate", videoTimeUpdateHandler, false);
  } else if (vid.attachEvent) {
      vid.attachEvent("ontimeupdate", videoTimeUpdateHandler);
  }

  function videoTimeUpdateHandler(e) {
      var video = $video.get(0);
      var percent = video.currentTime / video.duration;
      updateProgressWidth(percent);

  }

  function barMouseDownHandler(e) {
      var $this = $(this);
      var x = e.pageX - $this.offset().left;
      var percent = x / $this.width();
      updateProgressWidth(percent);
      updateVideoTime(percent);
  }
  function barMouseMoveHandler(e) {
      var $this = $(this);
      var x = e.pageX - $this.offset().left;
      var percent = x / $this.width();
      updateScrubberWidth(percent);
  }

  function updateScrubberWidth(percent) {
      $scrubber.width((percent * 100) + "%");
  }
  function updateBufferWidth(percent) {
      $buffer.width((percent * 100) + "%");
  }
  function updateProgressWidth(percent) {
      $progress.width((percent * 100) + "%");
      $handle.css({left: (percent * 100) + "%"})
  }

  function updateVideoTime(percent) {
    var video = $video.get(0);
    video.currentTime = percent * video.duration;
  }

  function updateLoop() {
    var video = $video.get(0);
    var percent = video.buffered.end(0) / video.duration;
    updateBufferWidth(percent);
    $timestamp.text(formatTimestamp(video.currentTime, video.duration));
  }
  setInterval(updateLoop, 50)
});
