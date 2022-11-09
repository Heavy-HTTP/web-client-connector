import { X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS, X_HEAVY_HTTP_ID } from "./constant";

interface ClientConfig {
    size: number
}


interface Transporter {
    transport: (responseText: string, preHook: (abortFunction: () => void) => void, postHook: (isSuccess: boolean) => void, body: Document | XMLHttpRequestBodyInit, uploadEventListners: XMLHttpRequestUpload) => void
}

export const initialize = (clientConfig: ClientConfig, transporter: Transporter): void => {

    const XMLHttpRequestSend = XMLHttpRequest.prototype.send;
    const XMLHttpRequestOpen = XMLHttpRequest.prototype.open;
    const XMLHttpRequestAbort = XMLHttpRequest.prototype.abort;
    const XMLHttpRequestSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    const contextMap = new Map();

    XMLHttpRequest.prototype.open = function (method, url, async: boolean = true, username?: string | null, password?: string | null) {
        const context = {
            method,
            url,
            username,
            password,
            headers: {}
        }
        contextMap.set(this, context);
        return XMLHttpRequestOpen.apply(this, [method, url, async, username, password]);

    }

    XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
        const context = contextMap.get(this);
        context.headers[key] = value;
        contextMap.set(this, context);
        return XMLHttpRequestSetRequestHeader.apply(this, [key, value]);

    };

    XMLHttpRequest.prototype.send = function (data) {

        const requestContext = contextMap.get(this);
        // fix length issue for document types
        if (data && data.toString().length > clientConfig.size && !(X_HEAVY_HTTP_ID in requestContext.headers)) {
            const beginXMLRequest = new XMLHttpRequest();
            const uploadEventListners = this.upload;
            Object.defineProperty(this, 'upload', {})
            beginXMLRequest.open(requestContext.method, requestContext.url, true, requestContext.username, requestContext.password);
            for (const k in requestContext.headers) {
                beginXMLRequest.setRequestHeader(k, requestContext.headers[k]);
            }
            beginXMLRequest.withCredentials = this.withCredentials;
            const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
            const uniqueId = uint32.toString(16);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
            beginXMLRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, "init");
            const currentRequest = this;
            currentRequest.abort = function(){
                beginXMLRequest.abort();
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                contextMap.delete(currentRequest);
                XMLHttpRequestSend.apply(currentRequest);
                XMLHttpRequestAbort.apply(currentRequest);
            }
            currentRequest.addEventListener('timeout', beginXMLRequest.abort);
            beginXMLRequest.addEventListener("error", function () {
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.INIT);
                contextMap.delete(currentRequest);
                XMLHttpRequestSend.apply(currentRequest);
            })
            beginXMLRequest.addEventListener("load", function () {
                if (beginXMLRequest.status !== 200) {
                    currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                    currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                    contextMap.delete(currentRequest);
                    XMLHttpRequestSend.apply(currentRequest);
                }

                const preHook = function (abortFunction: () => void) {
                    currentRequest.abort = function(){
                        beginXMLRequest.abort();
                        abortFunction();
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ID, uniqueId);
                        currentRequest.setRequestHeader(X_HEAVY_HTTP_ACTION, X_HEAVY_HTTP_ACTIONS.SEND_ERROR);
                        contextMap.delete(currentRequest);
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
                    XMLHttpRequestSend.apply(currentRequest);
                }
                transporter.transport(beginXMLRequest.responseText, preHook, postHook, data, uploadEventListners)
            });
            beginXMLRequest.send();

        } else {
            contextMap.delete(this);
            XMLHttpRequestSend.apply(this, [data]);
        }

    };
}
