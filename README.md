# bfg-fleetlists

Fleetlists for BFG, using the code written for the [Net Epic Armageddon Tournament Pack website](http://tp.net-armageddon.org/), powered by Jekyll.
The site is currently live at [bfg-lists.org](https://bfg-lists.org/).

## Quickstart

Make sure you have a SSH key set up and added to git.

    $ git clone git@github.com:tscmacdonald/bfg-fleetlists.git
    $ cd bfg-fleetlists/
    $ bundle install
    $ jekyll serve -l

That should build and serve up the site at [http://localhost:4000/](http://localhost:4000/).

## Dependencies

 * [RVM](https://rvm.io/) (for Ruby and RubyGems)
 * [Bundler](http://bundler.io/) (for the gems)
 * [Prince](https://www.princexml.com/) (to build the PDFs)
 * Jekyll now seems to need a JS interpreter: nodejs is fine