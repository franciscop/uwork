# uwork

Tiny web worker that doesn't need an external file to run. Perfect for math intensive tasks as it uses several CPU processes in [true parallel](http://ejohn.org/blog/web-workers/).

Web workers are awesome and this project is taking a subset of that awesomeness and make it super easy to implement. This is for functions that take N arguments, process them and then return a value once.



## Getting started

Include it in your website:

```html
<script src="https://unpkg.com/uwork@1"></script>
```

Or with npm:

```bash
npm install uwork --save
```

Then create the work that you want performed and wrap it with a function called `uwork`. Let's calculate Pi as an example:

```js
// Simple return for sync operations
var work = uwork(function findPi(number = 10000) {
  var inside = 0;
  for (var i = 0; i < number; i++) {
    var x = Math.random(), y = Math.random();
    if (x * x + y * y <= 1) inside++;
  }
  return 4 * inside / number;
});
```

Finally do the actual work and receive and handle the returned promise:

```js
work(200000000).then(pi => console.log(pi)).catch(console.log);
```

These are the returned values:

```
uwork(intensive fn) => function(args) => promise.then(result => result)
```



## Options

There's only a single option so far: `timeout` (ms). Stablish a maximum time for the web worker to perform some job, then the promise is rejected. If set to 0, false or a falsy value then there is no timeout. Defaults to undefined.

```js
// Limit it to 10s
worker.timeout = 10000;

// ...
```



## Communication

There are three ways your worker can communicate back with your main script:

### Simple `return`

You can just return a value. Since many math intensive processes are synchronous, this is a great way to unblock the main thread while doing heavy work in a secondary thread:

```js
// Simple return for sync operations. This will be made parallel and thus async
var work = uwork(function intensive(args) {

  // heavy work here

  return 42;
});
```

Remember that, independently of what your intensive function returns, you then call it always the same way:

```js
work(args).then(res => res === 42);
```

To reject the operation in this way, you can either return an object with the property `error` or return an `Error` (which will be stringified, read [extra section](#extra)):

```js
var work = uwork(function intensive(args) {

  // heavy work here

  return { error: 'Bad smelling feet' };
  //return new Error('Bad smelling feet');
});
```



### Promises

```js
// Using promises
var work = uwork(function findPi(number = 10000) {
  return new Promise((resolve, reject) => {

    // heavy work here

    resolve(42);
  });
});
```

As you can guess, to return an error you can just `reject()` it. Anyway, call it the same way:

```js
work(args).then(res => res === 42);
```

The coolest thing is that the function interface is compatible with native code:

```js
// Perform the work in a single thread but async
let work = function intensive() => {
  return new Promise((resolve, reject) => {

    // heavy work here

    resolve(42);
  });
};

work(args).then(res => res === 42);
work(args).then(res => res === 42);
work(args).then(res => res === 42);
work(args).then(res => res === 42);
```

```js
let work = uwork(function intensive() => {
  return new Promise((resolve, reject) => {

    // heavy work here

    resolve(42);
  });
});

work(args).then(res => res === 42);
work(args).then(res => res === 42);
work(args).then(res => res === 42);
work(args).then(res => res === 42);
```



### Native worker `postMessage`

Inside the web worker context, you have the function postMessage available. You can use it, however the methods explained above are preferred for consistency:

```js
var work = worker(function findPi(number = 10000) {

  // heavy work here

  postMessage(42);
});
```

To reject it this way, as in the `return` one, you can just pass an object with an `error` property or an instance of `Error`:

```js
var work = uwork(function intensive(args) {

  // heavy work here

  postMessage({ error: 'Bad smelling feet' });
  //postMessage(new Error('Bad smelling feet'));
});
```


## Extra

There are some things that you should know. While Web Workers are great, they also have limitations. The main ones [for practical purposes] are:

### Functions should be self-contained

This won't work for example:

```js
var external = whatever => whatever;

var worker = uwork(function(){
  return external('Peter');
});
```

This is a limitation of the way we simplify web workers. We are basically getting the function, converting it into a string, creating a virtual script and executing it there (not too different from eval).

### Values should be able toString()

Both the arguments you are passing and the result of the operation.


### Security

I don't really know too much about security, but to be on the safe side treat this as if it was using `eval()` internally or dig into the code and edit this document if you know more than me.

What this means is that don't build anything dynamically (from the previous limitations is quite difficult anyway), just rely on this for math or CPU-intensive processes.


### Native workers

Native workers can communicate over time several messages, so this library is somewhat limiting that in exchange for a much simpler API. If you like this I recommend you dig into them.
