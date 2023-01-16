import { newServer } from 'mock-xmlhttprequest';
import { enableFetchMocks, disableFetchMocks } from 'jest-fetch-mock'
import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS, HEAVY_RESPONSE } from '../constant';
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

class MockReadableStreamDefaultReader implements ReadableStreamDefaultReader{
  times:number;
  closed: Promise<undefined>;
  value:any;

  constructor(value:any){
    this.times = 0;
    this.value = value;
    this.closed = new Promise((resolve, reject) => {
      resolve(undefined)});
  }

  read(): Promise<ReadableStreamReadResult<any>> {
    this.times = this.times + 1;
    return new Promise((resolve, reject) => {
     resolve(this.times === 1? { done: false,
      value: this.value
      }: { done: true})
    });

  }
  releaseLock(): void {
    throw new Error('Method not implemented.');
  }
  cancel(reason?: any): Promise<void> {
    throw new Error('Method not implemented.');
  }

}

class MockReadableStream implements ReadableStream {
  locked: boolean;
  value:any;
  constructor(value:any){
    this.value = value;
    this.locked = false;
  }
  cancel(reason?: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getReader(): ReadableStreamDefaultReader<any> {
    return new MockReadableStreamDefaultReader(this.value)

  }
  pipeThrough<T>(transform: ReadableWritablePair<T, any>, options?: StreamPipeOptions | undefined): ReadableStream<T> {
    throw new Error('Method not implemented.');
  }
  pipeTo(destination: WritableStream<any>, options?: StreamPipeOptions | undefined): Promise<void> {
    throw new Error('Method not implemented.');
  }
  tee(): [ReadableStream<any>, ReadableStream<any>] {
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

describe('XMLHttpRequest test suite ', () => {

  const globalTemp = Object.assign({}, global);

  beforeEach(() => {

    enableFetchMocks();

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
      value: Error,
    })

    Object.defineProperty(global, 'Object', {
      value: Object,
    })

    Object.defineProperty(global, 'Array', {
      value: Array,
    })
  })

  afterEach(() => {
    global = Object.assign({}, globalTemp);
    disableFetchMocks();
  })


  test('Initialize fetch request with Request Init', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    enableFetchMocks();

    window.fetch = async (input, init) => {
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 1 });

    XMLHttpRequest = global.XMLHttpRequest

    const response = await window.fetch('testUrl',{method:"POST"})

    expect(response.statusText).toEqual("okDone")

  });

  test('Initialize fetch request with Request URL', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    enableFetchMocks();

    window.fetch = async (input, init) => {
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 1 });

    XMLHttpRequest = global.XMLHttpRequest

    const response = await window.fetch('testUrl')

