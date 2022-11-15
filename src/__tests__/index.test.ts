import { newServer } from 'mock-xmlhttprequest';
import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS } from '../constant';
import { initialize } from '../index';

class XMLHttpRequestUploadImpl implements XMLHttpRequestUpload {
  name: String;
  constructor(name: String) {
    this.name = name;
  }
  addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestUpload, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
  addEventListener(type: unknown, listener: unknown, options?: unknown): void {
    throw new Error('Method not implemented.');
  }
  removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestUpload, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
  removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
    throw new Error('Method not implemented.');
  }
  onabort(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  onerror(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  onload(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  onloadend(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  onloadstart(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  onprogress(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  ontimeout(this: XMLHttpRequest, ev: ProgressEvent<EventTarget>): any {

  }
  dispatchEvent(event: Event): boolean {
    throw new Error('Method not implemented.');
  }

  run(arg: any): void {
    console.log(`running: ${this.name}, arg: ${arg}`);
  }
}

describe('initializer test suite ', () => {


  Object.defineProperty(global, 'window', {
    value: {},
  });


  Object.defineProperty(global.window, 'crypto', {
    value: { getRandomValues: () => new Uint32Array(10) },
  });

  Object.defineProperty(global, 'XMLHttpRequestUpload', {
    value: XMLHttpRequestUploadImpl,
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
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(true) }
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
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
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
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
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
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
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
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
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

    server.post('/my/url', (request) => {
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "error!" }');
    })

    server.install();

    const transporter = {
      transport: () => { }
    }

    initialize({ size: 2 }, transporter);

    let isExecuted = false;
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('abort', function () {
      isExecuted = true;
    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")

        expect(isExecuted).toBe(true)
        done();
      } catch (error) {
        done(error);
      }
    })

    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
    xhr.abort();
  })


  test('XML Request with body larger than the config limit - check download progess', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS) {
        request.setResponseHeaders();
        request.downloadProgress(10);
      } else {
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');
      }
    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(true) }
    }

    initialize({ size: 2 }, transporter);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('progress', function () {
      expect(true);
      done();

    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  })


  test('XML Request with body less than the config limit - check upload progess', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.uploadProgress(1);
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');


    })

    server.install();


    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        postHook(true)
      }
    }


    initialize({ size: 20000 }, transporter);

    let isExecuted = false;

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = function () {
      isExecuted = true;
    }
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isExecuted).toBe(true)
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));

  })


  test('XML Request with body larger than the config limit - check upload progess', done => {
    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })

    server.install();

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        postHook(true)
      }
    }

    initialize({ size: 2 }, transporter);

    let isExecuted = false;

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = function () {
      isExecuted = true;
    }
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isExecuted).toBe(false);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));

  })
});