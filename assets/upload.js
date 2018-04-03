$(function() {
    // NOTE: DO NOT LEAVE mp3 IN PROD CODE
    let FORMATS = ["mov", "mpeg4", "mp4", "avi", "wmv", "mpegps", "flv", "3gpp", "webm", "mp3"];

    let clickH = "mousedown tap";
    let upload_perc = 0;
    let target_file = undefined;

    $("#upload-region").on("drop", function (e) {
        target_file = e.originalEvent.dataTransfer.files[0];

        if (FORMATS.indexOf(target_file.name.split('.').slice(-1)[0]) === -1) {
            $("#ml-name").text(target_file.name + " is an invalid file.");
        } else {
            $("#ml-name").text(target_file.name + " selected");
            $("#continue-btn").removeClass("disabled");
        }

        e.preventDefault();
        return false;
    }).on("dragover", function(e) {
        e.preventDefault();
        return false;
    }).on("dragend", function(e) {
        e.preventDefault();
        return false;
    });

    $("#ml-ico, #ml-cap, #ml-sub").on(clickH, function(e) {
        $("#file-upload").trigger("click");

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    $("#file-upload").on("change", function() {
        let file = this.files[0];

        if (FORMATS.indexOf(file.name.split('.').slice(-1)[0]) === -1) {
            $("#ml-name").text(file.name + " is an invalid file.");
        } else {
            $("#ml-name").text(file.name + " selected");
            $("#continue-btn").removeClass("disabled");
        }
        target_file = file;
    });
    $("div").on(clickH, "#continue-btn:not(.disabled)", function(e) {
        $("#central-column").css({"max-width": "100%"});
        $("#upload-region").css({"min-height": "100%", "height": "100%"});
        $("#title").val(target_file.name);

        $("#upload-bar>span").text("Uploading | 0%");
        $("#u-bar-progress").text("Uploading | 0%")
                            .css({"width": "0"});

        setInterval(function() {
            $("#u-bar-progress").css({"width": upload_perc + "%"})
                                .text(target_file.name + " | " + upload_perc + "%");
            $("#upload-bar>span").text(target_file.name + " | " + upload_perc + "%");
            upload_perc ++;
            upload_perc = Math.min(upload_perc, 100);
        }, 100);

        $("#middle-logo").fadeOut(500);
        $("#uploading").fadeIn(500);

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    function listTags() {
        let tags = [];
        $(".tag").each(function() {
            let text = $(this).text();
            tags.push(text.substring(0, text.length - 1))
        });
        return tags;
    }
    $("#current-tag").on("keydown", function(e) {
        let tags = $("#tags");
        if (e.keyCode === 8) {
            if (this.selectionStart === 0 && this.selectionEnd === 0) {
                let child = tags.children(".tag").last();
                if (child) {
                    let text = child.text();
                    text = text.substring(0, text.length - 1);

                    $(this).val(text + $(this).val());
                    this.setSelectionRange(text.length, text.length);
                    child.remove()
                }
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        } else if (e.keyCode === 13 || e.key === "\n" || e.keyCode === 188 || e.key === ",") {
            let val = $(this).val().replace(/^\s+|\s+$/g, '');
            if (val && listTags().indexOf(val) === -1) {
                $("<span class=\"tag\">" + val + "<span class=\"tag-close\">×</span></span>")
                    .insertBefore('#tags>input');
            }
            $(this).val("");
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    });
    $(document).on(clickH, ".tag-close", function() {
        $(this).parent().remove();
    });

    $("#details-tab").on(clickH, function() {
        $("#privacy-dd").hide();
        $("#license-dd").hide();

        $("#title").show();
        $("#description").show();
        $("#tags").show();
        $("#details-tab").addClass("active");
        $("#privacy-tab").removeClass("active");
    });
    $("#privacy-tab").on(clickH, function() {
        $("#privacy-dd").show();
        $("#license-dd").show();
        $("#title").hide();
        $("#description").hide();
        $("#tags").hide();
        $("#details-tab").removeClass("active");
        $("#privacy-tab").addClass("active");
    });
});