    expect(response.statusText).toEqual("okDone")

  });

  test('Initialize fetch request with Request', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload


    window.fetch = async (input, init) => {
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 1 });

    XMLHttpRequest = global.XMLHttpRequest

    const response = await window.fetch(new Request("testURl"))
    
    expect(response.statusText).toEqual("okDone")

  });


  test('use the heavy http flow with body less than the threshold', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    enableFetchMocks();

    window.fetch = async (input, init) => {
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 12000 });

    XMLHttpRequest = global.XMLHttpRequest
   
   
    const request = new Request("testURl", {method:"POST"});

    request.clone = () =>{
      const requestCloned = new Request("testURl", {method:"POST"})
      Object.defineProperty(requestCloned, "body", { value: new MockReadableStream("test")});
      return requestCloned
    }

    const response = await window.fetch(request)

    expect(response.statusText).toEqual("okDone")

  });


  test('use the heavy http flow with body greater than the threshold', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    enableFetchMocks();

    window.fetch = async (input, init) => {
      const requestObj = new Request(input);
      if (requestObj.headers.get(X_HEAVY_HTTP_ACTION) ===X_HEAVY_HTTP_ACTIONS.INIT){
        return new Response('testS3URL', { status: 200, statusText: "ok" })
      }
      if (requestObj.url === 'testS3URL'){
        return new Response('', { status: 200, statusText: "ok" })
      }
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 1 });

    XMLHttpRequest = global.XMLHttpRequest
   
    const request = new Request("testURl", {method:"POST"});

    request.clone = () =>{
      const requestCloned = new Request("testURl", {method:"POST"})
      Object.defineProperty(requestCloned, "body", { value: new MockReadableStream(new Uint8Array(10))});
      return requestCloned
    }

    const response = await window.fetch(request)

    expect(response.statusText).toEqual("okDone")

  });


  test('use the heavy http flow with body greater than the threshold and failed during the process', async () => {

    const server = newServer();

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    enableFetchMocks();

    window.fetch = async (input, init) => {
      const requestObj = new Request(input);
      if (requestObj.headers.get(X_HEAVY_HTTP_ACTION) ===X_HEAVY_HTTP_ACTIONS.INIT){
          throw new Error();
      }
      return new Response('', { status: 200, statusText: "okDone" })
    }

    initialize({ requestThreshold: 1 });

    XMLHttpRequest = global.XMLHttpRequest
   
    const request = new Request("testURl", {method:"POST"});

    request.clone = () =>{
      const requestCloned = new Request("testURl", {method:"POST"})
      Object.defineProperty(requestCloned, "body", { value: new MockReadableStream(new Uint8Array(10))});
      return requestCloned
    }

    await expect(window.fetch(request)).rejects.toThrow()

  });


  test('XML Request with incorrect params ', () => {

    expect(() => initialize({ requestThreshold: -12 })).toThrow(expect.objectContaining({ message: 'Request Threshold must be a non-negative value' }));

  });


  test('XML Request with no request body ', done => {
    const server = newServer({
      get: ['/my/url', {
        headers: { 'Content-Type': 'application/json' },
        body: '{ "message": "Success!" }',
      }],
    });

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 100 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();
    let isNotExecuted = true;
    let isExecuted = false;
    let isOnloadExecuted = false;
    let isOnloadStartExecuted = false;

    const loadedNotExFunc = function () {
      try {
        isNotExecuted = false;
      } catch (error) {
        done(error);
      }
    }

    xhr.upload.removeEventListener('loadend', loadedNotExFunc)

    xhr.upload.addEventListener('loadend', loadedNotExFunc)

    xhr.onreadystatechange = () => {
      isExecuted = true;
    }

    xhr.onload = () => {
      isOnloadExecuted = true;
    }


    xhr.onloadstart = () => {
      isOnloadStartExecuted = true;
    }


    xhr.open("GET", "/my/url")
    xhr.setRequestHeader("x-test", "data")

    xhr.addEventListener('loadend', function () {
      try {
        expect(isNotExecuted).toBe(true)
        expect(isExecuted).toBe(true)
        expect(isOnloadExecuted).toBe(true)
        expect(isOnloadStartExecuted).toBe(true)
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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 100 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 100 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 100 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();


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
        server.remove()
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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 100 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

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


    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();



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

      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS) {
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
      } else {
        request.respond(200, {}, '/my/url');
      }
    })

    server.put('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Success!\" }")
        expect(requestOrder).toStrictEqual(['init', null, 'send-success'])
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
  });


  test('Failed XML Request with body larger than the config limit', done => {

    const server = newServer();
    const requestOrder: any[] = [];


    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS) {
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Success!" }');
      }
      else if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_ERROR) {
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "Error!" }');
      }
      else {
        request.respond(200, {}, '/my/url');
      }
    })

    server.put('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"Error!\" }")
        expect(requestOrder).toStrictEqual(['init', null, 'send-error'])
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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

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




  test('XML Request with body larger than the config limit - abort', done => {
    const server = newServer();

    server.post('/my/url', (request) => {
      request.respond(500, { 'Content-Type': 'application/json' }, '{ "message": "error!" }');
    })

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    let isExecuted = false;
    let isAbortExecuted = false;

    xhr.addEventListener('abort', function () {
      isExecuted = true;
    })
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
        expect(isAbortExecuted).toBe(true)
        expect(isExecuted).toBe(true)
        done();
      } catch (error) {
        done(error);
      }
    })

    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
    xhr.onabort = () => {
      isAbortExecuted = true;
    }
    xhr.abort();
  })

  test('XML Request with body larger than the config limit - error', done => {
    const server = newServer();

    const requestOrder: any[] = [];

    server.post('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS) {
        request.setNetworkError();
      }
      else {
        request.respond(200, {}, '/my/url');
      }
    })

    server.put('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })
    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    let isErrorExecuted = false;

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
        expect(isErrorExecuted).toBe(true)
        done();
      } catch (error) {
        done(error);
      }
    })

    xhr.send(JSON.stringify({ 'test': 'test-legthy-data' }));
    xhr.onerror = () => {
      isErrorExecuted = true;
    }
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
        request.respond(200, {}, '/my/url');
      }
    })
    server.put('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })
    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    xhr.onprogress = () => {
      expect(true);
      done();
    }
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

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 20000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

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

      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS) {
        request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');
      } else {
        request.respond(200, {}, '/my/url');
      }
    })

    server.put('/my/url', (request) => {
      requestOrder.push(request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION))
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })


    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

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

  test('handle response with larger body successfully', done => {
    const server = newServer();

    server.post('/my/url', (request) => {

      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.DOWNLOAD_END) {
        request.respond(200, {}, '');
      } else {
        request.respond(200, { [X_HEAVY_HTTP_ACTION]: X_HEAVY_HTTP_ACTIONS.DOWNLOAD }, `${HEAVY_RESPONSE}|11111111|/my/url`);
      }
    })

    server.get('/my/url', (request) => {
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })


    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    let isNotExecuted = true;

    const onLoadEndFunction = () => {
      isNotExecuted = false;
    }


    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', onLoadEndFunction)
    xhr.removeEventListener('loadend', onLoadEndFunction)
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isNotExecuted).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data1111' }));

  })



  test('handle response with larger body successfully when headers are already sent', done => {
    const server = newServer();

    server.post('/my/url', (request) => {
      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.DOWNLOAD_END) {
        request.respond(200, {}, '');
      } else {
        request.respond(200, {}, `${HEAVY_RESPONSE}|11111111|/my/url`);
      }
    })

    server.get('/my/url', (request) => {
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })


    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    let isNotExecuted = true;

    const onLoadEndFunction = () => {
      isNotExecuted = false;
    }

    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', onLoadEndFunction)
    xhr.removeEventListener('loadend', onLoadEndFunction)
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isNotExecuted).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data1111' }));

  })


  test('handle response with smaller body successfully with removed download-listeners', done => {
    const server = newServer();

    server.post('/my/url', (request) => {
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');
    })

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload

    let isNotExecuted = true;

    const onLoadEndFunction = () => {
      isNotExecuted = false;
    }


    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', onLoadEndFunction)
    xhr.removeEventListener('loadend', onLoadEndFunction)
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("{ \"message\": \"success!\" }")
        expect(isNotExecuted).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data1111' }));

  })

  test('handle response with larger body with timeout', done => {
    const server = newServer();

    let isNotExecuted = true;
    server.post('/my/url', (request) => {
      if (request.requestHeaders.getHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.DOWNLOAD_END) {
        request.respond(200, {}, '');
      } else {
        request.setRequestTimeout()
      }
    })

    server.get('/my/url', (request) => {
      isNotExecuted = false;
      request.respond(200, { 'Content-Type': 'application/json' }, '{ "message": "success!" }');

    })

    server.install();

    const xhrPredefined = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhrPredefined.upload

    initialize({ requestThreshold: 2000 });

    XMLHttpRequest = global.XMLHttpRequest

    const xhr = new XMLHttpRequest();

    XMLHttpRequestUpload.prototype = xhr.upload
    xhr.timeout = 10;
    let isTimeoutCaptured = false;
    xhr.ontimeout = () => {
      isTimeoutCaptured = true;
    }
    xhr.open("POST", "/my/url")
    xhr.setRequestHeader("x-test", "data")
    xhr.addEventListener('loadend', function () {
      try {
        expect(xhr.response).toStrictEqual("")
        expect(isNotExecuted).toBe(true);
        expect(isTimeoutCaptured).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    })
    xhr.send(JSON.stringify({ 'test': 'test-legthy-data1111' }));

  })



});

