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
    if 'csv1' not in request.files or 'csv2' not in request.files or 'csv3' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    name = request.form.get('name')
    csv1 = request.files['csv1']
    csv2 = request.files['csv2']
    csv3 = request.files['csv3']

    def parse_csv(file):
        rows = []
        try:
            file_content = StringIO(file.read().decode('utf-8'))
            csv_data = csv.DictReader(file_content)
            for row in csv_data:
                for key, value in row.items():
                    try:
                        row[key] = float(value)
                    except ValueError:
                        pass
                rows.append(row)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        return rows

    csv1_data = parse_csv(csv1)
    csv2_data = parse_csv(csv2)
    csv3_data = parse_csv(csv3)

    if isinstance(csv1_data, tuple) and csv1_data[1] != 500:
        return "Error Parsing file csv1"
    if isinstance(csv2_data, tuple) and csv2_data[1] != 500:
        return "Error Parsing file csv2"
    if isinstance(csv3_data, tuple) and csv3_data[1] != 500:
        return "Error Parsing file csv3"

    data = {
        'name': name,
        'csv1Data': csv1_data,
        'csv2Data': csv2_data,
        'csv3Data': csv3_data
    }

    try:
        mongo.db.data.insert_one(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Data uploaded successfully'}), 200

@app.route('/report', methods=['GET'])
def get_latest():
    try:
        latest_doc = mongo.db.data.find().sort([('_id', -1)]).limit(1)
        latest_doc = list(latest_doc)  # Convert the cursor to a list
        if not latest_doc:
            return jsonify({'error': 'No documents found'}), 404

        latest_doc = latest_doc[0]  # Get the latest document
        csv1_data = latest_doc['csv1Data']

        pic_ha_sum = {}
        for row in csv1_data:
            pic = row.get('PIC')
            ha = row.get('Ha', 0)
            print(ha,type(ha))
            if ha != '':
                if pic in pic_ha_sum:
                    pic_ha_sum[pic] += float(ha)
                else:
                    pic_ha_sum[pic] = float(ha)

        print(pic_ha_sum)  # Print the resulting dictionary on the server

        return jsonify({'message': 'done'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getForests', methods=['GET'])
def get_all_names():
    try:
        documents = mongo.db.data.find()
        names = [doc['name'] for doc in documents]
        return jsonify(names), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getDates', methods=['GET'])
def get_dates():
    try:
        forest = request.args.get('forest')
        document = mongo.db.data.find_one({'name': forest})
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        dates = set()

        # Process csv1
        if 'csv1Data' in document:
            csv1_data = document['csv1Data']
            for row in csv1_data:
                if '3JS_Date' in row:
                    dates.add(row['3JS_Date'])

        # Process csv2
        if 'csv2Data' in document:
            csv2_data = document['csv2Data']
            for row in csv2_data:
                if 'Rem_Date' in row:
                    dates.add(row['Rem_Date'])

        # Process csv3
        if 'csv3Data' in document:
            csv3_data = document['csv3Data']
            for row in csv3_data:
                if 'QA_Date' in row:
                    dates.add(row['QA_Date'])

        unique_dates = list(dates)

        return jsonify(unique_dates), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/getReport', methods=['GET'])
def get_report():
    try:
        selected_forest = request.args.get('forest')
        selected_date = request.args.get('date')

        document = mongo.db.data.find_one({'name': selected_forest})
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        # Initialize a dictionary to store aggregated data
        report_data = defaultdict(lambda: [0] * 17)
        
        # Process csv1Data
        if 'csv1Data' in document:
            csv1_data = document['csv1Data']
            for row in csv1_data:
                if row.get('3JS_Date') == selected_date:
                    pic = row.get('3JS_PIC')
                    report_data[pic][0] += row.get('Ha', 0)
                    report_data[pic][1] += row.get('Algo_TC', 0)
                    report_data[pic][2] += row.get('R0', 0)
                    report_data[pic][3] += row.get('R1', 0)
                    report_data[pic][4] += row.get('3JS_T', 0)
                    report_data[pic][12] += row.get('3JS_T', 0)
                    report_data[pic][13] += row.get('3JS_TPM', 0)
                    if row.get('3JS_TPM', 0)!=0:
                        report_data[pic][15] += 1
        
        for item in report_data:
            rowValue = report_data[item]
            if rowValue[15]!=0:
                rowValue[13] = rowValue[13]/rowValue[15]
        # if report_data[pic][15]!=0:
        #     report_data[pic][13] = report_data[pic][13]/report_data[pic][15]
        
        # Process csv2Data
        if 'csv2Data' in document:
            csv2_data = document['csv2Data']
            for row in csv2_data:
                if row.get('Rem_Date') == selected_date:
                    pic = row.get('Rem_PIC')
                    report_data[pic][5] += row.get('Ha', 0)
                    report_data[pic][6] += row.get('Rem_TC', 0)
                    report_data[pic][7] += row.get('Rem_T', 0)
                    report_data[pic][8] += row.get('Rem_T', 0)
                    report_data[pic][12] += row.get('Rem_T', 0)
                    report_data[pic][14] += row.get('Rem_TPM', 0)
                    if row.get('Rem_TPM', 0)!=0:
                        report_data[pic][16] += 1
        
        for item in report_data:
            rowValue = report_data[item]
            if rowValue[16]!=0:
                rowValue[14] = rowValue[14]/rowValue[16]
        # if report_data[pic][16]!=0:
        #     report_data[pic][14] = report_data[pic][14]/report_data[pic][16]
        
        # Process csv3Data
        if 'csv3Data' in document:
            csv3_data = document['csv3Data']
            for row in csv3_data:
                if row.get('QA_Date') == selected_date:
                    pic = row.get('QA_PIC')
                    report_data[pic][9] += row.get('Ha', 0)
                    report_data[pic][10] += row.get('QA_TC', 0)
                    report_data[pic][11] += row.get('QA_T', 0)
                    report_data[pic][12] += row.get('QA_T', 0)

        # Convert defaultdict to regular dictionary
        report_dict = dict(report_data)

        # Prepare the response
        response_data = []
        for pic, values in report_data.items():
            response_data.append({
                'PIC': pic,
                'Ha_sum': round(values[0],1),
                'Algo_TC_sum': int(values[1]),
                'R0_R1_sum': values[2]+values[3],
                '3JS_T_sum': int(values[4]),
                'Rem_Ha_sum': round(values[5],1),
                'Rem_TC_sum': int(values[6]),
                'Rem_T_sum': int(values[7]),
                'QA_Ha_sum': round(values[9],1),
                'QA_TC_sum': int(values[10]),
                'QA_T_sum': int(values[11]),
                'Total_sum': int(values[12]),
                '3JS_TPM':round(values[13],1),
                'Rem_TPM':round(values[14],1)

            })

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
