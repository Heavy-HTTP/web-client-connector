import { newServer } from 'mock-xmlhttprequest';

import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS } from '../constant';
import { initialize } from '../index';

class BlobImpl implements Blob {
  size: number = 12;
  type: string = 'string';
  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }
  slice(start?: number | undefined, end?: number | undefined, contentType?: string | undefined): Blob {
    throw new Error('Method not implemented.');
  }
  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented.');
  }
  text(): Promise<string> {
    throw new Error('Method not implemented.');
  }

}

class FileImpl implements File {
  lastModified: number = 1;
  name: string = 'name';
  webkitRelativePath: string = 'rp';
  size: number = 10;
  type: string = 'object';
  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }
  slice(start?: number | undefined, end?: number | undefined, contentType?: string | undefined): Blob {
    throw new Error('Method not implemented.');
  }
  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented.');
  }
  text(): Promise<string> {
    throw new Error('Method not implemented.');
  }

}

class FormDataImpl implements FormData {

  append(name: string, value: string | Blob, fileName?: string | undefined): void {
    throw new Error('Method not implemented.');
  }
  delete(name: string): void {
    throw new Error('Method not implemented.');
  }
  get(name: string): FormDataEntryValue | null {
    throw new Error('Method not implemented.');
  }
  getAll(name: string): FormDataEntryValue[] {
    throw new Error('Method not implemented.');
  }
  has(name: string): boolean {
    throw new Error('Method not implemented.');
  }
  set(name: string, value: string | Blob, fileName?: string | undefined): void {
    throw new Error('Method not implemented.');
  }
  forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
    throw new Error('Method not implemented.');
  }
  entries(): IterableIterator<[string, FormDataEntryValue]> {
    const mapData = new Map<string, FormDataEntryValue>();
    mapData.set("key1", "value1");
    mapData.set("key2", new File([""], "filename"));
    return mapData.entries();
  }
  keys(): IterableIterator<string> {
    throw new Error('Method not implemented.');
  }
  values(): IterableIterator<FormDataEntryValue> {
    const mapData = new Map<string, FormDataEntryValue>();
    mapData.set("key1", "value1");
    mapData.set("key2", new File([""], "filename"));
    return mapData.values();
  }
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    throw new Error('Method not implemented.');
  }
}

