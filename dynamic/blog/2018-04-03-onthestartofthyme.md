# On the start of Thyme

> In the beginning, there was nothing. Then someone decided it was _Thyme_ for
> a new video sharing site and they grabbed some other people to help them make
> it.
>
> I managed to get them to write a blog post. Isn't this splendid.

---

When news of Vine's shutdown hit the ears of every aspiring developer, some
took action. Most of you probably heard of Vine2 being the story of some devs
who did do something about it. However, a few developers on a relatively small
Discord server also decided to do something about it. They called their idea
"Thyme". The name was a reference to the unique length of a Vine, the
plant-y-ness of a name like Vine, and how communities flourish. As we started
work on the site, we realized the world needed a better YouTube rather than
another Vine. Immediately we switched course to an ethical video-sharing
service focused on positive community interaction. In short, we're not a
money-hungry corporation. We're a small group of devs who wanted to make a
change in the world. 

---

So now you know what we are and why we exist. The fun part is "how does Thyme
actually work under the hood?" So I'm going to briefly explain.

---

At the time of writing, the core technologies used to power Thyme are Python,
Python, and Python. Joking aside, the actual backend of the site that does the
heavy lifting is written using the Python library `sanic` which provides a
decently usable interface for us to actually write the server while maintaining
the speeds that are needed for a web server.

Pretty much everything is stored in a nice, big, PostgreSQL database and we
store a pool of connections to that database to ensure the server stays
asynchronous. Currently, there aren't many fancy things going on behind the,
scenes, but there is one, and you're looking at it.

---

We wanted a simple solution to allow us to serve blog posts and help articles
in a manner that is both fast for us to write them but low on system resources.
The easy solution is to just directly write all of them as HTML pages that are
statically served, but that doesn't tick the box for fast writing.

Another solution was to just use an external service (such as Medium), but we
wanted a solution that was contained within our own servers.

Enter markdown.

Markdown is a very simple format for writing documents in, but more
importantly, it's designed to be **both** human and machine readable. That
means that it is easy for us to write articles, but that same file can then be
read by the server and processed to give you the page you're looking at.

We considered writing our own parser for markdown, however there are many
available already, so after playing around with a few of them,
`python-markdown2` was chosen. It provides a simple interface for using in our
scripts whilst also generating HTML in a format that is easy for us to style.

---

After that, it was a simple case of creating a wrapper class that queried our
database for an article, converts it, then injects it into a template and
serves it to you. The read time estimator is a simple case of performing an
approximate word count then taking a standard words-per-minute value and just
dividing the two.

---

Wow.. I just tried really hard to make something that's really pretty boring
sound far more interesting than it is. Hopefully at some point there'll be some
actual stuff we can put here.

I guess I'll just put some Touhou here and silently sulk away..

![Tenshion](../assets/img/tenshion.png)