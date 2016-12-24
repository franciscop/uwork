// uwork; a tiny, javascript-only Worker library with promises
// By Francisco Presencia (http://francisco.io/)
var uwork = (workable) => function (...args) {
  return new Promise(function(resolve, reject) {
    var handler = res => {
      if (res instanceof Promise) {
        return res.then(message => {
          postMessage(message.toString());
        }).catch(err => {
          postMessage({ error: err.toString() });
        });
      }
      if (typeof res !== undefined) {
        if (res instanceof Error) {
          return postMessage({ error: err.toString() });
        }
        postMessage(res);
      }
    };
    var blob = new Blob(
      ['(' + handler + ')((' + workable + ')(' + args + '))'],
      {"type": "text\/plain"}
    );
    var ww = new Worker(URL.createObjectURL(blob));
    if (uwork.timeout) {
      var timeout = setTimeout(e => {
        reject(new Error('Timed out: took longer than ' + uwork.timeout + 'ms'));
      }, uwork.timeout);
    }
    ww.onmessage = e => {
      if (e.data && e.data.error) {
        reject(e.data.error);
      }
      resolve(e.data);
      clearTimeout(timeout);  // No error, no problem
    }
  });
};

if (typeof module !== 'undefined') {
  module.exports = uwork;
}
