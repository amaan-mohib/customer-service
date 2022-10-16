# Branch International Assignment

Project hosted at https://customer-service-eight.vercel.app/

The project has been made with React.js and Node.js.
Rest of the packages can be installed using NPM.

To run the project you need to have **Node.js** installed in your system.

The installation steps have been mentioned below. (Run those command in a terminal)

### Additional Features

- Figure out a scheme to help agents divide work amongst themselves, and to prevent multiple agents working on the same message at once.
  - Customers wait in a queue to be assigned to an agent.
  - To do so, an agent an engage with only one customer at a time, to interact with another, the agent needs to disconnect the ongoing converstion first.
  - Multiple agents can log in at the same time, once a customer is available or waiting, they will be assigned to any available agent.
- Make the agent UI (and/or the customer-facing UI) more interactive by leveraging websockets or similar technology, so that new incoming messages can show up in real time.
  - I have used **Socket.io**, which leverages websockets, allowing agents to see messages and assigned customers in real time.

### Backend

Hosted at https://branch-customer-service-app.herokuapp.com/

```
$ cd server
$ npm install
$ npm run dev   # development
$ npm start     # production
```

The server then will be running at http://localhost:5000/

### Frontend

Hosted at https://customer-service-eight.vercel.app/

```
$ cd client
$ npm install
$ npm run dev
```

The frontend can then be accessed at the address mentioned in the terminal.
