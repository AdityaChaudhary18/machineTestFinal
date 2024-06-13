from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
import csv
from io import StringIO, TextIOWrapper
import math
from pymongo.errors import PyMongoError
import pandas as pd
import numpy as np
from collections import defaultdict

app = Flask(__name__)
CORS(app)
app.config['MONGO_URI'] = 'mongodb://localhost:27017/machine'  
mongo = PyMongo(app)
@app.route('/uploadcsv', methods=['POST'])
def upload_file():
    # Check if all required files are present in the request
    if 'csv1' not in request.files or 'csv2' not in request.files or 'csv3' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    # Retrieve 'name' parameter from the form data
    name = request.form.get('name')

    # Retrieve the uploaded CSV files from the request
    csv1 = request.files['csv1']
    csv2 = request.files['csv2']
    csv3 = request.files['csv3']

    # Function to parse CSV file content into a list of dictionaries
    def parse_csv(file):
        rows = []
        try:
            # Read file content and decode it as UTF-8
            file_content = StringIO(file.read().decode('utf-8'))
            # Use csv.DictReader to parse CSV content into dictionaries
            csv_data = csv.DictReader(file_content)
            # Iterate over each row in the CSV data
            for row in csv_data:
                # Attempt to convert each value to float where possible
                for key, value in row.items():
                    try:
                        row[key] = float(value)
                    except ValueError:
                        pass  # Ignore if conversion to float fails
                rows.append(row)  # Append the processed row to the list
        except Exception as e:
            return jsonify({'error': str(e)}), 500  # Return error if any exception occurs
        return rows  # Return the list of dictionaries representing CSV data

    # Parse each CSV file and handle potential parsing errors
    csv1_data = parse_csv(csv1)
    csv2_data = parse_csv(csv2)
    csv3_data = parse_csv(csv3)

    # Check if parsing errors occurred and return appropriate responses
    if isinstance(csv1_data, tuple) and csv1_data[1] != 500:
        return "Error Parsing file csv1"
    if isinstance(csv2_data, tuple) and csv2_data[1] != 500:
        return "Error Parsing file csv2"
    if isinstance(csv3_data, tuple) and csv3_data[1] != 500:
        return "Error Parsing file csv3"

    # Construct the data object to be inserted into the database
    data = {
        'name': name,  # Store the name parameter
        'csv1Data': csv1_data,  # Store parsed data from csv1
        'csv2Data': csv2_data,  # Store parsed data from csv2
        'csv3Data': csv3_data   # Store parsed data from csv3
    }

    try:
        # Attempt to insert the data object into MongoDB collection 'data'
        mongo.db.data.insert_one(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Return error if insertion fails

    # Return success message if data upload is successful
    return jsonify({'message': 'Data uploaded successfully'}), 200

@app.route('/report', methods=['GET'])
def get_latest():
    try:
        # Retrieve the latest document from the MongoDB collection 'data'
        latest_doc = mongo.db.data.find().sort([('_id', -1)]).limit(1)
        latest_doc = list(latest_doc)  # Convert the cursor to a list
        if not latest_doc:
            return jsonify({'error': 'No documents found'}), 404  # Return error if no document is found

        latest_doc = latest_doc[0]  # Get the latest document from the list
        csv1_data = latest_doc['csv1Data']  # Extract CSV1 data from the latest document

        # Initialize a dictionary to store PIC and corresponding total Ha values
        pic_ha_sum = {}

        # Iterate over each row in the CSV1 data
        for row in csv1_data:
            pic = row.get('PIC')  # Retrieve the 'PIC' value from the row
            ha = row.get('Ha', 0)  # Retrieve the 'Ha' value from the row; default to 0 if not present
            print(ha, type(ha))  # Print the 'Ha' value and its type for debugging

            # Process 'Ha' value if it's not an empty string
            if ha != '':
                if pic in pic_ha_sum:
                    pic_ha_sum[pic] += float(ha)  # Add 'Ha' value to existing PIC entry
                else:
                    pic_ha_sum[pic] = float(ha)  # Initialize 'Ha' value for new PIC entry

        print(pic_ha_sum)  # Print the resulting PIC-Ha dictionary on the server for debugging

        return jsonify({'message': 'done'}), 200  # Return success message if processing is successful
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Return error if any exception occurs during processing

@app.route('/getForests', methods=['GET'])
def get_all_names():
    try:
        # Retrieve all documents from the MongoDB collection 'data'
        documents = mongo.db.data.find()

        # Extract names from each document and store them in a list
        names = [doc['name'] for doc in documents]

        # Return the list of names as JSON response with HTTP status code 200 (OK)
        return jsonify(names), 200
    except Exception as e:
        # Return an error message with HTTP status code 500 (Internal Server Error) if an exception occurs
        return jsonify({'error': str(e)}), 500
@app.route('/getDates', methods=['GET'])
def get_dates():
    try:
        # Retrieve 'forest' parameter from the query string
        forest = request.args.get('forest')

        # Find the document in MongoDB collection 'data' based on 'name' field
        document = mongo.db.data.find_one({'name': forest})

        # Return error response if no document is found for the specified forest
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        dates = set()  # Initialize a set to store unique dates across all CSV data

        # Process csv1 data if present in the document
        if 'csv1Data' in document:
            csv1_data = document['csv1Data']
            for row in csv1_data:
                if '3JS_Date' in row:  # Check if '3JS_Date' exists in the row
                    dates.add(row['3JS_Date'])  # Add '3JS_Date' value to the set of dates

        # Process csv2 data if present in the document
        if 'csv2Data' in document:
            csv2_data = document['csv2Data']
            for row in csv2_data:
                if 'Rem_Date' in row:  # Check if 'Rem_Date' exists in the row
                    dates.add(row['Rem_Date'])  # Add 'Rem_Date' value to the set of dates

        # Process csv3 data if present in the document
        if 'csv3Data' in document:
            csv3_data = document['csv3Data']
            for row in csv3_data:
                if 'QA_Date' in row:  # Check if 'QA_Date' exists in the row
                    dates.add(row['QA_Date'])  # Add 'QA_Date' value to the set of dates

        unique_dates = list(dates)  # Convert set of dates to a list

        # Return the unique dates as JSON response with HTTP status code 200 (OK)
        return jsonify(unique_dates), 200

    except Exception as e:
        # Return an error message with HTTP status code 500 (Internal Server Error) if an exception occurs
        return jsonify({'error': str(e)}), 500
@app.route('/getReport', methods=['GET'])
def get_report():
    try:
        # Retrieve 'forest' and 'date' parameters from the query string
        selected_forest = request.args.get('forest')
        selected_date = request.args.get('date')

        # Find the document in MongoDB collection 'data' based on 'name' field
        document = mongo.db.data.find_one({'name': selected_forest})

        # Return error response if no document is found for the specified forest
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Initialize a defaultdict to store aggregated data with default list of zeros
        report_data = defaultdict(lambda: [0] * 17)
        
        # Process csv1Data if present in the document
        if 'csv1Data' in document:
            csv1_data = document['csv1Data']
            for row in csv1_data:
                if row.get('3JS_Date') == selected_date:
                    pic = row.get('3JS_PIC')
                    # Aggregate values into report_data dictionary
                    report_data[pic][0] += row.get('Ha', 0)
                    report_data[pic][1] += row.get('Algo_TC', 0)
                    report_data[pic][2] += row.get('R0', 0)
                    report_data[pic][3] += row.get('R1', 0)
                    report_data[pic][4] += row.get('3JS_T', 0)
                    report_data[pic][12] += row.get('3JS_T', 0)
                    report_data[pic][13] += row.get('3JS_TPM', 0)
                    if row.get('3JS_TPM', 0) != 0:
                        report_data[pic][15] += 1
        
        # Calculate average 3JS_TPM for each PIC if applicable
        for item in report_data:
            rowValue = report_data[item]
            if rowValue[15] != 0:
                rowValue[13] = rowValue[13] / rowValue[15]
        
        # Process csv2Data if present in the document
        if 'csv2Data' in document:
            csv2_data = document['csv2Data']
            for row in csv2_data:
                if row.get('Rem_Date') == selected_date:
                    pic = row.get('Rem_PIC')
                    # Aggregate values into report_data dictionary
                    report_data[pic][5] += row.get('Ha', 0)
                    report_data[pic][6] += row.get('Rem_TC', 0)
                    report_data[pic][7] += row.get('Rem_T', 0)
                    report_data[pic][8] += row.get('Rem_T', 0)
                    report_data[pic][12] += row.get('Rem_T', 0)
                    report_data[pic][14] += row.get('Rem_TPM', 0)
                    if row.get('Rem_TPM', 0) != 0:
                        report_data[pic][16] += 1
        
        # Calculate average Rem_TPM for each PIC if applicable
        for item in report_data:
            rowValue = report_data[item]
            if rowValue[16] != 0:
                rowValue[14] = rowValue[14] / rowValue[16]
        
        # Process csv3Data if present in the document
        if 'csv3Data' in document:
            csv3_data = document['csv3Data']
            for row in csv3_data:
                if row.get('QA_Date') == selected_date:
                    pic = row.get('QA_PIC')
                    # Aggregate values into report_data dictionary
                    report_data[pic][9] += row.get('Ha', 0)
                    report_data[pic][10] += row.get('QA_TC', 0)
                    report_data[pic][11] += row.get('QA_T', 0)
                    report_data[pic][12] += row.get('QA_T', 0)

        # Convert defaultdict to regular dictionary
        report_dict = dict(report_data)

        # Prepare the response data list
        response_data = []
        for pic, values in report_data.items():
            response_data.append({
                'PIC': pic,
                'Ha_sum': round(values[0], 1),
                'Algo_TC_sum': int(values[1]),
                'R0_R1_sum': values[2] + values[3],
                '3JS_T_sum': int(values[4]),
                'Rem_Ha_sum': round(values[5], 1),
                'Rem_TC_sum': int(values[6]),
                'Rem_T_sum': int(values[7]),
                'QA_Ha_sum': round(values[9], 1),
                'QA_TC_sum': int(values[10]),
                'QA_T_sum': int(values[11]),
                'Total_sum': int(values[12]),
                '3JS_TPM': round(values[13], 1),
                'Rem_TPM': round(values[14], 1)
            })

        # Return the response data as JSON with HTTP status code 200 (OK)
        return jsonify(response_data), 200

    except Exception as e:
        # Return an error message with HTTP status code 500 (Internal Server Error) if an exception occurs
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
