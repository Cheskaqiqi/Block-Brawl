import React from "react";

// CreateRoom Component: Displays a modal for users to create a room
function CreateRoom({ closeModal }) {

  // Main modal container with positioning styles
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50">

      {/* Background overlay */}
      <div className="absolute mt-[30px] top-0 left-0 w-full h-full bg-purple-600 opacity-50 backdrop-blur-md"></div>

      {/* Actual modal content container */}
      <div className="relative w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 z-60">
        
        {/* Modal header: title and close button */}
        <div className="flex items-start justify-between mb-4 rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Room
          </h3>

          {/* Close modal button */}
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
            onClick={() => closeModal(false)}
          >
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            {/* Accessibility: descriptive text for screen readers */}
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Form to enter username and submit */}
        <form className="space-y-6" action="#">
          <div>
            {/* Input field for username */}
            <input
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRoom;
