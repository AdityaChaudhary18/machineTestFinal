import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Importing the CSS file

const Home = () => {
  // State variables
  const [name, setName] = useState(""); // State for forest name input
  const [csvFiles, setCsvFiles] = useState({ // State for CSV file inputs
    js: null,  // 3 JS CSV file
    rem: null, // Rem CSV file
    qa: null,  // QA CSV file
  });

  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false); // State to enable/disable submit button
  const [message, setMessage] = useState(""); // State for displaying messages

  const navigate = useNavigate(); // Hook for navigation

  // Effect hook to enable/disable submit button based on form completion
  useEffect(() => {
    const allFieldsFilled =
      name && csvFiles.js && csvFiles.rem && csvFiles.qa; // Check if all fields are filled
    setIsSubmitEnabled(allFieldsFilled); // Update submit button state
  }, [name, csvFiles]);

  // Function to navigate to another route
  const handleNavigate = () => {
    navigate("/lander"); // Navigate to '/lander' route
  };

  // Function to handle file input changes
  const handleFileChange = (event, csvKey) => {
    setCsvFiles((prevState) => ({
      ...prevState,
      [csvKey]: event.target.files[0], // Update the respective CSV file state
    }));
  };

  // Function to clear input fields and show message upon successful submission
  const clearInput = () => {
    setCsvFiles({ js: null, rem: null, qa: null }); // Clear CSV file states
    setName(""); // Clear forest name state
    setMessage("Uploaded to DB"); // Display success message
    document.getElementById("csv1").value = ""; // Clear file input fields
    document.getElementById("csv2").value = "";
    document.getElementById("csv3").value = "";
  };

  // Function to handle form submission
  const handleSubmit = async (event) => {
    setMessage(""); // Clear previous messages
    event.preventDefault(); // Prevent default form submission

    const allFieldsFilled =
      name && csvFiles.js && csvFiles.rem && csvFiles.qa; // Check if all fields are filled
    if (!allFieldsFilled) {
      setMessage("Don't try this! :)"); // Display error message if fields are not filled
      return;
    }

    // Create FormData object to send multipart/form-data
    const formData = new FormData();
    formData.append("name", name); // Append forest name to FormData
    formData.append("csv1", csvFiles.js); // Append 3 JS CSV file to FormData
    formData.append("csv2", csvFiles.rem); // Append Rem CSV file to FormData
    formData.append("csv3", csvFiles.qa); // Append QA CSV file to FormData

    try {
      // Send POST request to upload CSV files
      const response = await axios.post(
        "http://127.0.0.1:5000/uploadcsv", // API endpoint
        formData, // FormData containing forest name and CSV files
        {
          headers: {
            "Content-Type": "multipart/form-data", // Set content type header for FormData
          },
        }
      );
      if (response.status === 200) {
        clearInput(); // Clear input fields and show success message upon successful upload
      }
    } catch (error) {
      console.error("Error uploading data:", error); // Log error to console
      setMessage(error.toString()); // Display error message
    }
  };

  // Render JSX
  return (
    <div className="container-wrapper">
      <div className="container">
        <h1 className="title">Enter Data</h1>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Forest Name:</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">3 JS CSV:</label>
            <input
              type="file"
              id="csv1"
              className="form-input"
              accept=".csv"
              onChange={(e) => handleFileChange(e, "js")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rem CSV:</label>
            <input
              type="file"
              id="csv2"
              className="form-input"
              accept=".csv"
              onChange={(e) => handleFileChange(e, "rem")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">QA CSV:</label>
            <input
              type="file"
              id="csv3"
              className="form-input"
              accept=".csv"
              onChange={(e) => handleFileChange(e, "qa")}
            />
          </div>
          <button
            type="submit"
            className="form-button"
            disabled={!isSubmitEnabled}
          >
            Submit
          </button>
        </form>
        <button className="form-button report-button" onClick={handleNavigate}>
          Find/Generate Report
        </button>
        <h3>{message}</h3>
      </div>
    </div>
  );
};

export default Home;
