import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Importing the CSS file

const Home = () => {
  const [name, setName] = useState("");
  const [csvFiles, setCsvFiles] = useState({
    js: null,
    rem: null,
    qa: null,
  });

  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const allFieldsFilled =
      name && csvFiles.csv1 && csvFiles.csv2 && csvFiles.csv3;
    setIsSubmitEnabled(allFieldsFilled);
  }, [name, csvFiles]);

  const handleNavigate = () => {
      navigate("/lander");
  };

  const handleFileChange = (event, csvKey) => {
    setCsvFiles((prevState) => ({
      ...prevState,
      [csvKey]: event.target.files[0],
    }));
  };
  const clearInput = () => {
    setCsvFiles({ js: null, rem: null, qa: null });
    setName("");
    setMessage("Uploaded to DB");
    document.getElementById("csv1").value = "";
    document.getElementById("csv2").value = "";
    document.getElementById("csv3").value = "";
  };
  const handleSubmit = async (event) => {
    setMessage("");
    event.preventDefault();
    const allFieldsFilled =
      name && csvFiles.csv1 && csvFiles.csv2 && csvFiles.csv3;
    if (!allFieldsFilled){
      setMessage("Don't try this! :)");
      return
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("csv1", csvFiles.csv1);
    formData.append("csv2", csvFiles.csv2);
    formData.append("csv3", csvFiles.csv3);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/uploadcsv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        clearInput();
      }
    } catch (error) {
      console.error("Error uploading data:", error);
      setMessage(error.toString());
    }
  };

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
              onChange={(e) => handleFileChange(e, "csv1")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rem CSV:</label>
            <input
              type="file"
              id="csv2"
              className="form-input"
              accept=".csv"
              onChange={(e) => handleFileChange(e, "csv2")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">QA CSV:</label>
            <input
              type="file"
              id="csv3"
              className="form-input"
              accept=".csv"
              onChange={(e) => handleFileChange(e, "csv3")}
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
