### Web Client Connector

This library is part of the Heavy HTTP project. If you are new to Heavy HTTP it is recommended to go through the [Heavy HTTP documentation](https://github.com/Heavy-HTTP/.github/blob/main/profile/Readme.md) first. 

Web HTTP Client is an extension of the default HTTP Client that is used in the web application (browsers). Web HTTP Client extends the [XMLHTTPRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) and [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) (Fetch is not supported yet). For all the HTTP communication the extended Web HTTP Client is exposed via the same interface. Because of this pattern, regardless of the HTTP client wrapper library (Axios, Node Fetch etc) that is used in the application, Web Client can perform its magic. 

#### Looking under the hood 
At the initialization of the request Heavy HTTP Client performs the following operations
1. Identify the type of the payload and estimate the size of the payload.
2. If the size of the payload is beyond the configured threshold shift to the Heavy HTTP Transporter to continue the communication. If not proceed with the existing communication pattern. 
3. Provide the seamless experience of HTTP client to the HTTP Client wrapper library. 

When receiving the response Heavy HTTP Client performs the following operations
1. Check whether the response is a Heavy Response or not. 
2. If it's a Heavy Response then shift to the Heavy HTTP Transporter to fetch the data. Otherwise, proceed with the existing communication pattern. 
3. Provide the seamless experience of HTTP client to the HTTP Client wrapper library. 

To learn more about the full communication protocol please refer [Heavy HTTP Communication Protocol](https://github.com/Heavy-HTTP/.github/blob/main/profile/Readme.md#heavy-http-communication-protocol).

To learn more about HTTP transporter please refer [Heavy HTTP Transporter](https://github.com/Heavy-HTTP/.github/blob/main/profile/Readme.md#heavy-http-transporter).

### Seamless Experience in XHR Libraries

In typical HTTP requests, XHR provides the capability to attach [upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) and [download](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent) listeners. Upload listeners are attached to the request uploading process and download listeners are attached to the response downloading process. Heavy HTTP protocol involves multiple back-and-forth API calls for a single client request. But in order to keep the original experience as it is all the upload listeners are attached to the request that uploads the content and all the download listeners are attached to the request that downloads the response. With this pattern, all the existing capabilities of XHR are achievable with the Web Client Connector without a single line of code modifications. 

### Currently Supported Web HTTP Client Wrapper Libraries

Web client connector supports any wrapper library that utilizes [XMLHTTPRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) for the HTTP communication. Following libraries are dev-tested. 
* [Axios](https://www.npmjs.com/package/axios)
* [SuperAgent](https://www.npmjs.com/package/superagent)
* [request](https://github.com/request/request)
* [jQuery Ajax](https://api.jquery.com/jquery.ajax)
 

### Usage

* Usage of Web HTTP Client Connector in a React App.
	* index.js
	```
	import React from 'react';
	import ReactDOM from 'react-dom/client';
	import './index.css';
	import App from './App';
	import { initialize } from '@heavy-http/web-client-connector';
	import reportWebVitals from './reportWebVitals';

	initialize({ requestThreshold: 1 });

	const root = ReactDOM.createRoot(document.getElementById('root'));
	root.render(
	  <React.StrictMode>
	    <App />
	  </React.StrictMode>
	);

	reportWebVitals();

	```
	* App.js

	```
	import './App.css';
	import axios from 'axios';
	import pako from 'pako';

	function App() {
	  return (
	    <div className="App">
	      <header className="App-header">

		<button onClick={async () => {
		  const response = await axios.post('http://localhost:3010/test', { "dummyKey": "dummyValue" });
		  console.log("response", response)
		}}>
		  Fire Uncompressed Request
		</button>

		<hr/>

		<button onClick={async () => {
		  const compressedStr = pako.gzip(JSON.stringify({ "dummyKey": "dummyValue" }), { to: 'string' });
		  const response = await axios.post('http://localhost:3010/test', compressedStr, {
		    headers: {
		      'Content-Type': 'text/plain',
		      'Content-Encoding': 'gzip'
		    }
		  });
		  console.log("response", response)
		}}>
		  Fire Compressed Request
		</button>

	      </header>
	    </div>
	  );
	}

	export default App;

	```
``` initialize({ requestThreshold: 1 });``` is the intialization point of the library. ```requestThreshold``` is the size of the maximum request body (in bytes) that can be communicated via default HTTP. Based on the architecture of the Rest HTTP service implementation this value varies. This initialization must happen at the very beginning of the application. Even though this library overrides the XMLHTTPRequest it won't interrupt any custom implementations that have been added to the XMLHTTPRequest class. 


### Game Plan
The Web HTTP Client currently supports [XMLHTTPRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) path only. Extending the capabilities to [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is the next milestone. 