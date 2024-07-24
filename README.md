# FlashbackBot

This project is built using [Ionic](https://ionicframework.com/) and [Vite](https://vitejs.dev/) for a fast, modern web development experience. Follow the steps below to get the development server running on your machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Node.js (Recommended version: 14 or later)
- npm (Comes with Node.js)

You can check if these are installed by running `node -v` and `npm -v` in your terminal.

## Installation

First, clone the project repository to your local machine using Git:

```sh
git clone <repository-url>
```

Navigate into the project directory:

```sh
cd <project-name>
```

Install the project dependencies using npm:

```sh
npm install
```


## Running the Development Server

To start the development server, run the following command in your project root directory:

```sh
npm run dev
```

This command executes the `ionic serve --external` script defined in `package.json`, which starts a local development server and makes it accessible from other devices in your network.

### Accessing the Server

- **Local:** Once the server is running, you can access the application in your web browser at `http://localhost:8100`.
- **Network:** To access the application from another device on the same network, use `http://<your-machine-ip>:8100`. Your machine's IP address should be displayed in the terminal after you start the server. If not, you can find it by running `ipconfig` (Windows) or `ifconfig` (macOS/Linux) in a separate terminal window.

### Stopping the Server

To stop the server, press `Ctrl + C` in your terminal.

## Build
To build the project into production, run:
```sh
npm run build
```

## Deploy
To build and deploy the project into production on your server, run:
```sh
npm run deploy
```

**Note** ou need to implement your own `deploy.sh` script where you enter the commands you need to run for your specific server solution.

### Make deploy.sh executable

Before running the deploy script, make sure it is executable:

```sh
chmod +x deploy.sh
```

## Troubleshooting

If you encounter issues accessing the server from another device, ensure that your firewall allows incoming connections on port 8100 and that your devices are connected to the same network.