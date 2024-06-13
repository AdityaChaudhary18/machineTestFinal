import React from "react";
import "./Report.css";
import { useLocation, useNavigate } from "react-router-dom";

const today = new Date();

const date = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();

const formattedDate = `${date}/${month}/${year}`;
const keysList = [
  "PIC",
  "Ha_sum",
  "Algo_TC_sum",
  "R0_R1_sum",
  "3JS_T_sum",
  "3JS_TPM",
  "Rem_Ha_sum",
  "Rem_TC_sum",
  "Rem_T_sum",
  "Rem_TPM",
  "QA_Ha_sum",
  "QA_TC_sum",
  "QA_T_sum",
  "Total_sum",
];

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state.res[0] || [];
  const forestName = location.state.dateAndForestData[0];
  const dateFilter = location.state.dateAndForestData[1];
  console.log(forestName, dateFilter);
  const calculateColumnTotal = (key) => {
    let total = 0;
    data.forEach((item) => {
      total += parseFloat(item[key]) || 0; // Ensure to parse to float and handle NaN
    });
    return Math.round(total);
  };
  const calculateColumnTotalWithPoint = (key) => {
    let total = 0;
    data.forEach((item) => {
      total += parseFloat(item[key]) || 0; // Ensure to parse to float and handle NaN
    });
    return total.toFixed(1);
  };

  const calculateColumnAverage = (key) => {
    let total = 0;
    let count = 0;
    data.forEach((item) => {
      if (parseFloat(item[key]) > 0) {
        count += 1;
      }
      total += parseFloat(item[key]) || 0; // Ensure to parse to float and handle NaN
    });
    const average = total / count || 0; // Handle division by zero
    return average.toFixed(1); // Adjust decimal places as needed
  };

  // const reportData = data[0];
  return (
    <div className="report-container">
      <h1 className="headingMain">Report </h1>
      <div>
        <table className="report-table">
          <tbody>
            <tr
              style={{
                fontWeight: "bold",
              }}
            >
              <td colSpan={7}>Date</td>
              <td colSpan={7}>{dateFilter}</td>
            </tr>
            <tr
              style={{
                backgroundColor: "#FDFD96",
                fontWeight: "bold",
              }}
            >
              <td colSpan={7}>Forest Name</td>
              <td colSpan={7}>{forestName}</td>
            </tr>
            <tr
              style={{
                backgroundColor: "#FDFD96",
                fontWeight: "bold",
              }}
            >
              <td colSpan={7}>Total Hectares</td>
              <td colSpan={7}>
                {(
                  parseFloat(calculateColumnTotalWithPoint("Ha_sum")) +
                  parseFloat(calculateColumnTotalWithPoint("Rem_Ha_sum")) +
                  parseFloat(calculateColumnTotalWithPoint("QA_Ha_sum"))
                ).toFixed(2)}
              </td>
            </tr>

            <tr
              style={{
                backgroundColor: "green",
                fontWeight: "bold",
                color: "white",
              }}
            >
              <td
                colSpan="1"
                style={{
                  backgroundColor: "blue",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {dateFilter}
              </td>
              <td colSpan="5">3JS Information</td>
              <td colSpan="4">Rem Information</td>
              <td colSpan="4">QA Information</td>
            </tr>
            <tr
              style={{
                backgroundColor: "blue",
                fontWeight: "bold",
                color: "white",
              }}
            >
              <td>Names</td>
              <td>ha</td>
              <td>TC</td>
              <td>R1+R0</td>
              <td>Min</td>
              <td>TPM</td>
              <td>ha</td>
              <td>TC</td>
              <td>Min</td>
              <td>TPM</td>
              <td>ha</td>
              <td>TC</td>
              <td>Min</td>
              <td>Total T</td>
            </tr>
            {[...Array(data.length)].map((_, index) => (
              <tr key={index}>
                {[...Array(14)].map((_, subIndex) => (
                  <td
                    key={subIndex}
                    style={
                      subIndex === 0
                        ? { backgroundColor: "lightgrey", fontWeight: "bold" }
                        : {}
                    }
                  >
                    {data[index][keysList[subIndex]] || " "}
                    {/* Row {index + 1} Col {subIndex + 1} */}
                  </td>
                ))}
              </tr>
            ))}
            <tr
              style={{
                backgroundColor: "blue",
                fontWeight: "bold",
                color: "white",
              }}
            >
              <td>Total</td>
              <td>{calculateColumnTotalWithPoint("Ha_sum")}</td>
              <td>{calculateColumnTotal("Algo_TC_sum")}</td>
              <td>{calculateColumnTotal("R0_R1_sum")}</td>
              <td>{calculateColumnTotal("3JS_T_sum")}</td>
              <td>{calculateColumnAverage("3JS_TPM")}</td>
              <td>{calculateColumnTotalWithPoint("Rem_Ha_sum")}</td>
              <td>{calculateColumnTotal("Rem_TC_sum")}</td>
              <td>{calculateColumnTotal("Rem_T_sum")}</td>
              <td>{calculateColumnAverage("Rem_TPM")}</td>
              <td>{calculateColumnTotalWithPoint("QA_Ha_sum")}</td>
              <td>{calculateColumnTotal("QA_TC_sum")}</td>
              <td>{calculateColumnTotal("QA_T_sum")}</td>
              <td>{calculateColumnTotal("Total_sum")}</td>
            </tr>
          </tbody>
        </table>
        <button
          onClick={() => navigate("/lander")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Generate Another Report
        </button>
      </div>
    </div>
  );
};

export default Report;
