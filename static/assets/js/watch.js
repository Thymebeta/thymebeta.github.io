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
    var $playpause = $("#play-pause-btn");
    var $fullscreen = $("#fs-btn");
    var timeoutt

    function play(e) {
        $video.trigger('play');
        var i = $playpause.children().first();
        i.removeClass('fa-play');
        i.addClass('fa-pause');
        e.stopImmediatePropagation();
    }

    function pause(e) {
        $video.trigger('pause');
        var i = $playpause.children().first();
        i.removeClass('fa-pause');
        i.addClass('fa-play');
        e.stopImmediatePropagation();
    }

    function toggle_fs(e) {
        var elem = $video.parent().get(0);

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

    $video.parent().on('click touchstart', function (e) {
        $video.get(0).paused ? play(e) : pause(e);
    });
    $playpause.on('click touchstart', function (e) {
        $video.get(0).paused ? play(e) : pause(e);
    });
    $fullscreen.on('click touchstart', toggle_fs);
    $(".inner-controls").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
    });

    function hideControls() {
        if (!$video.get(0).paused) {
            $(".video-controls").css("opacity", "0");
        }
    }

    $(".video-controls").hover(function () {
        $(this).css('opacity', '1');
    }, hideControls);

    function resetTimer() {
        $(".video-controls").css("opacity", "1");
        clearTimeout(timeoutt);
        timeoutt = setTimeout(hideControls, 3000);
    }

    $(".video-area").on('mousemove click', resetTimer);

    $video.bind("timeupdate", videoTimeUpdateHandler);
    $bar.bind("mousemove", barMouseMoveHandler);
    $bar.bind("touch click", barMouseDownHandler);

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

        e.stopImmediatePropagation();
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

    function updateBufferWidth(end, percent) {
        $buffer.css({'left': (end * 100) + "%", 'width': (percent * 100) + "%"});
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

        // var time = video.currentTime;
        // var range = 0;
        var bf = video.buffered;
        //console.log(bf);

        /* while (!(bf.start(range) <= time && time <= bf.end(range))) {
            range += 1;
        } */
        var start = bf.start(0) / video.duration;
        var end = bf.end(bf.length - 1) / video.duration;

        updateBufferWidth(start, end - start);
        $timestamp.text(formatTimestamp(video.currentTime, video.duration));
    }

    setInterval(updateLoop, 50)
});
