const express = require("express");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
const resultsDB = require("./db");
const Queue = require("./queue");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());

let availableAgents = new Map();
let customerQuestions = new Queue();
let assignedCustomers = new Map();
let unassignedCustomers = new Map();
let onlineUsers = {};

const assignAgents = (user, socket) => {
  if (!customerQuestions.isEmpty()) {
    let question = customerQuestions.dequeue();
    const room = question.uid + "room";
    socket.join(room);
    io.to(room).emit("info", {
      message: `${user.name} is chatting with you`,
    });
    io.in(room).emit("questions", question.message);
    while (customerQuestions.peek().uid === room) {
      io.in(room).emit("questions", question.message);
      customerQuestions.dequeue();
    }
  } else {
    availableAgents.set(socket.id, user);
  }
};

const sendConnected = (io) => {
  const connected = {
    assignedCustomers: Array.from(assignedCustomers.values()),
    unassignedCustomers: Array.from(unassignedCustomers.values()),
  };
  console.log(connected);
  io.emit("connected", connected);
};

io.on("connect", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("join", ({ role, user }, callback) => {
    onlineUsers[socket.id] = { role, user };
    if (role === "agent") {
      assignAgents(user, socket);
    } else {
      socket.join(user.uid + "room");
      unassignedCustomers.set(user.uid, user);
    }
    sendConnected(io);
    callback();
  });

  socket.on("submit-question", (message, user, callback) => {
    if (assignedCustomers.has(user.uid)) {
      io.to(user.uid + "room").emit("questions", message);
      callback();
      return;
    }
    if (availableAgents.size > 0) {
      const [agentUid, firstAgent] = availableAgents.entries().next().value;
      availableAgents.delete(agentUid);
      unassignedCustomers.delete(user.uid);
      assignedCustomers.set(user.uid, user);
      io.to(agentUid).emit("join-room", {
        room: user.uid + "room",
      });
      sendConnected(io);
    } else {
      customerQuestions.enqueue({ message, user, uid: user.uid });
    }
    callback();
  });

  socket.on("complete-chat", (user, callback) => {
    assignAgents(user, socket);

    callback();
  });

  socket.on("disconnect", (reason) => {
    if (onlineUsers[socket.id]) {
      const { role, user } = onlineUsers[socket.id];
      if (role === "agent") {
        availableAgents.delete(user.uid);
      } else {
        assignedCustomers.delete(user.uid);
        unassignedCustomers.delete(user.uid);
      }
      delete onlineUsers[socket.id];
    }
    sendConnected(io);
    console.log(`${socket.id} disconnected due to ${reason}`);
  });
});

app.get("/get-connected", (req, res) => {
  res.send({
    assignedCustomers: Array.from(assignedCustomers.values()),
    unassignedCustomers: Array.from(unassignedCustomers.values()),
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log("server running at http://localhost:5000")
);
