import styled from "styled-components";

export const ChatBox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  flex: 1;

  .info {
    padding: 5px;
    border-bottom: 1px solid #000;
  }
  .message {
    text-align: left;
    border-bottom: 1px solid #000;
    padding: 5px;
  }
`;

export const MessageWrapper = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  width: 100%;
`;
