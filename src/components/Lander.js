import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Importing the CSS file

const Lander = () => {
  // State variables
  const [forests, setForests] = useState([]); // State for storing forests
  const [selectedForest, setSelectedForest] = useState(""); // State for selected forest
  const [dates, setDates] = useState([]); // State for storing dates
  const [selectedDate, setSelectedDate] = useState(""); // State for selected date
  const [message, setMessage] = useState(""); // State for displaying messages

  const navigate = useNavigate(); // Hook for navigation

  // Fetch forests data when component mounts
  useEffect(() => {
    fetchForests();
  }, []);

  // Function to fetch forests from the server
  const fetchForests = async () => {
    try {
      setMessage(""); // Clear previous messages
      const response = await axios.get("http://127.0.0.1:5000/getForests"); // API call to fetch forests
      setForests(response.data); // Update forests state with response data
      if (response.data.length === 0) {
        setMessage("No data available for forests"); // Display message if no forests found
      }
    } catch (error) {
      console.error("Error fetching forests:", error); // Log error to console
      setMessage("Failed to fetch forests data"); // Display error message
    }
  };

  // Function to handle forest selection change
  const handleForestChange = async (forest) => {
    setSelectedForest(forest); // Update selected forest state
    setDates([]); // Reset dates when forest changes
    try {
      setMessage(""); // Clear previous messages
      const response = await axios.get(
        `http://127.0.0.1:5000/getDates?forest=${forest}`
      ); // API call to fetch dates for selected forest
      const formatDate = (dateStr) => {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      };
      
      // Sort dates in ascending order
      const sortedDates = response.data.sort((a, b) => {
        const dateA = new Date(formatDate(a));
        const dateB = new Date(formatDate(b));
        return dateA - dateB;
      });
      
      setDates(sortedDates); // Update dates state with response data
      if (sortedDates.length === 0) {
        setMessage(`No dates available for ${forest}`); // Display message if no dates found for selected forest
      }
    } catch (error) {
      console.error("Error fetching dates:", error); // Log error to console
      setMessage(`Failed to fetch dates for ${forest}`); // Display error message
    }
  };

  // Function to handle date selection change
  const handleDateChange = (date) => {
    setSelectedDate(date); // Update selected date state
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    try {
      setMessage(""); // Clear previous messages
      const response = await axios.get(
        `http://127.0.0.1:5000/getReport?forest=${selectedForest}&date=${selectedDate}`
      ); // API call to fetch report data based on selected forest and date
      const res = Array(response.data); // Store response data in an array
      const dateAndForestData = [selectedForest, selectedDate]; // Store selected forest and date

      navigate("/report", { state: { res, dateAndForestData } }); // Navigate to '/report' route with state
    } catch (error) {
      console.error("Error fetching report:", error); // Log error to console
      setMessage("Failed to fetch report data"); // Display error message
    }
  };

  // Function to navigate back to the Home page
  const handleReturnHome = () => {
    navigate("/"); // Navigate to '/' route
  };

  // Render JSX
  return (
    <div className="container-wrapper">
      <div className="container">
        <h1 className="title">Lander Page</h1>
        {/* Display message if there is any */}
        {message && (
          <p className="message" style={{ color: "red" }}>
            {message}
          </p>
        )}
        <div className="form">
          <div className="form-group">
            <label className="form-label">Select Forest:</label>
            <select
              className="form-input"
              value={selectedForest}
              onChange={(e) => handleForestChange(e.target.value)}
            >
              <option value="">-- Select Forest --</option>
              {/* Map through forests and create options */}
              {forests.map((forest) => (
                <option key={forest} value={forest}>
                  {forest}
                </option>
              ))}
            </select>
          </div>
          {/* Display date selection if dates are available */}
          {dates.length > 0 && (
            <div className="form-group">
              <label className="form-label">Select Date:</label>
              <select
                className="form-input"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              >
                <option value="">-- Select Date --</option>
                {/* Map through dates and create options */}
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Submit button to fetch report */}
          <button
            className="form-button"
            onClick={handleSubmit}
            disabled={!selectedForest || !selectedDate}
          >
            Submit
          </button>
          {/* Button to return to Home page */}
          <button className="form-button" onClick={handleReturnHome}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lander;
