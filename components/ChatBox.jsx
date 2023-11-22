// Component that contains the actual chat UI

import React, { useEffect, useState } from "react";
import { useChannel } from "ably/react";
import styles from "./ChatBox.module.css";

export default function ChatBox() {
  let inputBox = null;
  let messageEnd = null;

  const [messageText, setMessageText] = useState(""); // track the textarea element where the messages will be typed
  const [recievedMessages, setMessages] = useState([]); // stores the on-screen chat history
  const messageTextIsEmpty = messageText.trim().length === 0; // checks if the textarea element is empty to disable the send button

  // Allows us to have up to 200 messages at any maximum time
  // so only the last 199 messages plus the new messages are stored in the setMessages hook
  const { channel, ably } = useChannel("chat-demo", (message) => {
    const history = recievedMessages.slice(-199);
    setMessages([...history, message]);
  });

  // Checks if the message sent by User contain OpenAI
  function isOpenAITrigger(message) {
    return message.startsWith("Hey OpenAI");
  }

  const sendOpenAIMessage = async (messageText) => {
    if (!isOpenAITrigger(messageText)) {
      return;
    }
    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        body: JSON.stringify({ prompt: messageText }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const { result } = await response.json();
      const openaiResponse = "OpenAI: " + result;
      console.log(openaiResponse);

      // Updates the message channel with the openai message
      // const history = recievedMessages.slice(-199);
      // setMessages([
      //   ...history,
      //   { connectionId: "openai", data: openaiResponse },
      // ]);

      // Publish the OpenAI message
      channel.publish({
        name: "chat-message",
        data: openaiResponse,
        id: `openai-${generateRandomString(8)}`,
      });

      // setMessages((receivedMessages) => [
      //   ...receivedMessages,
      //   {
      //     connectionId: "openai",
      //     data: openaiResponse,
      //   },
      // ]);

      return openaiResponse;
    } catch (error) {
      console.error("Error fetching OpenAI response", error);
    }
  };

  // uses the Ably Channel above (useChannel hook)
  // clears the input (useState hook)
  // focuses on the textarea so that users can type again if they wish
  const sendChatMessage = async (messageText) => {
    channel.publish({ name: "chat-message", data: messageText });
    inputBox.focus();

    setMessageText("");

    // if (isOpenAITrigger(messageText)) {
    await sendOpenAIMessage(messageText);
    // Gets the OpenAI prompts
    // Updates the recievedMessages useState Hooks
    // Publishes to the Ably Channel
    // }
  };

  // function to be triggered when submit button is clicked
  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  // function to allow enter to be used to send message
  const handleKeyPress = (event) => {
    if (event.charCode !== 13 || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  function generateRandomString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // Use Array.from to create an array of length 'length' and then map each element to a random character
    const randomStringArray = Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    );

    // Join the array of characters into a string
    const randomString = randomStringArray.join("");

    return randomString;
  }
 


  // map the messages to span
  const messages = recievedMessages.map((message, index) => {
    let author = message.connectionId === ably.connection.id ? "me" : "other";

    if (message.id.startsWith("openai")) {
      author = "other";
    }

    return (
      <span key={index} className={styles.message} data-author={author}>
        {message.data}
      </span>
    );
  });

  // scroll the message history to the bottom whenever the component renders
  useEffect(() => {
    messageEnd.scrollIntoView({
      behaviour: "smooth",
    });
  });

  return (
    <div className={styles.chatHolder}>
      <div className={styles.chatText}>
        {messages}
        <div
          ref={(element) => {
            messageEnd = element;
          }}
        ></div>
      </div>
      <form onSubmit={handleFormSubmission} className={styles.form}>
        <textarea
          ref={(element) => {
            inputBox = element;
          }}
          value={messageText}
          placeholder="Type a message..."
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button
          type="submit"
          className={styles.button}
          disabled={messageTextIsEmpty}
        >
          Send
        </button>
      </form>
    </div>
  );
}
