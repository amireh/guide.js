guide.js
========

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

## Getting started

Include the core guide.js JavaScript file:

```html
  <script src="https://github.com/amireh/guide.js/src/js/guide.js"></script>
```

Optionally, include any extensions you want to use:

```html
  <script src="https://github.com/amireh/guide.js/src/js/extensions/guide-tutor.js"></script>
  <script src="https://github.com/amireh/guide.js/src/js/extensions/guide-marker.js"></script>
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

See `src/extensions/` for the available stock extensions guide.js ships with.

### Stock extensions

**The Tutor**

Display tour entries in a single static element. The tutor will update its content as the user takes the tour and allows the user to navigate around it.

**Markers**

Attach 'guidelets' to DOM elements to display tour entries in-place. Each guidelet will display the tour entry position, and when clicked will (optionally) expand with the content of the entry.

## Building

**JS**

guide.js can be built using the require.js optimizer and minifies code using `uglifyjs`,
which you can install using the node package manager:

```bash
npm install r.js
npm install uglify-js
```

Once you have `r.js` installed, launch a terminal and do the following:

```bash
cd /path/to/guide.js/src/js
r.js -o build.js
```

You will now find the minified JavaScript in `dist/guide.js`.

You can customize the build profile, in `src/js/build.js`, to your liking to
include or exclude some guide.js extras.

**CSS**

To build the stylesheet, you need the [LESS](http://lesscss.org/) compiler:

```bash
cd /path/to/guide.js
lessc --strict-imports --compress src/guide.less dist/guide.css
```

If you're using Linux (or you have `inotify-tools` available), you can use a compiler script which will automatically listen to changes made to the source LESS file `guide.less` and produce a built version in `dist/guide.css`.

```bash
cd /path/to/guide.js/src/css
./compiler.sh
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

guide.js is developed by [Algol Labs](www.algollabs.com) and is licensed under
the MIT terms. See `LICENSE`.
