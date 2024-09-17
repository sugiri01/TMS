const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'newpassword',
    database: 'focushub'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// API to get tasks
app.get('/tasks', (req, res) => {
    const sql = `
        SELECT
            tasks.task_name,
            task_status.status_name AS status,
            task_types.type_name AS type,
            tasks.due_date,
            projects.project_name
        FROM tasks
        JOIN task_status ON tasks.status_id = task_status.status_id
        JOIN task_types ON tasks.type_id = task_types.type_id
        JOIN projects ON tasks.project_id = projects.project_id
        ORDER BY tasks.task_id DESC;
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// API to add a new task
app.post('/tasks', (req, res) => {
    const { task_name = 'New task', status_id = 1, type_id = 1, due_date = null, project_id = 1 } = req.body;

    const insertSql = `
        INSERT INTO tasks (task_name, status_id, type_id, due_date, project_id)
        VALUES (?, ?, ?, ?, ?);
    `;
    const taskData = [task_name, status_id, type_id, due_date, project_id];

    db.query(insertSql, taskData, (err, result) => {
        if (err) {
            console.error('Error inserting new task:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            const newTaskId = result.insertId;
            
            // Fetch the newly inserted task with all details
            const selectSql = `
                SELECT
                    tasks.task_name,
                    task_status.status_name AS status,
                    task_types.type_name AS type,
                    tasks.due_date,
                    projects.project_name
                FROM tasks
                JOIN task_status ON tasks.status_id = task_status.status_id
                JOIN task_types ON tasks.type_id = task_types.type_id
                JOIN projects ON tasks.project_id = projects.project_id
                WHERE tasks.task_id = ?;
            `;

            db.query(selectSql, [newTaskId], (selectErr, selectResult) => {
                if (selectErr) {
                    console.error('Error fetching new task details:', selectErr);
                    res.status(500).json({ error: 'Database error' });
                } else {
                    res.json(selectResult[0]);
                }
            });
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});