import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS, X_HEAVY_HTTP_ID } from "./constant";

interface ClientConfig {
    size: number
}


interface Transporter {
    transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, listenerHook: (xmlHttpRequest: XMLHttpRequest) => void) => void
}

export const initialize = (clientConfig: ClientConfig, transporter: Transporter): void => {

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

        const listenerContext = {
            addedEventListeners: [],
            removedEventListeners: [],
        }
        contextMap.set(this, context);
        contextMap.set(this.upload, listenerContext);
        return XMLHttpRequestOpen.apply(this, [method, url, async, username, password]);
    }

    XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
        const context = contextMap.get(this);
        context.headers[key] = value;
        contextMap.set(this, context);
        return XMLHttpRequestSetRequestHeader.apply(this, [key, value]);

    };

    XMLHttpRequestUpload.prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        const listenerContext = contextMap.get(this);
        listenerContext.addedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadAddEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
        contextMap.set(this, listenerContext);
    };

    XMLHttpRequestUpload.prototype.removeEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        const listenerContext = contextMap.get(this);
        listenerContext.removedEventListeners.push((xmlHttpRequest: XMLHttpRequest) => XMLHttpRequestUploadRemoveEventListner.apply(xmlHttpRequest.upload, [type, listener, options]))
        contextMap.set(this, listenerContext);
    };


    XMLHttpRequest.prototype.send = function (data) {

        const requestContext = contextMap.get(this);
        const listenerContext = contextMap.get(this.upload)
        // fix length issue for document types
        if (data && data.toString().length > clientConfig.size && !(X_HEAVY_HTTP_ID in requestContext.headers)) {

            const beginXMLRequest = new XMLHttpRequest();
            beginXMLRequest.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
            for (const headerKey in requestContext.headers) {
                beginXMLRequest.setRequestHeader(headerKey, requestContext.headers[headerKey]);
            }

            beginXMLRequest.withCredentials = this.withCredentials;
            const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
            const uniqueId = uint32.toString(16);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.INIT);
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

                const preHook = function (abortFunction: () => void) {
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
                    XMLHttpRequestSend.apply(currentRequest);
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
