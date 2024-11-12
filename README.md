# Title Server

This project implements a Node.js server that retrieves the `<title>` tags of websites specified via query string parameters. The project showcases different control flow strategies in an asynchronous environment

## Features

The server responds to a single route: `/I/want/title`. Given one or more website addresses, it fetches the titles of those websites and returns them in a list format. 

## Implementations

The same functionality is implemented in four different ways to demonstrate various asynchronous control flow strategies:

1. **Callback Version**: Uses Node.js callbacks for asynchronous control.
2. **Async Library Version**: Uses the `async` library to simplify callback handling.
3. **Promise (Q Library) Version**: Uses the `q` library to handle Promises.
4. **RxJS Stream Version**: Uses RxJS to handle asynchronous streams.

Each implementation is contained in its own file, named `server1.js`, `server2.js`, `server3.js`, and `server4.js` respectively.

## Files

- **server1.js**: Implements the Title Server using traditional callbacks.
  
- **server2.js**: Implements the Title Server using the `async` library.
  
- **server3.js**: Implements the Title Server using the `q` library for Promises.
  
- **server4.js**: Implements the Title Server using RxJS streams.

## Routes

- `GET /I/want/title?address=<address1>&address=<address2>&...`: Fetches the titles of the specified websites. Replace `<address1>`, `<address2>`, etc., with the URLs of the sites you want the titles from (e.g., `google.com`, `http://yahoo.com`).

## Installation and Setup

1. Clone this repository:
    ```bash
    git clone git@github.com:FarhanYaseen/title-server.git
    ```
2. Navigate to the project directory:
    ```bash
    cd title-server
    ```
3. Install dependencies specified in `package.json`:
    ```bash
    npm install
    ```

## Running the Server

To start the server, you can use any of the implementation files. Replace `<filename>` with `server1.js`, `server2.js`, `server3.js`, or `server4.js`:

```bash
node <filename>
```

For example:
```bash
node server1.js
```

The server will start on `localhost:3000` by default.

## Usage

After starting the server, you can test it by navigating to the following URL in your browser or by using a tool like `curl` or `Postman`:

```bash
http://localhost:3000/I/want/title?address=google.com&address=http://yahoo.com
```

This will return a list of the `<title>` tags for the specified websites.