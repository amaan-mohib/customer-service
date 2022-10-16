import { useEffect, useState } from "react";
import axios from "axios";
import socket, { ENDPOINT } from "../utils/socket";
import { Button } from "@mui/material";

const CSV = () => {
  const [data, setdata] = useState([]);
  const [completed, setcompleted] = useState(0);
  useEffect(() => {
    socket.emit(
      "join",
      {
        role: "customer",
        user: {
          uid: socket.id,
          name: "CSV",
        },
      },
      (error) => {
        if (error) console.error(error);
      }
    );

    axios.get(ENDPOINT + "/get-csv").then((res) => {
      console.log(res.data);
      setdata(res.data);
    });
  }, []);

  const onClick = () => {
    data.forEach((element) => {
      setTimeout(() => {
        setcompleted((prev) => prev + 1);
        socket.emit(
          "submit-question",
          {
            message: element["MessageBody"],
            user: {
              uid: element["UserID"],
              name: `CSV ${element["UserID"]}`,
            },
          },
          (error) => {
            if (error) console.error(error);
          }
        );
      }, 300);
    });
  };
  return (
    <div>
      <p>{`Completed: ${completed}`}</p>
      <Button onClick={onClick}>Start sending data</Button>
    </div>
  );
};

export default CSV;
