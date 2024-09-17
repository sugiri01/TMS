const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'newpassword',  // change this to your MySQL password
    database: 'focushub'  // change this to your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Fetch all tasks
app.get('/tasks', (req, res) => {
    let sql = `
        SELECT
            tasks.task_id,
            tasks.task_name,
            task_status.status_name AS status,
            task_types.type_name AS type,
            tasks.due_date,
            COALESCE(users.full_name, 'Unassigned') AS responsible,
            projects.project_name AS project,
            tasks.status_id,
            tasks.type_id,
            tasks.project_id,
            tasks.responsible_user_id
        FROM tasks
        JOIN task_status ON tasks.status_id = task_status.status_id
        JOIN task_types ON tasks.type_id = task_types.type_id
        LEFT JOIN projects ON tasks.project_id = projects.project_id
        LEFT JOIN users ON tasks.responsible_user_id = users.user_id
    `;

    const params = [];

    if (req.query.team_id) {
        sql += ' WHERE tasks.team_id = ?';
        params.push(req.query.team_id);
    } else if (req.query.project_id) {
        sql += ' WHERE tasks.project_id = ?';
        params.push(req.query.project_id);
    }

    sql += ' ORDER BY tasks.task_id DESC';

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// Add a new task
app.post('/tasks', (req, res) => {
    const { task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id } = req.body;

    if (!status_id || !type_id) {
        return res.status(400).json({ error: 'status_id and type_id are required' });
    }

    const insertSql = `
        INSERT INTO tasks (task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const taskData = [
        task_name, 
        status_id, 
        type_id, 
        due_date || null,
        project_id || null,
        responsible_user_id || null,
        team_id || null
    ];
    
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
                    projects.project_name AS project,
                    tasks.status_id,
                    tasks.type_id,
                    tasks.project_id,
                    tasks.responsible_user_id,
                    tasks.team_id
                FROM tasks
                JOIN task_status ON tasks.status_id = task_status.status_id
                JOIN task_types ON tasks.type_id = task_types.type_id
                LEFT JOIN projects ON tasks.project_id = projects.project_id
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

// Update an existing task
app.put('/tasks/:task_id', (req, res) => {
    const { task_id } = req.params;
    const { task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id } = req.body;

    if (!task_id) {
        return res.status(400).json({ error: 'task_id is required' });
    }

    const updateSql = `
        UPDATE tasks
        SET task_name = ?, status_id = ?, type_id = ?, due_date = ?, project_id = ?, responsible_user_id = ?, team_id = ?
        WHERE task_id = ?;
    `;
    const updateData = [
        task_name, 
        status_id, 
        type_id, 
        due_date || null,
        project_id || null,
        responsible_user_id || null,
        team_id || null,
        task_id
    ];

    db.query(updateSql, updateData, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ error: 'Database error', details: err.message });
        } else {
            res.json({ message: 'Task updated successfully' });
        }
    });
});

// Fetch all statuses
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

// Fetch all types
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

// Fetch all team members
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

// Fetch all projects
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

// Fetch all teams
app.get('/teams', (req, res) => {
    const sql = 'SELECT team_id, team_name FROM teams';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching teams:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// Create a new team
app.post('/teams', (req, res) => {
    const { team_name, default_task_type, default_event_type } = req.body;

    if (!team_name) {
        return res.status(400).json({ error: 'Team name is required' });
    }

    const insertSql = `
        INSERT INTO teams (team_name, default_task_type, default_event_type)
        VALUES (?, ?, ?);
    `;
    const teamData = [team_name, default_task_type, default_event_type];
    
    db.query(insertSql, teamData, (err, result) => {
        if (err) {
            console.error('Error creating new team:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Team created successfully', team_id: result.insertId });
        }
    });
});

// Create a new project
app.post('/projects', (req, res) => {
    const { project_name, default_task_type, default_event_type } = req.body;

    if (!project_name) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const insertSql = `
        INSERT INTO projects (project_name, default_task_type, default_event_type)
        VALUES (?, ?, ?);
    `;
    const projectData = [project_name, default_task_type, default_event_type];
    
    db.query(insertSql, projectData, (err, result) => {
        if (err) {
            console.error('Error creating new project:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Project created successfully', project_id: result.insertId });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});