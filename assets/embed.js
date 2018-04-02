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

$(function () {
    let sources = ["//clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", "//commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"];
    var $video = $("#video-stream");
    var clickH = "mousedown tap";
    var timeout_t;

    function loadSource(source) {
        let start_time = $video[0].currentTime;
        let playing = ($video[0].currentTime > 0 && !$video[0].paused && !$video[0].ended);
        let $buffering = $("#buffering");

        $buffering.show();
        $video[0].pause();
        $video.attr("src", source);
        $video[0].load();
        $video[0].currentTime = start_time;

        $video.on("loadeddata", function() {
            $buffering.hide();

            if (playing) {
                $video[0].play();
            }
        });

        console.log("Loaded", source);
    }

    let video = window.location.hash;
    if (!video) {
        loadSource(sources[0]);
        setTimeout(function () {
            loadSource(sources[1])
        }, 5000);
    } else {
        loadSource("//htcraft.ml/v/y/_0KAFzm9MJE");
    }

    function play(e) {
        $video[0].play();
        let i = $("#c-play-pause").children().first();
        i.removeClass('i-play');
        i.addClass('i-pause');
        e.stopImmediatePropagation();

        resetTimer();
    }
    function pause(e) {
        $video[0].pause();
        $("#video-controls").fadeIn(200);
        let i = $("#c-play-pause").children().first();
        i.removeClass('i-pause');
        i.addClass('i-play');
        if (e) {
            e.stopImmediatePropagation();
        }
    }

    $('#card-video-sec').on(clickH, function(e) {
        $video[0].paused ? play(e) : pause(e);
    }).on("dblclick", function(e) {
        e.target = $("#c-full-screen");
        toggle_fs(e);
    }).on(clickH + ' pointermove', resetTimer);
    $("#c-play-pause").on(clickH, function(e) {
        $video[0].paused ? play(e) : pause(e);
    });
    $("#c-full-screen").on(clickH, toggle_fs);
    $("#inner-controls").on(clickH, function(e) {
        e.stopImmediatePropagation();
    });
    $("#c-seek-bar").on(clickH, barMouseDownHandler).on("pointermove", barMouseMoveHandler);

    function hideControls() {
        $("#video-controls").fadeOut(200);
    }
    $("#video-controls").hover(function(){
        $(this).fadeIn(200);
    }, hideControls);

    function resetTimer() {
        $("#video-controls").fadeIn(200);

        clearTimeout(timeout_t);
        timeout_t = setTimeout(hideControls, 3000);
    }
    resetTimer();

    function barMouseDownHandler(e) {
        var $this = $(this);
        var x = e.pageX - $this.offset().left;
        var percent = x / $this.width();
        updateProgressWidth(percent);
        updateVideoTime(percent);

        e.stopImmediatePropagation();
    }
    function updateScrubberWidth(percent) {
        $("#c-sb-scrub").width((percent * 100) + "%");
    }
    function updateBufferWidth(end, percent) {
        $("#c-sb-buff").css({'left': (end * 100) + "%", 'width': (percent * 100) + "%"});
    }
    function barMouseMoveHandler(e) {
        let $this = $(this);
        let x = e.pageX - $this.offset().left;
        let percent = x / $this.width();
        updateScrubberWidth(percent);
    }
    function updateVideoTime(percent) {
        $video[0].currentTime = percent * $video[0].duration;
    }
    function videoTimeUpdateHandler() {
        let percent = $video[0].currentTime / $video[0].duration;
        updateProgressWidth(percent);
    }
    function updateProgressWidth(percent) {
        $("#c-sb-prog").width((percent * 100) + "%");
        $("#c-sb-handle").css({left: (percent * 100) + "%"})
    }

    $video.on("timeupdate", videoTimeUpdateHandler);

    let checkInterval = 50.0;
    let lastPlayPos = 0;
    let currentPlayPos = 0;
    let bufferingDetected = false;

    setInterval(updateLoop, checkInterval);
    function checkBuffering() {

        currentPlayPos = $video[0].currentTime;

        let offset = (checkInterval - 20) / 1000;
        if (!bufferingDetected && currentPlayPos < (lastPlayPos + offset) && !$video[0].paused) {
            $("#buffering").show(); bufferingDetected = true;
        }
        if (bufferingDetected && currentPlayPos > (lastPlayPos + offset) && !$video[0].paused) {
            $("#buffering").hide(); bufferingDetected = false;
        }
        lastPlayPos = currentPlayPos;
    }
    function updateLoop() {
        checkBuffering();

        let duration = $video[0].duration;
        let time = $video[0].currentTime;
        if ($video[0].buffered.length && !bufferingDetected) {
            let range = 0;
            let bf = $video[0].buffered;
            if (time < duration) {
                try {
                    while (!(bf.start(range) <= time && time <= bf.end(range))) {
                        range++;
                    }
                    let start = bf.start(range) / duration;
                    let end = bf.end(range) / duration;
                    updateBufferWidth(start, end - start);
                } catch (IndexSizeError) {
                    // The solution to a problem is usually the easiest one.
                    //  - GLaDOS
                }
            }
        }
        $("#timestamp").text(formatTimestamp(time, duration));
    }
});