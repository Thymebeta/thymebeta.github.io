REQUIRED_SCORE = 2

var passwd_score = 0;

$('#password').on("input", function () {
  var username = $("#username-field").val();
  var email = $("#email-field").val();
  var password = $('#password').val();
  var strength = zxcvbn(password, user_inputs=[username, email]);

  $("#password_icon").show();
  $("#password_error").html("Password must not be hunter2.");

  $("#password-strength-meter").val(strength.score);
  passwd_score = strength.score;

  var password2 = $('#password2').val();

  if (password2) {  // Don't complaing until they've started typing
    if (password != password2) {
      $("#password2_icon").show();
      $("#password2_error").html("Passwords don't match.");
      return;
    }

    $("#password2_icon").hide();
  }
});

$('#password2').on("input", function () {
  var password = $('#password').val();
  var password2 = $('#password2').val();

  if (password != password2) {
    $("#password2_icon").show();
    return;
  }

  $("#password2_icon").hide();
});

$("#form").on("submit", function () {
  var username = $("#username-field").val();
  var email = $("#email-field").val();
  var password = $("#password").val();
  var password2 = $("#password2").val();

  var passed_ = true;

  if (username.length == 0) {
    $("#username_icon").show();
    passed_ = false;
  } else {
    $("#username_icon").hide();
  }

  if (email.length == 0) {
    $("#email_icon").show();
    passed_ = false;
  } else {
    $("#email_icon").hide();
  }

  if (passwd_score < REQUIRED_SCORE) {
    passed_ = false;
  }

  if (password != password2) {
    $("#password2_icon").show();
    passed_ = false;
  } else {
    $("#password2_icon").hide();
  }

  return passed_;
});
