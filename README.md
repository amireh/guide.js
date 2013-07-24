guide.js - Elegant, interactive, and dynamic JavaScript user guiding and tutorial library.

## What makes it different

* Deeply customizable and flexible in order to support most DOM structures
* Responsive design support
* i18n and RTL language support
* Multiple tours: each with its own and sequence of steps
* Single-page-apps support through [tours](#tours)
* Multiple content sources; create tours and their steps using JavaScript and JSON, inline markup (using `data-guide` attributes), or by using explicit HTML elements to hold the content
* Dynamically update and modify the tour sequence
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

TODO

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

TODO

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

## License

guide.js is developed by [Algol Labs](www.algollabs.com) and is licensed under
the MIT terms. See `LICENSE`.