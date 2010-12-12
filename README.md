Cablescrape
-----------

The scrape.js Node.js script parses downloaded Wikileaks cablegate web pages and
uses the jsdom project's JQueryify function to parse content from them. Content
is then output as JSON.

Put the "cable" directory from a dump of the Wikileaks site into the same
directory as scrape.js then enter the following command to output the JSON:

 node scrape.js

Note that an older version of jsom and JQuery are used (and included) as I
couldn't get things to work otherwise. The html_entity_decode function from the
php.js project is used to decode HTML entities.

The script has been tested on node 0.2.0 and v0.3.2-pre.

For an intro on using jsdom to scrape content check out:
http://blog.nodejitsu.com/jsdom-jquery-in-5-lines-on-nodejs

jsdom: https://github.com/tmpvar/jsdom/
php.js: http://phpjs.org/
