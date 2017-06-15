Guide.js
========

[![Build Status](https://travis-ci.org/amireh/guide.js.png)](https://travis-ci.org/amireh/guide.js)

Elegant, interactive, and dynamic JavaScript user guiding and tutorial library.

This library started out as a fork of [pageguide.js](https://github.com/tracelytics/pageguide), but ended up being its own package as the code
diverged too much from the original codebase.

If `guide.js` doesn't fit your needs, take a look at [pageguide.js](https://github.com/tracelytics/pageguide), or see the Related appendix below for more options.

## What makes it different

* Deeply customizable and flexible in order to support most DOM structures
* Responsive design support
* i18n and RTL language support
* Multiple Tours: each with its own sequence of steps
* Single-page-apps support through [tours](#tours)
* Multiple content sources; create tours and their steps using JavaScript and JSON, inline markup (using `data-guide` attributes), or by using explicit HTML elements to hold the content
* Dynamic; add and remove tour steps at run-time
* Modular, extensible: pick and use what you want

## Dependencies

* [jQuery](http://jquery.com) (1.10.2+ or 2.0.2+)
* [underscore.js](http://underscorejs.org) (or [lodash](http://lodash.com))

## Demo

See http://guide-js.amireh.net for a bunch of examples.

## Getting started

Include the core guide.js JavaScript file:

```html
  <script src="https://github.com/amireh/guide.js/src/js/guide.js"></script>
```

Optionally, include any extensions you want to use:

```html
  <script src="https://github.com/amireh/guide.js/src/js/extensions/guide-tutor.js"></script>
  <script src="https://github.com/amireh/guide.js/src/js/extensions/guide-markers.js"></script>
```

Now you can start defining tours. See the minimal example for a headstart, or
the content sources example for a more complete example of how you can define
tours.

## Browser compatibility

The library has been tested on Linux and Windows variants of the following browsers:

* IE 9 (Windows)
* Chrome 28
* Firefox 22
* Opera 12

## Extensions

guide.js can support extra functionality via extensions, allowing you to pick and load only the features that you need.

Enabling an extension is as simple as including its JS script. Some extensions may require configuration, others simply add themselves as functionality layers.

See `src/js/extensions/` for the available stock extensions guide.js ships with.

### Stock extensions

**The Tutor**

Display tour entries in a single static element. The tutor will update its content as the user takes the tour and allows the user to navigate around it.

**Markers**

Attach 'guidelets' to DOM elements to display tour entries in-place. Each guidelet will display the tour entry position, and when clicked will (optionally) expand with the content of the entry.

## Building

**JS**

guide.js scripts can be built using the uglifyjs compressor. Get the dependencies
using `npm` and run the Grunt `build` task:

```bash
cd /path/to/guide.js
npm install
grunt build
```

You will now find the minified JavaScript in `dist/guide.min.js` and a concatenated
version of all the guide.js scripts in `dist/guide.js`.

**CSS**

To build the stylesheet, you need the [LESS](http://lesscss.org/) compiler:

```bash
cd /path/to/guide.js
lessc --strict-imports --compress src/css/gjs.less dist/gjs.min.css
```

If you've followed the steps above for building the JavaScripts, just do:

```bash
grunt less
```

## Running tests

A Node package is defined that contains all the development dependencies required
to run the tests, you need `npm` to install it. Once the package is pulled,
a Grunt script is used to run the code through JSLint and run the Jasmine specs:

```bash
npm install
grunt
```

## Related

Here's a list of related libraries I've used before writing `guide.js`. They are
all about providing a 'tour' or 'guide' for users, but they differ in how they
implement markers, content feeding, and other things.

* [pageguide.js](http://tracelytics.github.io/pageguide/)
* [intro.js](http://usablica.github.io/intro.js/)
* [Trip.js](http://eragonj.github.io/Trip.js/)
* [aSimpleTour](http://alvaroveliz.github.io/aSimpleTour/)

## License

Copyright 2013 Ahmad Amireh.

Licensed under the [MIT License](https://raw.github.com/amireh/guide.js/master/LICENSE).
