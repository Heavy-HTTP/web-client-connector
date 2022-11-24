import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS, X_HEAVY_HTTP_ID } from "./constant";

interface ClientConfig {
    contentSize: number
}

export const initialize = (clientConfig: ClientConfig): void => {

    if (clientConfig.contentSize < 0) {
        throw new Error("Content Size must be a non-negative value")
    }

    const XMLHttpRequestUploadAddEventListner = XMLHttpRequestUpload.prototype.addEventListener;
    const XMLHttpRequestUploadRemoveEventListner = XMLHttpRequestUpload.prototype.removeEventListener;

    const XMLHttpRequestDownloadAddEventListner = XMLHttpRequest.prototype.addEventListener;
    const XMLHttpRequestDownloadRemoveEventListner = XMLHttpRequest.prototype.removeEventListener;

    function getContentLength(content: Document | Blob | FormData | URLSearchParams | ArrayBufferView | ArrayBuffer | string): number {

        if (content instanceof Blob) {
            return content.size;
        }

        if (content instanceof FormData) {
            // For Content-Disposition
            const contentDispositionLength = 50; // estimated max value
            // According to RFC1521 the maximum length of boundary is 70. But the browser implementations are usually much lower.
            const boundaryLength = 70; // estimated max value
            let length = 0;
            const entries = content.entries();
            for (const [key, value] of entries) {
                length += key.length + boundaryLength + contentDispositionLength;
                if (typeof value === 'object') {
                    length += value.size;
                } else {
                    length += String(value).length;
                }
            }
            return length;
        }

        if (content instanceof URLSearchParams) {
            return content.toString().length;
        }

        if (content instanceof ArrayBuffer
            || content instanceof DataView
            || content instanceof BigInt64Array
            || content instanceof BigUint64Array
            || content instanceof Float32Array
            || content instanceof Float64Array
            || content instanceof Int8Array
            || content instanceof Int16Array
            || content instanceof Int32Array
            || content instanceof Uint8Array
            || content instanceof Uint8ClampedArray
            || content instanceof Uint32Array
            || content instanceof Uint16Array) {
            return content.byteLength;
        }

        if (typeof content === 'string') {
            return content.length;
        }

        if (content instanceof Document) {
            const serializer = new XMLSerializer();
            return serializer.serializeToString(content).length;
        }
        // Unknown content type! Hence heavy-http wouldn't interfere
        return 0

    }

    const _originalXMLHttpRequest = XMLHttpRequest;


    class XMLHttpRequestProxy implements XMLHttpRequest {

        originalXMLHttpRequest = new _originalXMLHttpRequest();
        _downloadXMLHttpRequest: XMLHttpRequestProxy | null


        private uploadListenerContext = {
            addedEventListeners: <Array<(xmlHttpRequest: XMLHttpRequest) => void>>[],
            removedEventListeners: <Array<(xmlHttpRequest: XMLHttpRequest) => void>>[],
        }
        private downloadListenerContext = {
            addedEventListeners: <Array<(xmlHttpRequest: XMLHttpRequest) => void>>[],
            removedEventListeners: <Array<(xmlHttpRequest: XMLHttpRequest) => void>>[],
            functionReferences: new Map(),
        }

        private requestContext = {
            method: <string>"",
            url: <string | URL>"",
            username: <string | null | undefined>null,
            password: <string | null | undefined>null,
            headers: new Map(),
        }

        private _isEventListenerObject(obj: any): obj is EventListenerObject {
            return 'handleEvent' in obj;
        }

        private _isHeavyResponse() {
            return this.getAllResponseHeaders() !== null && this.getAllResponseHeaders().includes(X_HEAVY_HTTP_ACTION) && this.getResponseHeader(X_HEAVY_HTTP_ACTION) === X_HEAVY_HTTP_ACTIONS.DOWNLOAD

        }

        private _setStatus(xmlHttpRequestSource: XMLHttpRequest) {
            this.readyState = xmlHttpRequestSource.readyState;
            this.response = xmlHttpRequestSource.response;
            this.responseText = xmlHttpRequestSource.responseText;
            this.responseType = xmlHttpRequestSource.responseType;
            this.responseXML = xmlHttpRequestSource.responseXML;
            this.status = xmlHttpRequestSource.status;
            this.statusText = xmlHttpRequestSource.statusText;
        }

        private _setResponseData(xmlHttpRequestSource: XMLHttpRequest) {
            this.readyState = xmlHttpRequestSource.readyState;
            this.response = xmlHttpRequestSource.response;
            this.responseText = xmlHttpRequestSource.responseText;
            this.responseType = xmlHttpRequestSource.responseType;
            this.responseXML = xmlHttpRequestSource.responseXML;
        }

        constructor() {
            const self = this;
            this._downloadXMLHttpRequest = null;
            this.originalXMLHttpRequest.upload.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
                self.uploadListenerContext.addedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadAddEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
            };

            this.originalXMLHttpRequest.upload.removeEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
                self.uploadListenerContext.removedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadRemoveEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
            };

            this.upload = self.originalXMLHttpRequest.upload;
            this.withCredentials = self.originalXMLHttpRequest.withCredentials;
            this.readyState = XMLHttpRequest.UNSENT;
            this.isAborted = false;
            this.response = self.originalXMLHttpRequest.response;
            this.responseText = self.originalXMLHttpRequest.responseText;
            this.responseType = self.originalXMLHttpRequest.responseType;
            this.responseURL = self.originalXMLHttpRequest.responseURL;
            this.responseXML = self.originalXMLHttpRequest.responseXML;
            this.status = self.originalXMLHttpRequest.status;
            this.statusText = self.originalXMLHttpRequest.statusText;
            this.timeout = self.originalXMLHttpRequest.timeout;
            this.isTimedOut = false;
            this.DONE = self.originalXMLHttpRequest.DONE
            this.HEADERS_RECEIVED = self.originalXMLHttpRequest.HEADERS_RECEIVED;
            this.LOADING = self.originalXMLHttpRequest.LOADING;
            this.OPENED = self.originalXMLHttpRequest.OPENED;
            this.UNSENT = self.originalXMLHttpRequest.UNSENT;
            this.onreadystatechange = null;
            this.originalXMLHttpRequest.onreadystatechange = function (event) {
                if (self.originalXMLHttpRequest.readyState === 4) {
                    if (!self._isHeavyResponse()) {
                        self._setStatus(self.originalXMLHttpRequest);
                        if (self.onreadystatechange) {
                            return self.onreadystatechange(event);
                        }
                    }

                } else {
                    self._setStatus(self.originalXMLHttpRequest);
                    if (self.onreadystatechange) {
                        return self.onreadystatechange(event);
                    }
                }

            };
            this.onabort = null;
            self.originalXMLHttpRequest.onabort = (event) => {
                self._setStatus(self.originalXMLHttpRequest);
                if (self.onabort) {
                    self.onabort(event);
                }
            }
            this.onerror = null;
            this.originalXMLHttpRequest.onerror = (event) => {
                self._setStatus(self.originalXMLHttpRequest);
                if (self.onerror) {
                    self.onerror(event);
                }
            }
            this.onload = null;
            this.originalXMLHttpRequest.onload = (event) => {

                if (!self._isHeavyResponse()) {
                    self._setStatus(self.originalXMLHttpRequest);
                    if (self.onload) {
                        self.onload(event);
                    }
                }
            }

            this.onloadstart = null;
            this.originalXMLHttpRequest.onloadstart = (event) => {
                if (!self._isHeavyResponse()) {
                    self._setStatus(self.originalXMLHttpRequest);
                    if (self.onloadstart) {
                        self.onloadstart(event);
                    }
                }
            }
            this.onprogress = null;
            this.originalXMLHttpRequest.onprogress = (event) => {
                if (!self._isHeavyResponse()) {
                    self._setStatus(self.originalXMLHttpRequest);
                    if (self.onprogress) {
                        self.onprogress(event);
                    }
                }
            }
            this.onloadend = null;
            this.originalXMLHttpRequest.onloadend = (event) => {
                if (!self._isHeavyResponse()) {
                    self._setStatus(self.originalXMLHttpRequest);
                    if (this.onloadend) {
                        this.onloadend(event);
                    }
                } else {
                    const downloadXMLRequest = new XMLHttpRequestProxy();            
                    self.status = self.originalXMLHttpRequest.status;
                    self.statusText = self.originalXMLHttpRequest.statusText;

                    downloadXMLRequest.open('GET', self.originalXMLHttpRequest.responseText);
                    this._downloadXMLHttpRequest = downloadXMLRequest;
                    self.addEventListener('timeout', downloadXMLRequest.abort);

                    self.abort = () => {
                        downloadXMLRequest.abort();
                        self.originalXMLHttpRequest.abort();
                    }

                    for (const addedEventListner of self.downloadListenerContext.addedEventListeners) {
                        addedEventListner(downloadXMLRequest.originalXMLHttpRequest);
                    }

                    for (const removedEventListner of self.downloadListenerContext.removedEventListeners) {
                        removedEventListner(downloadXMLRequest.originalXMLHttpRequest);
                    }

                    downloadXMLRequest.onabort = () => {
                        const abortXHR = new XMLHttpRequest();
                        const httpId = self.getResponseHeader(X_HEAVY_HTTP_ID) || 'not-found';
                        abortXHR.open(self.requestContext.method, self.requestContext.url, true, self.requestContext.username, self.requestContext.password);
                        abortXHR.setRequestHeader(X_HEAVY_HTTP_ID, httpId);
                        abortXHR.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.DOWNLOAD_ABORT);
                        abortXHR.send();
                    }
                    downloadXMLRequest.onerror = self.onerror
                    downloadXMLRequest.onload =()=>{
                        this._setResponseData(downloadXMLRequest)
                        if (self.onload) {
                            self.onload(event)
                        }
                    } 
                    downloadXMLRequest.onloadend = (event) => {
                        const downloadCompletedXHR = new XMLHttpRequest();
                        const httpId = self.getResponseHeader(X_HEAVY_HTTP_ID) || 'not-found';
                        downloadCompletedXHR.open(self.requestContext.method, self.requestContext.url, true, self.requestContext.username, self.requestContext.password);
                        downloadCompletedXHR.setRequestHeader(X_HEAVY_HTTP_ID, httpId);
                        downloadCompletedXHR.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.DOWNLOAD_END);
                        downloadCompletedXHR.send();
                        this._setResponseData(downloadXMLRequest)
                        if (self.onloadend) {
                            self.onloadend(event)
                        }
                    };
                    downloadXMLRequest.onloadstart =()=>{
                        this._setResponseData(downloadXMLRequest)
                        if (self.onloadstart) {
                            self.onloadstart(event)
                        }
                    } 
                    downloadXMLRequest.onprogress =()=>{
                        this._setResponseData(downloadXMLRequest)
                        if (self.onprogress) {
                            self.onprogress(event)
                        }
                    } 
                    if (!self.isAborted && !self.isTimedOut) {
                        this._downloadXMLHttpRequest = downloadXMLRequest;
                        downloadXMLRequest.send();
                    } else {
                        downloadXMLRequest.abort();
                    }
                }

            }
            this.ontimeout = null;
            this.originalXMLHttpRequest.ontimeout = (event) => {
                this.isTimedOut = true;
                self._setStatus(self.originalXMLHttpRequest);
                if (self.ontimeout) {
                    self.ontimeout(event);
                }

            }
        }

        onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;

        DONE: number;
        HEADERS_RECEIVED: number;
        LOADING: number;
        OPENED: number;
        UNSENT: number;
        readyState: number;
        response: any;
        responseText: string;
        responseType: XMLHttpRequestResponseType;
        responseURL: string;
        responseXML: Document | null;
        status: number;
        statusText: string;
        timeout: number;
        upload: XMLHttpRequestUpload;
        withCredentials: boolean;
        isAborted: boolean;
        isTimedOut: boolean;
        abort(): void {
            this.isAborted = true;
            this.originalXMLHttpRequest.abort();
        }
        getAllResponseHeaders(): string {
            return this.originalXMLHttpRequest.getAllResponseHeaders();

        }
        getResponseHeader(name: string): string | null {
            return this.originalXMLHttpRequest.getResponseHeader(name);
        }
        open(method: string, url: string | URL): void;
        open(method: string, url: string | URL, async: boolean, username?: string | null | undefined, password?: string | null | undefined): void;
        open(method: string, url: string | URL, async?: boolean | null | undefined, username?: string | null | undefined, password?: string | null | undefined) {
            this.requestContext.method = method;
            this.requestContext.url = url;
            this.requestContext.username = username;
            this.requestContext.password = password;

            this.originalXMLHttpRequest.open(method, url, async = true, username = null, password = null)
        }

        overrideMimeType(mime: string): void {
            this.originalXMLHttpRequest.overrideMimeType(mime);
        }
        send(body?: Document | XMLHttpRequestBodyInit | null | undefined): void {

            const requestContext = this.requestContext;

            this.originalXMLHttpRequest.timeout = this.timeout;

            if (body && getContentLength(body) > clientConfig.contentSize && !requestContext.headers.has(X_HEAVY_HTTP_ID)) {

                const currentRequest = this;

                let contentType: string | null = null;

                const beginXMLRequest = new XMLHttpRequest();
                beginXMLRequest.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
                for (const [key, value] of requestContext.headers) {
                    if (key.toLowerCase() === 'content-type') {
                        contentType = value
                    }
                    beginXMLRequest.setRequestHeader(key, value);
                }

                beginXMLRequest.withCredentials = this.withCredentials;
                const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
                const uniqueId = uint32.toString(16);
                beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.INIT);

                currentRequest.abort = function () {
                    beginXMLRequest.abort();
                    const abortXHR = new XMLHttpRequest()
                    abortXHR.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
                    abortXHR.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                    abortXHR.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ABORT);
                    abortXHR.send();
                    currentRequest.originalXMLHttpRequest.abort();
                }

                const listeners = {
                    onabort: currentRequest.upload.onabort,
                    onerror: currentRequest.upload.onerror,
                    onload: currentRequest.upload.onload,
                    onloadend: currentRequest.upload.onloadend,
                    onloadstart: currentRequest.upload.onloadstart,
                    onprogress: currentRequest.upload.onprogress,
                    ontimeout: currentRequest.upload.ontimeout
                }

                currentRequest.upload.onabort = null;
                currentRequest.upload.onerror = null;
                currentRequest.upload.onload = null;
                currentRequest.upload.onloadend = null;
                currentRequest.upload.onloadstart = null;
                currentRequest.upload.onprogress = null;
                currentRequest.upload.ontimeout = null;

                beginXMLRequest.addEventListener("loadend", function () {
                    if (beginXMLRequest.status !== 200) {

                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                        return currentRequest.originalXMLHttpRequest.send();
                    }

                    const uploadXHR = new XMLHttpRequest();

                    uploadXHR.open("PUT", beginXMLRequest.responseText);
                    uploadXHR.upload.onabort = listeners.onabort;
                    uploadXHR.upload.onerror = listeners.onerror;
                    uploadXHR.upload.onload = listeners.onload;
                    uploadXHR.upload.onloadend = listeners.onloadend;
                    uploadXHR.upload.onloadstart = listeners.onloadstart;
                    uploadXHR.upload.onprogress = listeners.onprogress;
                    uploadXHR.upload.ontimeout = listeners.ontimeout;

                    for (const eventListener of currentRequest.uploadListenerContext.addedEventListeners) {
                        eventListener(uploadXHR)
                    }
                    for (const eventListener of currentRequest.uploadListenerContext.removedEventListeners) {
                        eventListener(uploadXHR)
                    }

                    uploadXHR.addEventListener("loadend", function () {
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        if (uploadXHR.status === 200) {
                            currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS);
                            currentRequest.originalXMLHttpRequest.send(" ");
                        } else {
                            currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                            currentRequest.originalXMLHttpRequest.send();
                        }
                    });

                    uploadXHR.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                    if (contentType !== null) {
                        uploadXHR.setRequestHeader('content-type', contentType)
                    }
                    currentRequest.abort = function () {
                        beginXMLRequest.abort();
                        uploadXHR.abort()
                        const abortXHR = new XMLHttpRequest()
                        abortXHR.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
                        abortXHR.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        abortXHR.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ABORT);
                        abortXHR.send();
                        currentRequest.originalXMLHttpRequest.abort();
                    }

                    if (!currentRequest.isAborted) {
                        uploadXHR.send(body);
                    } else {
                        uploadXHR.abort();
                    }

                });
                if (!currentRequest.isAborted) {
                    beginXMLRequest.send();
                } else {
                    beginXMLRequest.abort();
                }

            } else {
                for (const eventListener of this.uploadListenerContext.addedEventListeners) {
                    eventListener(this)
                }
                for (const eventListener of this.uploadListenerContext.removedEventListeners) {
                    eventListener(this)
                }

                this.originalXMLHttpRequest.send(body);
            }
        }
        setRequestHeader(name: string, value: string): void {
            this.requestContext.headers.set(name, value);
            this.originalXMLHttpRequest.setRequestHeader(name, value);
        }

        addEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void {
            const mainEventHandler = (event: Event) => {
                if (!this._isHeavyResponse()) {
            
                    this._setStatus(this.originalXMLHttpRequest);
                
                    if (this._isEventListenerObject(listener)) {
                        listener.handleEvent(event);
                    } else {
                        listener(event)
                    }
                
                } 
            }

            const subEventHandler = (event: Event) => {
                if (this._downloadXMLHttpRequest && this._downloadXMLHttpRequest.readyState > 0) {

                    this._setResponseData(this._downloadXMLHttpRequest.originalXMLHttpRequest)
                    if (this._isEventListenerObject(listener)) {
                        listener.handleEvent(event);
                    } else {
                        listener(event)
                    }
                
                } 
            }

            this.downloadListenerContext.functionReferences.set(listener, [mainEventHandler,subEventHandler]);
            this.downloadListenerContext.addedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => {
                XMLHttpRequestDownloadAddEventListner.apply(xmlHttpRequest, [type, subEventHandler, options])
            });
            this.originalXMLHttpRequest.addEventListener(type, mainEventHandler, options);
        }
        removeEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void {
            const [mainEventHandler,subsubEventHandler] = this.downloadListenerContext.functionReferences.get(listener);
            this.downloadListenerContext.removedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestDownloadRemoveEventListner.apply(xmlHttpRequest, [type, subsubEventHandler, options]))
            this.originalXMLHttpRequest.removeEventListener(type, mainEventHandler, options);
        }
        onabort: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        onerror: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        onload: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        onloadend: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        onprogress: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null;
        dispatchEvent(event: Event): boolean {
            return this.originalXMLHttpRequest.dispatchEvent(event);
        }
    }

    Object.defineProperty(global, 'XMLHttpRequest', {
        value: XMLHttpRequestProxy,
    });

}
