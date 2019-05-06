# uwork

Run CPU-intensive operations [in true parallel with Web Workers](http://ejohn.org/blog/web-workers/):

![CPU in async vs in parallel](cpu.png)

This library makes it trivial to implement a web worker in your browser JS code:

```js
const findPi = uwork(expensiveFn);
const pi = await findPi();
```


## Getting started

Install with npm:

```bash
npm install uwork
```

Or include the script in your website:

```html
<script src="https://cdn.jsdelivr.net/npm/uwork@1/uwork.js"></script>
```

Then create the work that you want performed and wrap it with a function called `uwork`. It can be either a sync or async function. Let's calculate Pi with the Monte Carlo method as an example:

```js
// Create the piece of work to be performed
// It can be sync or async
const findPi = uwork((iterations = 10000) => {
  let inside = 0;
  for (var i = 0; i < iterations; i++) {
    let x = Math.random(), y = Math.random();
    if (x * x + y * y <= 1) inside++;
  }
  return 4 * inside / iterations;
});
```

Finally do the actual work and handle the returned promise:

```js
// Run this inside an async context:
const pi = await findPi(200000000);
```

Regardless of whether the function you create is sync or async, the returned function of uwork() will always be async. This is the return order:

```
uwork(fn) => function(args) => Promise(value)
```

See [**demo** in JSFiddle](https://jsfiddle.net/franciscop/ckhg5bur/12/).



## Options

There's only a single option so far: `timeout` (ms). Establish a maximum time for the web worker to perform some job, then the promise is rejected. If set to 0, false or a falsy value then there is no timeout. Defaults to undefined.

```js
// Limit it to 10s
uwork.timeout = 10000;

// ...
```



## Communication

To call your parallel function it's always the same way; pass the arguments to the returned function from `uwork()` and await for the return value:

```js
const work = uwork(fn);
const result = await work(args);
```

Now, to send that result from within the `fn()`, you can return a value either from a sync or an async function. Since many math intensive processes are synchronous, this is a great way to unblock the main thread while doing heavy work in a secondary thread:

```js
// Simple return for sync operations. This will be made parallel and thus async
var work = uwork(function intensive(args) {

  // heavy work here

  return 42;
});
```

Using Async/Await it also has a very clean syntax:

```js
// Using promises
var work = uwork(async (number = 10000) => {

  // heavy work here

  return 42;
});
```

Note that the code above is equivalent to the following:

```js
// Using promises
var findPi = uwork((number = 10000) => {
  return new Promise((resolve, reject) => {

    // heavy work here

    resolve(42);
  });
});
```

The coolest thing is that the function interface is compatible with normal Javascript code, you just wrap it around:

```js
// Perform the work in a single thread but async
const work = async () => {

  // heavy work here

  return 42;
};

const res = await Promise.all([work(), work(), work(), work()]);
```

```js
// Just wrap uwork() around it to make it parallel
const work = uwork(async () => {

  // heavy work here

  return 42;
});

const res = await Promise.all([work(), work(), work(), work()]);
```

## Error handling

Follows standard promise error handling:

```js
try {
  const pi = await findPi(20000);
} catch (error) {
  console.error(error);
}
```

To reject the operation in both ways you can either return an `Error` (which will be stringified, read [extra section](#extra)) or throw it:

```js
const findPi = uwork((number) => {
  if (number === 0) {
    // return new Error('Cannot iterate 0 times');
    throw new Error('Cannot iterate 0 times');
  }

  // heavy work here
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

Treat this as if it was using `eval()` internally or dig into the code and edit this document if you know more than me.

Don't build anything dynamically (from the previous limitations is quite difficult anyway), just rely on this for math or CPU-intensive processes. Clean and validate your arguments.


### Native workers

Native workers can communicate over time several messages, so this library is somewhat limiting that in exchange for a much simpler API. If you like this I recommend you dig into them.


### Credit

Learned from [(Blob() & URL.createObjectURL](jsfiddle.net/christopheviau/90syrp0q/)
