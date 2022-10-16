const express = require("express");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
const Queue = require("./queue");
const csvToJson = require("convert-csv-to-json");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());

const jsonData = csvToJson
  .fieldDelimiter(",")
  .getJsonFromCsv("GeneralistRails_Project_MessageData.csv");
const dateSort = (a, b) => {
  return (
    new Date(a["Timestamp (UTC)"]).getTime() -
    new Date(b["Timestamp (UTC)"]).getTime()
  );
};
jsonData.sort(dateSort);

let availableAgents = new Map();
let customerQuestions = new Queue();
let assignedCustomers = new Map();
let unassignedCustomers = new Map();
let onlineUsers = {};
let assignedAgentsMap = new Map();

const assignAgents = (user, socket) => {
  if (!customerQuestions.isEmpty) {
    let customer = customerQuestions.dequeue();

    const room = customer.uid + "room";
    io.to(user.uid).emit("join-room", {
      user: customer.user,
      room,
    });
    assignedAgentsMap.set(user.uid, customer.uid);
    unassignedCustomers.delete(customer.uid);
    assignedCustomers.set(customer.uid, customer.user);
    io.to(room).emit("info", {
      message: `${user.name} is chatting with you`,
    });
    io.to(user.uid).emit("questions", {
      message: customer.message,
      name: customer.user.name,
    });
    while (
      !customerQuestions.isEmpty &&
      customerQuestions.peek().uid === customer.uid
    ) {
      const newMessage = customerQuestions.peek();
      io.to(user.uid).emit("questions", {
        message: newMessage.message,
        name: newMessage.user.name,
      });
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
    console.log(user);
    if (role === "agent") {
      assignAgents(user, socket);
    } else {
      if (unassignedCustomers.has(user.uid) || assignedCustomers.has(user.uid))
        return;
      socket.join(user.uid + "room");
      unassignedCustomers.set(user.uid, user);
    }
    sendConnected(io);
    callback();
  });

  socket.on("join-room", (room) => {
    socket.join(room);
  });

  socket.on("submit-question", ({ message, user }, callback) => {
    if (assignedCustomers.has(user.uid)) {
      io.to(user.uid + "room").emit("questions", { message, name: user.name });
      callback();
      return;
    }
    if (availableAgents.size > 0) {
      const [agentUid, agent] = availableAgents.entries().next().value;
      availableAgents.delete(agentUid);
      unassignedCustomers.delete(user.uid);
      assignedCustomers.set(user.uid, user);
      assignedAgentsMap.set(agentUid, user.uid);
      io.to(agentUid).emit("join-room", {
        user,
        room: user.uid + "room",
      });
      io.to(agentUid).emit("questions", { message, name: user.name });
      io.to(user.uid).emit("info", {
        message: `${agent.name} is chatting with you`,
      });
      sendConnected(io);
    } else {
      customerQuestions.enqueue({ message, user, uid: user.uid });
    }
    callback();
  });

  socket.on("submit-answer", ({ message, agent }, callback) => {
    const customerId = assignedAgentsMap.get(agent.uid);
    io.to(customerId + "room").emit("answers", { message, name: agent.name });
    callback();
  });

  socket.on("complete-chat", (user, callback) => {
    const customerId = assignedAgentsMap.get(user.uid);
    assignedCustomers.delete(customerId);
    io.to(customerId + "room").emit("info", {
      message: `The chat has ended. Thank you for chatting with us.`,
    });
    assignAgents(user, socket);
    sendConnected(io);
    callback();
  });

  socket.on("disconnect", (reason) => {
    if (onlineUsers[socket.id]) {
      const { role, user } = onlineUsers[socket.id];
      if (role === "agent") {
        const customerId = assignedAgentsMap.get(user.uid);
        const customer = assignedCustomers.get(customerId);
        assignedCustomers.delete(customerId);
        unassignedCustomers.set(customerId, customer);
        availableAgents.delete(user.uid);
        assignedAgentsMap.delete(user.uid);
        io.to(customerId + "room").emit("info", {
          message: `${user.name} left the chat. Message to get assigned to another agent.`,
        });
      } else {
        //could not implement deleting assigned agent
        assignedCustomers.delete(user.uid);
        unassignedCustomers.delete(user.uid);
      }
      delete onlineUsers[socket.id];
    }
    sendConnected(io);
    console.log(`${socket.id} disconnected due to ${reason}`);
  });
});

app.get("/get-csv", (req, res) => {
  res.send(jsonData);
});

server.listen(process.env.PORT || 5000, () =>
  console.log("server running at http://localhost:5000")
);
