import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Lander = () => {
  const [forests, setForests] = useState([]);
  const [selectedForest, setSelectedForest] = useState("");
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch forests data when component mounts
    fetchForests();
  }, []);

  const fetchForests = async () => {
    try {
      setMessage("");
      const response = await axios.get("http://127.0.0.1:5000/getForests");
      setForests(response.data);
      if (response.data.length === 0) {
        setMessage("No data available for forests");
      }
    } catch (error) {
      console.error("Error fetching forests:", error);
      setMessage("Failed to fetch forests data");
    }
  };

  const handleForestChange = async (forest) => {
    setSelectedForest(forest);
    setDates([]); // Reset dates when forest changes
    try {
      setMessage("");
      const response = await axios.get(
        `http://127.0.0.1:5000/getDates?forest=${forest}`
      );
      setDates(response.data);
      if (response.data.length === 0) {
        setMessage(`No dates available for ${forest}`);
      }
    } catch (error) {
      console.error("Error fetching dates:", error);
      setMessage(`Failed to fetch dates for ${forest}`);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSubmit = async () => {
    try {
      setMessage("");
      const response = await axios.get(
        `http://127.0.0.1:5000/getReport?forest=${selectedForest}&date=${selectedDate}`
      );
      const res = Array(response.data);
      const dateAndForestData = [selectedForest, selectedDate];

      navigate("/report", { state: { res, dateAndForestData } });
    } catch (error) {
      console.error("Error fetching report:", error);
      setMessage("Failed to fetch report data");
    }
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="container-wrapper">
      <div className="container">
        <h1 className="title">Lander Page</h1>
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
              {forests.map((forest) => (
                <option key={forest} value={forest}>
                  {forest}
                </option>
              ))}
            </select>
          </div>
          {dates.length > 0 && (
            <div className="form-group">
              <label className="form-label">Select Date:</label>
              <select
                className="form-input"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              >
                <option value="">-- Select Date --</option>
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            className="form-button"
            onClick={handleSubmit}
            disabled={!selectedForest || !selectedDate}
          >
            Submit
          </button>
          <button className="form-button" onClick={handleReturnHome}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lander;
