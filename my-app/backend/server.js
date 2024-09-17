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
            tasks.responsible_user_id,
            tasks.description
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
            // Fetch subtasks for each task
            const taskIds = result.map(task => task.task_id);
            if (taskIds.length > 0) {
                const subtasksSql = 'SELECT * FROM subtasks WHERE task_id IN (?)';
                db.query(subtasksSql, [taskIds], (subtasksErr, subtasksResult) => {
                    if (subtasksErr) {
                        console.error('Error fetching subtasks:', subtasksErr);
                        res.status(500).json({ error: 'Database error' });
                    } else {
                        // Attach subtasks to their respective tasks
                        result.forEach(task => {
                            task.subtasks = subtasksResult.filter(subtask => subtask.task_id === task.task_id);
                        });
                        res.json(result);
                    }
                });
            } else {
                res.json(result);
            }
        }
    });
});

// Add a new task
app.post('/tasks', (req, res) => {
    const { task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id, description, subtasks } = req.body;

    if (!status_id || !type_id) {
        return res.status(400).json({ error: 'status_id and type_id are required' });
    }

    const insertSql = `
        INSERT INTO tasks (task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const taskData = [
        task_name, 
        status_id, 
        type_id, 
        due_date || null,
        project_id || null,
        responsible_user_id || null,
        team_id || null,
        description || null
    ];
    
    db.query(insertSql, taskData, (err, result) => {
        if (err) {
            console.error('Error inserting new task:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            const newTaskId = result.insertId;
            
            // Insert subtasks if any
            if (subtasks && subtasks.length > 0) {
                const subtasksSql = 'INSERT INTO subtasks (task_id, text, completed) VALUES ?';
                const subtasksValues = subtasks.map(subtask => [newTaskId, subtask.text, subtask.completed]);
                db.query(subtasksSql, [subtasksValues], (subtasksErr) => {
                    if (subtasksErr) {
                        console.error('Error inserting subtasks:', subtasksErr);
                    }
                });
            }

            // Log activity
            const activitySql = 'INSERT INTO activity_log (task_id, action) VALUES (?, ?)';
            db.query(activitySql, [newTaskId, 'Task created'], (activityErr) => {
                if (activityErr) {
                    console.error('Error logging activity:', activityErr);
                }
            });

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
                    tasks.team_id,
                    tasks.description
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
    const { task_name, status_id, type_id, due_date, project_id, responsible_user_id, team_id, description, subtasks } = req.body;

    if (!task_id) {
        return res.status(400).json({ error: 'task_id is required' });
    }

    const updateSql = `
        UPDATE tasks
        SET task_name = ?, status_id = ?, type_id = ?, due_date = ?, project_id = ?, responsible_user_id = ?, team_id = ?, description = ?
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
        description || null,
        task_id
    ];

    db.query(updateSql, updateData, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ error: 'Database error', details: err.message });
        } else {
            // Update subtasks
            if (subtasks) {
                // Delete existing subtasks
                const deleteSubtasksSql = 'DELETE FROM subtasks WHERE task_id = ?';
                db.query(deleteSubtasksSql, [task_id], (deleteErr) => {
                    if (deleteErr) {
                        console.error('Error deleting existing subtasks:', deleteErr);
                    }
                    
                    // Insert new subtasks
                    if (subtasks.length > 0) {
                        const insertSubtasksSql = 'INSERT INTO subtasks (task_id, text, completed) VALUES ?';
                        const subtasksValues = subtasks.map(subtask => [task_id, subtask.text, subtask.completed]);
                        db.query(insertSubtasksSql, [subtasksValues], (insertErr) => {
                            if (insertErr) {
                                console.error('Error inserting new subtasks:', insertErr);
                            }
                        });
                    }
                });
            }

            // Log activity
            const activitySql = 'INSERT INTO activity_log (task_id, action) VALUES (?, ?)';
            db.query(activitySql, [task_id, 'Task updated'], (activityErr) => {
                if (activityErr) {
                    console.error('Error logging activity:', activityErr);
                }
            });

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

// Fetch activity log for a task
app.get('/activity-log/:task_id', (req, res) => {
    const { task_id } = req.params;
    const sql = 'SELECT * FROM activity_log WHERE task_id = ? ORDER BY timestamp DESC';
    db.query(sql, [task_id], (err, result) => {
        if (err) {
            console.error('Error fetching activity log:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// New endpoint for fetching users (for People component)
app.get('/users', (req, res) => {
    const sql = `
        SELECT user_id, full_name, email, role, status
        FROM users
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

// New endpoint for adding a user (for People component)
app.post('/users', (req, res) => {
    const { email, role, full_name } = req.body;
    
    if (!email || !role || !full_name) {
        return res.status(400).json({ error: 'Email, role, and full name are required' });
    }

    const insertSql = `
        INSERT INTO users (email, role, status, full_name)
        VALUES (?, ?, 'Invited', ?);
    `;
    db.query(insertSql, [email, role, full_name], (err, result) => {
        if (err) {
            console.error('Error adding new user:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'User added successfully', user_id: result.insertId });
        }
    });
});

// New endpoint for fetching tasks for the Calendar component
app.get('/calendar-tasks', (req, res) => {
    const sql = `
        SELECT
            tasks.task_id,
            tasks.task_name,
            task_status.status_name AS status,
            task_types.type_name AS type,
            tasks.due_date,
            COALESCE(users.full_name, 'Unassigned') AS responsible,
            projects.project_name AS project,
            tasks.estimated_time
        FROM tasks
        JOIN task_status ON tasks.status_id = task_status.status_id
        JOIN task_types ON tasks.type_id = task_types.type_id
        LEFT JOIN projects ON tasks.project_id = projects.project_id
        LEFT JOIN users ON tasks.responsible_user_id = users.user_id
        WHERE tasks.due_date IS NOT NULL
        ORDER BY tasks.due_date ASC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching calendar tasks:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(result);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});