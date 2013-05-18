JSNES Fork
==========

My fork of [JSNES](http://fir.sh/projects/jsnes/) that adds support for:

  * [USB NES RetroPort](http://www.retrousb.com/product_info.php?cPath=21&products_id=28)
    controllers via the [W3C Gamepad API](http://www.w3.org/TR/gamepad/).
    Other gamepads presumably work, but I have only tested with the
    RetroPort.
  * Loading local ROMs.

If you look at the outstanding [pull requests](https://github.com/bfirsh/jsnes/pulls)
to the main project, you can see that these are the most popular types of patches that
developers are trying to submit.

I decided to have a go at this myself, as I would like to get things running at
full speed on a [Chromebook Pixel](http://www.amazon.com/gp/product/B009LL9VDG/ref=as_li_qf_sp_asin_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B009LL9VDG&linkCode=as2&tag=bolinfestcom-20).

Run
---

In order for XHRs to work properly in `retrousb.html`, you need to serve
the content via a web server. Assuming you have Python installed, run:

    python -m SimpleHTTPServer

and then visit `http://localhost:8000/retrousb.html` in your browser.

If you would like to use the original test page (with keyboard-based input),
then you can use the original `http://localhost:8000/index.html` test page
from the original JSNES repository.