describe('initializer test suite ', () => {

  const globalTemp = Object.assign({}, global);

  beforeEach(() => {
    Object.defineProperty(global, 'window', {
      value: {},
    });

    Object.defineProperty(global, 'XMLHttpRequestUpload', {
      value: {},
    });

    Object.defineProperty(global.window, 'crypto', {
      value: { getRandomValues: () => new Uint32Array(10) },
    });

    Object.defineProperty(global, 'File', {
      value: FileImpl,
    });


    Object.defineProperty(global, 'Blob', {
      value: BlobImpl,
    });

    Object.defineProperty(global, 'FormData', {
      value: FormDataImpl,
    });

    Object.defineProperty(global, 'Error', {
      value:Error,
    })

    Object.defineProperty(global, 'Object', {
      value:Object,
    })

    Object.defineProperty(global, 'Array', {
      value:Array,
    })
  })

  afterEach(() => {
    global = Object.assign({}, globalTemp);
  })

  test('XML Request with incorrect params ', () => {
   
    const transporter = {
      transport: () => { }
    }
    expect(()=>initialize({ contentSize: -12 }, transporter)).toThrow(expect.objectContaining({ message: 'Content Size must be a non-negative integer'}));

  });


  test('XML Request with no request body ', done => {
    const server = newServer({
      get: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 100 }, transporter);

    let isNotExecuted = true;

    const loadedNotExFunc = function () {
      try {
        isNotExecuted = false;
      } catch (error) {
        done(error);
      }
    }

    xhr.upload.removeEventListener('loadend', loadedNotExFunc)

    xhr.upload.addEventListener('loadend', loadedNotExFunc)


    xhr.open("GET", "/my/url")
    xhr.setRequestHeader("x-test", "data")

    xhr.addEventListener('loadend', function () {
      try {
        expect(isNotExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send();
  });


  test('XML Request with string body smaller than config limit ', done => {
    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });
    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 100 }, transporter);

    let isNotExecuted = true;

    const loadedNotExFunc = function () {
      try {
        isNotExecuted = false;
      } catch (error) {
        done(error);
      }
    }

    xhr.upload.addEventListener('loadend', loadedNotExFunc)

    xhr.upload.removeEventListener('loadend', loadedNotExFunc)

    xhr.open("POST", "/my/url")

    xhr.setRequestHeader("x-test", "data")

    let isExecuted = false;

    xhr.upload.addEventListener('loadend', function () {
      try {
        isExecuted = true
      } catch (error) {
        done(error);
      }
    })

    xhr.upload.addEventListener('loadend', loadedNotExFunc)

    xhr.upload.removeEventListener('loadend', loadedNotExFunc)

    xhr.addEventListener('loadend', function () {
      try {
        expect(isExecuted).toBe(true)
        expect(isNotExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test' }));
  });

  test('XML Request with blob body smaller than config limit ', done => {
    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });
    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 100 }, transporter);

    xhr.open("POST", "/my/url")

    xhr.setRequestHeader("x-test", "data")

    let isExecuted = false;

    xhr.upload.addEventListener('loadend', function () {
      try {
        isExecuted = true
      } catch (error) {
        done(error);
      }
    })


    xhr.addEventListener('loadend', function () {
      try {
        expect(isExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(new Blob());
  });

  test('XML Request with URLSearchParams body smaller than config limit ', done => {

    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 100 }, transporter);


    xhr.open("POST", "/my/url")

    xhr.setRequestHeader("x-test", "data")

    let isExecuted = false;

    xhr.upload.addEventListener('loadend', function () {
      try {
        isExecuted = true
      } catch (error) {
        done(error);
      }
    })


    xhr.addEventListener('loadend', function () {
      try {
        expect(isExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(new URLSearchParams("foo=1&bar=2"));
  });

  test('XML Request with ArrayBuffer body smaller than config limit ', done => {

    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 100 }, transporter);


    xhr.open("POST", "/my/url")

    xhr.setRequestHeader("x-test", "data")

    let isExecuted = false;

    xhr.upload.addEventListener('loadend', function () {
      try {
        isExecuted = true
      } catch (error) {
        done(error);
      }
    })


    xhr.addEventListener('loadend', function () {
      try {
        expect(isExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(new ArrayBuffer(8));
  });


  test('XML Request with FormData body smaller than config limit ', done => {

    const server = newServer({
      post: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 2000 }, transporter);


    xhr.open("POST", "/my/url")

    xhr.setRequestHeader("x-test", "data")

    let isExecuted = false;

    xhr.upload.addEventListener('loadend', function () {
      try {
        isExecuted = true
      } catch (error) {
        done(error);
      }
    })


    xhr.addEventListener('loadend', function () {
      try {
        expect(isExecuted).toBe(true)
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        done();
      } catch (error) {
        done(error);
      }
    })

    xhr.send(new FormData());

  });

  test('Success XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(true) }
    }

    initialize({ contentSize: 2 }, transporter);

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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
    }


    initialize({ contentSize: 2 }, transporter);

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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
    }

    initialize({ contentSize: 2 }, transporter);

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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 2 }, transporter);

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


  test('Failed transpoter XML Request with body larger than the config limit ', done => {

    const server = newServer();
    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
    }

    initialize({ contentSize: 2 }, transporter);

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
      request.setNetworkError();
    })

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => { postHook(false) }
    }

    initialize({ contentSize: 2 }, transporter);

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: () => { }
    }

    initialize({ contentSize: 2 }, transporter);

    let isExecuted = false;

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


  test('XML Request with body larger than the config limit - abort in transportor', done => {
    const server = newServer();

    server.post('/my/url', (request) => {
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
    })

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        const transportXHR = new XMLHttpRequest();
        transportXHR.open("POST", "/my/url")
        preHook(transportXHR, () => { })
        xhr.abort();
      }
    }

    initialize({ contentSize: 2 }, transporter);

    let isExecuted = false;

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
        expect(request.requestHeaders.getHeader('content-type')).toStrictEqual('application/json')
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');
      }
    })

    server.install();

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        const transportXHR = new XMLHttpRequest();
        transportXHR.open("POST", "/my/url")
        preHook(transportXHR, () => { })
        transportXHR.addEventListener('loadend', function () {
          postHook(true)
        })
        transportXHR.send(JSON.stringify({ 'test': 'test-legthy-data' }));
      }
    }

    initialize({ contentSize: 2 }, transporter);

    xhr.addEventListener('progress', function () {
      expect(true);
      done();

    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.setRequestHeader("content-type", "application/json")
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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        postHook(true)
      }
    }


    initialize({ contentSize: 20000 }, transporter);

    let isExecuted = false;

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

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    const transporter = {
      transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => {
        const transportXhr = new XMLHttpRequest();
        transportXhr.open("POST", "/my/url")
        preHook(transportXhr, () => { })
        listenerHook(transportXhr)
        transportXhr.addEventListener('loadend', function () {
          postHook(true)
        })
        transportXhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));

      }
    }

    initialize({ contentSize: 2 }, transporter);

    let isExecuted = true;

    let isNotExecuted = true;

    xhr.upload.onprogress = function () {
      isExecuted = true;
    }

    const nonExecFunction = function () {
      isNotExecuted = false;
    }

    xhr.upload.addEventListener('load', nonExecFunction);

    xhr.upload.removeEventListener('load', nonExecFunction);

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.upload.onprogress).toBe(null)
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isExecuted).toBe(true);
        expect(isNotExecuted).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));

  })
});