import { newServer } from 'mock-xmlhttprequest';
import { initialize } from '../index';

describe('initializer test suite ', () => {

  Object.defineProperty(global, 'window', {
    value: {},
  });

  Object.defineProperty(global.window, 'crypto', {
    value: { getRandomValues: ()=>new Uint32Array(10) },
  });

  test('XML Request with no request body ', done => {
    const server = newServer({
      get: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();
    const transporter = {
      transport: () => { }
    }

    initialize({ size: 100 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/my/url")
    xhr.setRequestHeader("x-test", "data")

    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send();
  });


  test('XML Request with body smaller than config limit ', done => {
    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const transporter = {
      transport: () => { }
    }

    initialize({ size: 100 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")

    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test' }));
  });

  test('Success XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, uploadEventListners: XMLHttpRequestUpload) => { postHook(true) }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        expect(requestOrder).toStrictEqual(['init', 'send-success'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  });


  test('Failed XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, uploadEventListners: XMLHttpRequestUpload) => { postHook(false) }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        expect(requestOrder).toStrictEqual(['init', 'send-error'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  });


  test('Failed XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, uploadEventListners: XMLHttpRequestUpload) => { postHook(false) }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        expect(requestOrder).toStrictEqual(['init', 'send-error'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  });


  test('XML Request with body larger than the config limit - prefetch call failed', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "error!" }');
    })

    server.install();

    const transporter = {
      transport: () => { }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"error!\" }")
        expect(requestOrder).toStrictEqual(['init', 'send-error'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  })


  test('Failed XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, uploadEventListners: XMLHttpRequestUpload) => { postHook(false) }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        expect(requestOrder).toStrictEqual(['init', 'send-error'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  });


  test('XML Request with body larger than the config limit - abort', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "error!" }');
    })

    server.install();

    const transporter = {
      transport: () => { }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('abort', function () {
      expect(true)
      done();
    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
        expect(requestOrder).toStrictEqual([])
      } catch (error) {
        done(error);
      }
    })
 
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
    xhr.abort();
  })


  test('XML Request with body larger than the config limit - timeout', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader('X-HTTP-HEAVY-ACTION'))
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "error!" }');
    })

    server.install();

    const transporter = {
      transport: () => { }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('abort', function () {
      expect(true)
      done();
    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
        expect(requestOrder).toStrictEqual([])
      } catch (error) {
        done(error);
      }
    })
 
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
    xhr.abort();
  })
});