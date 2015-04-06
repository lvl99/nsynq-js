# *nsynq

Schedule JavaScript operations along a timeline progression defined by `n`.

CSS animations are nice, but what if you want to do some heavier things? Something more interactive and in sync with other tandem operations like audio and video? *nsynq could be your friend indeed.


## About

I wanted to have some operations play at certain points on a timeline, e.g. co-ordinated to specific streaming music files, and I wanted a really easy way to notate the points on the timeline, so I built this! It seems to work OK so far...


## Installation

### Node.JS
  npm install nsynq

### Bower
  bower install nsynq

### Dependencies

Works out of the box. Doesn't require any external libraries.


## Usage

*nsynq assumes that you've got a timeline that progresses from zero to `timelineLength`. Any point along that timeline is defined as `n`:

  var timelineLength = 200;
  var operations = {
    'when n eq 0': function () {
      console.log( 'Let us begin...' );
    },
    'do per 8 n': function ( n ) {
      console.log( '8 baller' );
    },
    'when n within 50-150, do per 10 n': function ( n ) {
      console.log( 'n is ' + n );
    },
    'when n gte 15, do approx 12:4 n': function ( n ) {
      console.log( 'Holla at you from ' + n );
    },
    'when n eq -0': function ( n ) {
      console.log( 'Baby, bye-bye-bye (the end)' );
    }
  };

  var nsynqWatcher = new Nsynq( timelineLength, operations );
  var n = 0;

  function animate() {
    requestAnimationFrame( animate );

    n++;
    nsynqWatcher.seek(n);
  }


## Todo

* Dynamic timeline instead of having to render when changing operations
* Figure out better compensation from frame skipping (`approx` and `around` expressions can kind of do that, but it's not perfect)


## Releases

### 0.1.0-alpha

* Initial version of API behaviours


## Licence

[MIT](./LICENSE)
