# chrome-extension-leap-motion-content-script

Script for defining gesture controls in content scripts using the Leap Motion controller

Tested through **Chrome 72**

Requires a [Leap Motion controller](https://www.leapmotion.com/), the [Leap Motion runtime](https://www.leapmotion.com/setup/), and the [Leap Motion JavaScript library](https://developer-archive.leapmotion.com/javascript) (tested with 0.6.4, which is included)

Requires **jQuery** - tested with 3.3.1. **jQuery-free version coming soon!**

Adds gesture control for scrolling the window (main hand, palm up, fist closed) and moving a motion cursor around the window and keytapping when enabled (non-main hand or tool). Also has functions for defining custom gestures and callbacks, including those available in the Leap Motion library.


## Usage

See the samples in **motion-sample.js** and **motion-sample.css**

Include **ext-leap-motion.js** and **ext-leap-motion.css** in the manifest for content scripts, or as a regular script on extension pages.

**Suggested usage** - include **ext-leap-motion.js** and **ext-leap-motion.css** on <all_urls> so that it'll be available to all content scripts


## Support

Please submit an issue.


## License

Copyright (c) 2021 DKCTC

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
