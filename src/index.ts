import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS, X_HEAVY_HTTP_CONTENT_LENGTH, X_HEAVY_HTTP_ID } from "./constant";

interface ClientConfig {
    contentSize: number
}


interface Transporter {
    transport: (responseText: string, preHook: (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => void
}

export const initialize = (clientConfig: ClientConfig, transporter: Transporter): void => {

    if (clientConfig.contentSize < 0) {
        throw new Error("Content Size must be a non-negative integer")
    }

    const XMLHttpRequestSend = XMLHttpRequest.prototype.send;
    const XMLHttpRequestOpen = XMLHttpRequest.prototype.open;
    const XMLHttpRequestAbort = XMLHttpRequest.prototype.abort;
    const XMLHttpRequestSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const XMLHttpRequestUploadAddEventListner = XMLHttpRequestUpload.prototype.addEventListener;
    const XMLHttpRequestUploadRemoveEventListner = XMLHttpRequestUpload.prototype.removeEventListener;

    const contextMap = new Map();

    XMLHttpRequest.prototype.open = function (method, url, async: boolean = true, username?: string | null, password?: string | null) {
        const context = {
            method,
            url,
            username,
            password,
            headers: {},
        }

        const listenerContext = contextMap.get(this.upload);
        if (!listenerContext) {
            contextMap.set(this.upload, {
                addedEventListeners: [],
                removedEventListeners: [],
            });
        }
        contextMap.set(this, context);
        return XMLHttpRequestOpen.apply(this, [method, url, async, username, password]);
    }

    XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
        const context = contextMap.get(this);
        if (context) {
            context.headers[key] = value;
            contextMap.set(this, context);
        }

        return XMLHttpRequestSetRequestHeader.apply(this, [key, value]);

    };

    XMLHttpRequestUpload.prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        let listenerContext = contextMap.get(this);
        if (!listenerContext) {
            listenerContext = {
                addedEventListeners: [],
                removedEventListeners: [],
            }
        }
        listenerContext.addedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadAddEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
        contextMap.set(this, listenerContext);
    };

    XMLHttpRequestUpload.prototype.removeEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        let listenerContext = contextMap.get(this);
        if (!listenerContext) {
            listenerContext = {
                addedEventListeners: [],
                removedEventListeners: [],
            }
        }
        listenerContext.removedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadRemoveEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
        contextMap.set(this, listenerContext);
    };

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


    XMLHttpRequest.prototype.send = function (data) {
        const requestContext = contextMap.get(this);
        const listenerContext = contextMap.get(this.upload)

        if (data && getContentLength(data) > clientConfig.contentSize && !(X_HEAVY_HTTP_ID in requestContext.headers)) {

            let contentType: string | null = null;

            const beginXMLRequest = new XMLHttpRequest();
            beginXMLRequest.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
            for (const headerKey in requestContext.headers) {
                if (headerKey.toLowerCase() === 'content-type') {
                    contentType = requestContext.headers[headerKey]
                }
                beginXMLRequest.setRequestHeader(headerKey, requestContext.headers[headerKey]);
            }

            beginXMLRequest.withCredentials = this.withCredentials;
            const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
            const uniqueId = uint32.toString(16);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.INIT);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_CONTENT_LENGTH, data.toString().length.toString())
            const currentRequest = this;
            currentRequest.abort = function () {
                beginXMLRequest.abort();
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                contextMap.delete(currentRequest);
                contextMap.delete(currentRequest.upload);
                XMLHttpRequestSend.apply(currentRequest);
                XMLHttpRequestAbort.apply(currentRequest);
            }
            currentRequest.addEventListener('timeout', beginXMLRequest.abort);
            beginXMLRequest.addEventListener("error", function () {
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                contextMap.delete(currentRequest);
                contextMap.delete(currentRequest.upload);
                XMLHttpRequestSend.apply(currentRequest);
            })

            const listeners = {
                onabort: currentRequest.upload.onabort,
                onerror: currentRequest.upload.onerror,
                onload: currentRequest.upload.onload,
                onloadend: currentRequest.upload.onloadend,
                onloadstart: currentRequest.upload.onloadstart,
                onprogress: currentRequest.upload.onprogress,
                ontimeout: currentRequest.upload.ontimeout
            }

            const listenerHook = (xmlHttpRequest: XMLHttpRequest) => {
                xmlHttpRequest.upload.onabort = listeners.onabort;
                xmlHttpRequest.upload.onerror = listeners.onerror;
                xmlHttpRequest.upload.onload = listeners.onload;
                xmlHttpRequest.upload.onloadend = listeners.onloadend;
                xmlHttpRequest.upload.onloadstart = listeners.onloadstart;
                xmlHttpRequest.upload.onprogress = listeners.onprogress;
                xmlHttpRequest.upload.ontimeout = listeners.ontimeout;

                for (const eventListener of listenerContext.addedEventListeners) {
                    eventListener(xmlHttpRequest)
                }
                for (const eventListener of listenerContext.removedEventListeners) {
                    eventListener(xmlHttpRequest)
                }
            }

            this.upload.onabort = null;
            this.upload.onerror = null;
            this.upload.onload = null;
            this.upload.onloadend = null;
            this.upload.onloadstart = null;
            this.upload.onprogress = null;
            this.upload.ontimeout = null;

            beginXMLRequest.addEventListener("load", function () {
                if (beginXMLRequest.status !== 200) {
                    currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                    currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                    contextMap.delete(currentRequest);
                    contextMap.delete(currentRequest.upload);
                    XMLHttpRequestSend.apply(currentRequest);
                }

                const preHook = function (xmlHttpRequest: XMLHttpRequest, abortFunction: () => void) {
                    xmlHttpRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                    if (contentType !== null) {
                        xmlHttpRequest.setRequestHeader('content-type', contentType)
                    }
                    currentRequest.abort = function () {
                        beginXMLRequest.abort();
                        abortFunction();
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                        contextMap.delete(currentRequest);
                        contextMap.delete(currentRequest.upload);
                        XMLHttpRequestSend.apply(currentRequest);
                        XMLHttpRequestAbort.apply(currentRequest);
                    }
                    currentRequest.addEventListener('timeout', abortFunction)

                }
                const postHook = function (isSuccess: boolean) {
                    if (isSuccess) {
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_SUCCESS);
                    } else {
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                    }
                    contextMap.delete(currentRequest);
                    contextMap.delete(currentRequest.upload);
                    XMLHttpRequestSend.apply(currentRequest, [" "]);
                }
                transporter.transport(beginXMLRequest.responseText, preHook, postHook, data, listenerHook)
            });
            beginXMLRequest.send();

        } else {
            for (const eventListener of listenerContext.addedEventListeners) {
                eventListener(this)
            }
            for (const eventListener of listenerContext.removedEventListeners) {
                eventListener(this)
            }
            contextMap.delete(this);
            contextMap.delete(this.upload);
            XMLHttpRequestSend.apply(this, [data]);
        }

    };
}
