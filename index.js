const fs = require('fs');

// Function to calculate the time difference in hours between two time strings
function calculateTimeDifference(timeIn, timeOut) {
    if (!timeIn || !timeOut) {
        return 0;
    }

    const timeInDate = new Date(timeIn);
    const timeOutDate = new Date(timeOut);
    const diffMilliseconds = timeOutDate - timeInDate;
    return diffMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours
}

// Read the file
fs.readFile('employee_data.csv', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // Split the file data into rows
    const rows = data.split('\n');

    // Create an object to store employee data
    const employees = {};

    // Process each row starting from the second row (1 -> to skip the header)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',');

        const positionID = row[0];
        const positionStatus = row[1];
        const timeIn = row[2];
        const timeOut = row[3];
        const timecardHours = row[4];
        const payCycleStartDate = row[5];
        const payCycleEndDate = row[6];
        const employeeName = row[7];
        const fileNumber = row[8];

        // Check if any of the required fields are missing or empty
        if (!employeeName || !timeIn || !timeOut) {
            console.warn(`Incomplete data in row ${i + 1}. Skipping.`);
            continue;
        }

        if (!employees[employeeName]) {
            employees[employeeName] = {
                positions: [],
                consecutiveDays: [],
            };
        }

        // Calculate shift duration
        const shiftDuration = calculateTimeDifference(timeIn, timeOut);

        // Check for consecutive days
        // Check for consecutive days
        const startDate = new Date(payCycleStartDate);
        if (employees[employeeName].consecutiveDays.length === 0) {
            employees[employeeName].consecutiveDays.push(startDate);
        } else {
            const lastDate = employees[employeeName].consecutiveDays[employees[employeeName].consecutiveDays.length - 1];
            const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
            if (startDate - lastDate === oneDay) {
                employees[employeeName].consecutiveDays.push(startDate);
            } else {
                employees[employeeName].consecutiveDays = [startDate];
            }
        }


        // Check for less than 10 hours between shifts but greater than 1 hour
        if (
            employees[employeeName].lastEndTime &&
            calculateTimeDifference(employees[employeeName].lastEndTime, timeIn) > 1 &&
            calculateTimeDifference(employees[employeeName].lastEndTime, timeIn) < 10
        ) {
            employees[employeeName].positions.push(positionStatus + ` (Shift: ${shiftDuration} hours)`);
        }

        // Check for more than 14 hours in a single shift
        if (shiftDuration > 14) {
            employees[employeeName].positions.push(positionStatus + ` (Shift: ${shiftDuration} hours)`);
        }

        employees[employeeName].lastEndTime = timeOut;
    }

    // Create output files
    const outputFiles = {
        a: '7_consecutive_days.txt',
        b: 'less_than_10_hours_between_shifts.txt',
        c: 'more_than_14_hours_in_single_shift.txt',
    };

    // Create and write results to output files
    for (const criteria in outputFiles) {
        const output = [];

        for (const employeeName in employees) {
            const employee = employees[employeeName];
            if (criteria === 'a' && employee.consecutiveDays.length >= 7) {
                output.push(`a) Employee Name: ${employeeName} (Worked for 7 consecutive days)`);
            }

            if (criteria === 'b' && employee.positions.length > 0) {
                output.push(`b) Employee Name: ${employeeName}`);
                employee.positions.forEach((position) => {
                    output.push(`  - Position: ${position}`);
                });
            }

            if (criteria === 'c' && employee.positions.some((position) => position.includes('Shift:'))) {
                output.push(`c) Employee Name: ${employeeName} (Worked for more than 14 hours in a single shift)`);
            }
        }

        const outputPath = outputFiles[criteria];
        fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
    }

    console.log('Results written to output files.');
});
