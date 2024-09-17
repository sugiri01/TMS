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
            tasks.task_id,
            tasks.task_name,
            task_status.status_name AS status,
            task_types.type_name AS type,
            tasks.due_date,
            COALESCE(users.full_name, 'Unassigned') AS responsible,
            projects.project_name
        FROM tasks
        JOIN task_status ON tasks.status_id = task_status.status_id
        JOIN task_types ON tasks.type_id = task_types.type_id
        JOIN projects ON tasks.project_id = projects.project_id
        LEFT JOIN users ON tasks.responsible_user_id = users.user_id
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
    const { task_name, status_id, type_id, due_date, project_id, responsible_user_id } = req.body;

    if (!status_id || !type_id || !project_id) {
        return res.status(400).json({ error: 'status_id, type_id, and project_id are required' });
    }

    const insertSql = `
        INSERT INTO tasks (task_name, status_id, type_id, due_date, project_id, responsible_user_id)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const taskData = [task_name, status_id, type_id, due_date, project_id, responsible_user_id || null];
    db.query(insertSql, taskData, (err, result) => {
        if (err) {
            console.error('Error inserting new task:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            const newTaskId = result.insertId;
            const selectSql = `
                SELECT
                    tasks.task_id,
                    tasks.task_name,
                    task_status.status_name AS status,
                    task_types.type_name AS type,
                    tasks.due_date,
                    COALESCE(users.full_name, 'Unassigned') AS responsible,
                    projects.project_name
                FROM tasks
                JOIN task_status ON tasks.status_id = task_status.status_id
                JOIN task_types ON tasks.type_id = task_types.type_id
                JOIN projects ON tasks.project_id = projects.project_id
                LEFT JOIN users ON tasks.responsible_user_id = users.user_id
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

// API to get status options
app.get('/statuses', (req, res) => {
    const sql = 'SELECT status_id, status_name FROM task_status';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching statuses:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// API to get type options
app.get('/types', (req, res) => {
    const sql = 'SELECT type_id, type_name FROM task_types';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching types:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// API to get team members
app.get('/team-members', (req, res) => {
    const sql = 'SELECT user_id, full_name FROM users WHERE role != "admin"';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching team members:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// API to get projects
app.get('/projects', (req, res) => {
    const sql = 'SELECT project_id, project_name FROM projects';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching projects:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
