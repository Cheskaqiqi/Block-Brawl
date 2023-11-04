import React, { useContext, useState } from "react";

import { AppContext } from "../../GameContext";

import Socket from "../../Socket";

import { useNavigate } from "react-router-dom";

// JoinRoom Component: Modal for users to join an existing room

function JoinRoom({ closeModal }) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");

  const [roomNumber, setRoomNumber] = useState("");

  const { setIsHost, setRoomId, roomId, handlers, name, setName } =
    useContext(AppContext);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "value") {
      setUserName(value);

      setName(value);
    } else if (name === "number") {
      setRoomNumber(value);

      setRoomId(value);
    }

    setIsHost(false);
  };

  const joinRoom = (e) => {
    e.preventDefault();

    Socket.connect();

    Socket.emit("join-room", { roomId, name }, (room) => {
      if (room) {
        setRoomId(room.roomId);

        handlers.setState(room.players);

        setName(name);

        navigate("/" + roomId.toString() + "/roompage");
      } else {
        alert("Room Not Found!");
      }
    });
  };

  // Main modal container with positioning styles

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50">
      {/* Background overlay */}

      <div className="absolute mt-[30px] top-0 left-0 w-full h-full bg-gray-900 opacity-50 backdrop-blur-md"></div>

      {/* Actual modal content container */}

      <div className="relative w-full bg-gray-50 max-w-[600px] h-[400px] p-4 bg-white border border-gray-200 rounded-[30px] shadow sm:p-6 md:p-8 z-60">
        {/* Modal header: title and close button */}

        <div className="flex items-start justify-between mb-4 rounded-t dark:border-gray-600">
          <h3 className="text-[40px] font-medium text-gray-900 dark:text-white">
            Join Room
          </h3>

          {/* Close modal button */}

          <button
            type="button"
            className="text-gray-800 rounded-lg text-sm w-[40px] h-[40px] ml-auto inline-flex justify-center items-center"
            onClick={() => closeModal(false)}
          >
            <svg
              className="w-15 h-15"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>

            {/* Accessibility: descriptive text for screen readers */}

            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Form to enter username and room number to join */}

        <form className="space-y-10" action="#">
          <div>
            {/* Input field for username */}

            <input
              name="value"
              class="bg-gray-50 border border-[2px] border-gray-800 text-gray-900 text-3xl rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter your username"
              value={userName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            {/* Input field for room number */}

            <input
              name="number"
              placeholder="Enter your room number"
              class="bg-gray-50 border border-[2px] border-gray-800 text-gray-900 text-3xl rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              value={roomNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit button to confirm and join the room */}

          <button
            type="submit"
            class="w-full h-[70px] text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-normal rounded-2xl text-[30px] px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={joinRoom}
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinRoom;
