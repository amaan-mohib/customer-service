import { Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { ChatBox, MessageWrapper } from "../components/ChatComponents";
import socket from "../utils/socket";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 500px;
  max-height: 90vh;
  min-height: 600px;
  overflow: hidden;
  padding: 10px 15px;
  border-radius: 5px;
  background-color: #f6f6f6;
`;

const Customer = () => {
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (name) {
      socket.emit(
        "join",
        {
          role: "customer",
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
    socket.off("info").on("info", (info) => {
      setMessages((prev) => [...prev, { type: "info", message: info.message }]);
    });
    socket.off("answers").on("answers", ({ message, name }) => {
      setMessages((prev) => [
        ...prev,
        { type: "agent", message: message, name },
      ]);
    });
  }, []);

  const onClick = () => {
    socket.emit(
      "submit-question",
      {
        message,
        user: {
          uid: socket.id,
          name,
        },
      },
      (error) => {
        if (error) console.error(error);
      }
    );
    setMessages((prev) => [...prev, { type: "customer", message }]);
    setMessage("");
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
          <ChatBox>
            {messages.length === 0 ? (
              <p>Start chatting to get connected to an agent</p>
            ) : (
              messages.map((msg, index) =>
                msg.type === "info" ? (
                  <div className="info" key={"info" + index}>
                    {msg.message}
                  </div>
                ) : (
                  <div className="message" key={"chat" + index + msg.message}>
                    <b>
                      {`${
                        msg.type === "customer"
                          ? "You"
                          : msg.type === "agent"
                          ? msg.name
                          : ""
                      }: `}
                    </b>
                    {msg.message}
                  </div>
                )
              )
            )}
          </ChatBox>
          <MessageWrapper>
            <TextField
              placeholder="Enter message"
              value={message}
              fullWidth
              onChange={(e) => setMessage(e.target.value)}></TextField>
            <Button onClick={onClick}>Send</Button>
          </MessageWrapper>
        </Container>
      )}
    </div>
  );
};

export default Customer;
