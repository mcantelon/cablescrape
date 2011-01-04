Cablescrape
-----------

WARNING: this is a work in progress.

Requirements:
  node.js (tested with node 0.2.0 and v0.3.2-pre)
  htmlparser
  optimist

The scrape.js Node.js script parses downloaded Wikileaks cablegate web pages and
uses the jsdom project's JQueryify function to parse content from them. Content
is then output as JSON.

To get the cablegate web pages, use the Bash script "refresh_cables.sh" to
download a fresh copy of the Wikileaks site and put its "cable" directory into
the same directory as "scrape.js".

Once you have cables to scrape enter the following command to output the JSON:

  node scrape.js

Note that an older version of jsom and JQuery are used (and included) as I
couldn't get things to work otherwise. The html_entity_decode function from the
php.js project is used to decode HTML entities.

For an intro on using jsdom to scrape content check out:
http://blog.nodejitsu.com/jsdom-jquery-in-5-lines-on-nodejs

jsdom: https://github.com/tmpvar/jsdom/
php.js: http://phpjs.org/
