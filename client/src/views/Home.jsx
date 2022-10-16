import { Link } from "react-router-dom";
import { Button } from "@mui/material";

const Home = () => {
  return (
    <div>
      <h2>Select a view</h2>
      <Button as={Link} to="/customer">
        Customer
      </Button>
      <Button as={Link} to="/agent">
        Agent
      </Button>
      <Button as={Link} to="/csv">
        CSV Users
      </Button>
    </div>
  );
};

export default Home;
