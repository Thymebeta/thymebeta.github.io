// TEMPLATES
var VCARD = `<div class="video-card">
  <div class="video-meta">
    <div class="video-title">{title}</div>
    <div class="video-author">{author}</div>
  </div>
  <div class="video-meta m-sub">
    <div class="video-views">{views} loops</div>
  </div>
  <div class="video-thumb" style="background-image: url('{thumb}')"></div>
</div>
`;
var VCARD_SKEL = `
<div class="video-card skel"></div>
`
var FEATURED_CLASS = ' featured-thymes';
var VROW = `<div class="row-header">{title}<span class="sub-heading">{sub}</span></div>
<div class="video-row{featured}">
  <div class="vbtn vbt-l"><i class="fa fa-chevron-left"></i></div>
  <div id="{c-id}"></div>
  <div class="vbtn vbt-r"><i class="fa fa-chevron-right"></i></div>
</div>
`;
var VROW_SKEL = `<span id="{id}"><div class="row-header skel"><span class="sub-heading"></span></div>
<div class="video-row skel{featured}">
  <div class="vbtn vbt-l skel"><i class="fa fa-chevron-left"></i></div>
  {cards}
  <div class="vbtn vbt-r skel"><i class="fa fa-chevron-right"></i></div>
</div><span>
`;

// CODE
function randId() {
     return Math.random().toString(36).substr(2, 10);
}

function load_row(row_id) {
  let row_elem= $('#' + row_id);

  let img;
  let cards = [];
  let ids = [];
  let count = 5;
  let loaded = 0;

  for (i=0; i<count; i++) {
    img = new Image();
    let url = '//placeimg.com/480/480/any'

    console.log($(this));
    let parent = $(this);
    $('<img/>').attr('src', url).on('load', function() {
      $(this).remove();

      let t_id = randId();
      let $c = $(VCARD.replace('{title}',  'Title Here')
                      .replace('{author}', 'Author Here')
                      .replace('{views}',  'Views here')
                      .replace('{t-id}',   t_id)
                      .replace('{thumb}',  url));

      cards.push($c);
      loaded ++;

      if (loaded == count) {
        let c_id = randId();
        let $row = $(VROW.replace('{title}',    'Title Here')
                         .replace('{sub}',      'Sub here')
                         .replace('{featured}', '')
                         .replace('{c-id}',     c_id));

        row_elem.animate({'opacity': '0'}, 400, function () {
          row_elem.replaceWith($row);
          $('#' + c_id).replaceWith(cards);
          $row.animate({'opacity': '1'}, 200);
        });
      }
    });
  }
}

$().ready(function () {
  let body = $("#body-content");

  let cards = [];
  for (i=0;i<5;i++) {
    let c = VCARD_SKEL;
    cards.push(c);
  }

  let row_id = randId();
  let row = VROW_SKEL.replace('{id}',       row_id)
                     .replace('{featured}', '')
                     .replace('{cards}',    cards.join(''));

  body.append(row);

  setTimeout(function(){load_row(row_id)}, 0)
});
