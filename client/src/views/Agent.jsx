import {
  Button,
  Divider,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { ChatBox, MessageWrapper } from "../components/ChatComponents";
import socket from "../utils/socket";

const Container = styled.div`
  display: flex;
  width: 100vw;
  height: 90vh;
  max-width: 800px;
  padding: 10px 15px;
  border-radius: 5px;
  background-color: #f6f6f6;
`;

const Customers = styled.div`
  display: flex;
  flex-direction: column;
  width: 40%;
  border-right: 1px solid #000;
  text-align: left;
  margin-right: 10px;
  overflow-y: auto;
`;

const Chat = styled.div`
  display: flex;
  flex-direction: column;
  width: 60%;
`;

const Agent = () => {
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [unassignedCustomers, setUnassignedCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (name) {
      socket.emit(
        "join",
        {
          role: "agent",
          user: {
            uid: socket.id,
            name,
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [name]);

  useEffect(() => {
    socket.on("connected", ({ assignedCustomers, unassignedCustomers }) => {
      setAssignedCustomers(assignedCustomers);
      setUnassignedCustomers(unassignedCustomers);
    });
    socket.off("questions").on("questions", ({ message, name }) => {
      setMessages((prev) => [
        ...prev,
        { type: "customer", message: message, name },
      ]);
    });
    socket.off("join-room").on("join-room", ({ room, user }) => {
      setCustomer(user.name);
      socket.emit("join-room", room);
    });
  }, []);

  const onClick = () => {
    socket.emit(
      "submit-answer",
      {
        message,
        agent: {
          uid: socket.id,
          name,
        },
      },
      (error) => {
        if (error) console.error(error);
      }
    );
    setMessages((prev) => [...prev, { type: "agent", message }]);
    setMessage("");
  };

  const endChat = () => {
    setCustomer(null);
    setMessages([]);
    socket.emit(
      "complete-chat",
      {
        uid: socket.id,
        name,
      },
      (error) => {
        if (error) console.error(error);
      }
    );
  };

  return (
    <div>
      {!show ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}>
          <h2>Enter your name</h2>
          <TextField
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <Button
            variant="contained"
            style={{ marginTop: "10px" }}
            onClick={() => {
              if (name) setShow(true);
            }}>
            Submit
          </Button>
        </div>
      ) : (
        <Container>
          <Customers>
            <Typography variant="caption">Assigned Customers</Typography>
            <List>
              {assignedCustomers.length === 0 ? (
                <p>No customers assigned</p>
              ) : (
                assignedCustomers.map((c) => c && <p key={c.name}>{c.name}</p>)
              )}
            </List>
            <Typography variant="caption">Unassigned Customers</Typography>
            <List>
              {unassignedCustomers.length === 0 ? (
                <p>No customers unassigned</p>
              ) : (
                unassignedCustomers.map(
                  (c) => c && <p key={c.name}>{c.name}</p>
                )
              )}
            </List>
          </Customers>
          <Chat>
            {!customer ? (
              <h2>No customer available</h2>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                  <h3>{`Connected with ${customer}`}</h3>
                  <Button onClick={endChat}>End chat</Button>
                </div>
                <Divider />
                <ChatBox>
                  {messages.length > 0 &&
                    messages.map((msg, index) =>
                      msg.type === "info" ? (
                        <div className="info" key={"info" + index}>
                          {msg.message}
                        </div>
                      ) : (
                        <div
                          className="message"
                          key={"chat" + index + msg.message}>
                          <b>
                            {`${
                              msg.type === "agent"
                                ? "You"
                                : msg.type === "customer"
                                ? msg.name
                                : ""
                            }: `}
                          </b>
                          {msg.message}
                        </div>
                      )
                    )}
                </ChatBox>
                <MessageWrapper>
                  <TextField
                    fullWidth
                    placeholder="Enter message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}></TextField>
                  <Button onClick={onClick}>Send</Button>
                </MessageWrapper>
              </>
            )}
          </Chat>
        </Container>
      )}
    </div>
  );
};

export default Agent;
