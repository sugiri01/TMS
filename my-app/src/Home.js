import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Calendar from './Calendar';
import People from './People';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        task_name: '',
        status_id: '',
        type_id: '',
        due_date: '',
        responsible_user_id: '',
        project_id: '',
        description: '',
        subtasks: [],
    });
    const [currentTask, setCurrentTask] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [types, setTypes] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskAdded, setNewTaskAdded] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [newTeam, setNewTeam] = useState({ team_name: '', default_task_type: 'Operational', default_event_type: 'Meeting' });
    const [newProject, setNewProject] = useState({ project_name: '', default_task_type: 'Operational', default_event_type: 'Meeting' });
    const [successMessage, setSuccessMessage] = useState('');
    const [isTeamsExpanded, setIsTeamsExpanded] = useState(false);
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [activeScreen, setActiveScreen] = useState('tasks');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchDropdownOptions();
        fetchTeams();
        fetchProjects();
    }, []);

    const fetchTasks = (teamId = null, projectId = null) => {
        let url = 'http://localhost:5000/tasks';
        if (teamId) url += `?team_id=${teamId}`;
        if (projectId) url += `?project_id=${projectId}`;

        axios.get(url)
            .then(response => {
                const allTasks = response.data;
                const activeTasks = allTasks.filter(task => task.status !== 'Completed');
                const completedTasks = allTasks.filter(task => task.status === 'Completed');
                setTasks(activeTasks);
                setCompletedTasks(completedTasks);
            })
            .catch(error => {
                console.error("There was an error fetching the tasks!", error);
            });
    };

    const fetchDropdownOptions = () => {
        axios.get('http://localhost:5000/statuses').then(res => setStatuses(res.data)).catch(err => console.error('Error fetching statuses:', err));
        axios.get('http://localhost:5000/types').then(res => setTypes(res.data)).catch(err => console.error('Error fetching types:', err));
        axios.get('http://localhost:5000/team-members').then(res => setTeamMembers(res.data)).catch(err => console.error('Error fetching team members:', err));
    };

    const fetchTeams = () => {
        axios.get('http://localhost:5000/teams')
            .then(res => setTeams(res.data))
            .catch(err => console.error('Error fetching teams:', err));
    };

    const fetchProjects = () => {
        axios.get('http://localhost:5000/projects')
            .then(res => setProjects(res.data))
            .catch(err => console.error('Error fetching projects:', err));
    };

    const handleQuickAddTask = () => {
        const defaultTask = {
            task_name: '',
            status_id: statuses.find(status => status.status_name === 'New Task')?.status_id || '',
            type_id: types.find(type => type.type_name === 'Operational')?.type_id || '',
            due_date: '',
            responsible_user_id: '',
            project_id: projects[0]?.project_id || '',
            status: 'New Task',
            type: 'Operational',
            responsible: 'Unassigned',
            project: projects[0]?.project_name || 'Unassigned',
            description: '',
            subtasks: [],
        };
        setTasks([...tasks, defaultTask]);
        setNewTaskAdded(true);
    };

    const handleTaskNameChange = (index, event) => {
        const updatedTasks = [...tasks];
        updatedTasks[index].task_name = event.target.value;
        setTasks(updatedTasks);
    };

    const handleTaskNameSave = (index) => {
        const taskToSave = tasks[index];
        if (!taskToSave.status_id || !taskToSave.type_id || !taskToSave.project_id) {
            alert('Please select Status, Type, and Project for the task.');
            return;
        }
        axios.post('http://localhost:5000/tasks', taskToSave)
            .then(response => {
                fetchTasks();
                setNewTaskAdded(false);
            })
            .catch(error => {
                console.error('Error saving task:', error);
                alert('Error saving task. Please try again.');
            });
    };

    const handleAddNewTask = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setNewTask({
            task_name: '',
            status_id: '',
            type_id: '',
            due_date: '',
            responsible_user_id: '',
            project_id: '',
            description: '',
            subtasks: [],
        });
    };

    const handleModalSaveTask = () => {
        if (!newTask.status_id || !newTask.type_id || !newTask.project_id) {
            alert('Please select Status, Type, and Project.');
            return;
        }

        axios.post('http://localhost:5000/tasks', newTask)
            .then(response => {
                fetchTasks();
                handleModalClose();
            })
            .catch(error => {
                console.error('Error adding task:', error);
            });
    };

    const handleTaskClick = (task) => {
        setCurrentTask({
            ...task,
            status_id: task.status_id ? task.status_id.toString() : '',
            type_id: task.type_id ? task.type_id.toString() : '',
            project_id: task.project_id ? task.project_id.toString() : '',
            responsible_user_id: task.responsible_user_id ? task.responsible_user_id.toString() : ''
        });
        setIsPanelOpen(true);
        fetchActivityLog(task.task_id);
    };

    const fetchActivityLog = (taskId) => {
        axios.get(`http://localhost:5000/activity-log/${taskId}`)
            .then(response => {
                setActivityLog(response.data);
            })
            .catch(error => {
                console.error('Error fetching activity log:', error);
            });
    };

    const handlePanelClose = () => {
        setIsPanelOpen(false);
        setCurrentTask(null);
    };

    const handleTaskEdit = (e) => {
        const { name, value } = e.target;
        setCurrentTask(prev => ({
            ...prev,
            [name]: name === 'due_date' ? formatDate(value) : value
        }));
    };

    const handleSubtaskAdd = () => {
        setCurrentTask(prev => ({
            ...prev,
            subtasks: [...(prev.subtasks || []), { id: Date.now(), text: '', completed: false }]
        }));
    };

    const handleSubtaskChange = (id, text) => {
        setCurrentTask(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).map(st => st.id === id ? { ...st, text } : st)
        }));
    };

    const handleSubtaskToggle = (id) => {
        setCurrentTask(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).map(st => st.id === id ? { ...st, completed: !st.completed } : st)
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prevState => ({
            ...prevState,
            [name]: name === 'due_date' ? formatDate(value) : value
        }));
    };

    const handleSaveTask = () => {
        if (!currentTask || !currentTask.task_id) {
            console.error('No task selected or task_id is missing');
            return;
        }

        const taskToSave = {
            ...currentTask,
            due_date: currentTask.due_date ? formatDate(currentTask.due_date) : null
        };

        axios.put(`http://localhost:5000/tasks/${currentTask.task_id}`, taskToSave)
            .then(response => {
                fetchTasks();
                handlePanelClose();
            })
            .catch(error => {
                console.error('Error updating task:', error);
            });
    };

    const [newUser, setNewUser] = useState({ email: '', role: 'Team member', full_name: '' });

    const handleCreateUser = () => {
        if (!newUser.email || !newUser.role || !newUser.full_name) {
            alert('Please fill in all fields');
            return;
        }
    
        axios.post('http://localhost:5000/users', newUser)
            .then(response => {
                setSuccessMessage('User created successfully');
                setIsUserModalOpen(false);
                setNewUser({ email: '', role: 'Team member', full_name: '' });
                // If you have a function to fetch users, call it here to refresh the list
                // fetchUsers();
            })
            .catch(error => {
                console.error('Error creating user:', error);
                alert('Error creating user. Please try again.');
            });
    };


    const handleCreateTeam = () => {
        axios.post('http://localhost:5000/teams', newTeam)
            .then(response => {
                fetchTeams();
                setIsTeamModalOpen(false);
                setSuccessMessage('Team created successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                console.error('Error creating team:', error);
                alert('Error creating team. Please try again.');
            });
    };

    const handleCreateProject = () => {
        axios.post('http://localhost:5000/projects', newProject)
            .then(response => {
                fetchProjects();
                setIsProjectModalOpen(false);
                setSuccessMessage('Project created successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                console.error('Error creating project:', error);
                alert('Error creating project. Please try again.');
            });
    };

    const handleTeamClick = (teamId) => {
        fetchTasks(teamId);
    };

    const handleProjectClick = (projectId) => {
        fetchTasks(null, projectId);
    };

    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'calendar':
                return <Calendar />;
            case 'people':
                return <People />;
            default:
                return (
                    <div className="flex-1 flex flex-col bg-white p-8 overflow-auto">
                        {successMessage && (
                            <div className="bg-green-500 text-white p-2 mb-4 rounded">
                                {successMessage}
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">Tasks</h2>
                            <div className="space-x-4">
                                <button
                                    onClick={handleQuickAddTask}
                                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                                >
                                    +Add Task
                                </button>
                                <button 
                                    onClick={handleAddNewTask}
                                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                                >
                                    Add New
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                            <div className="text-left text-gray-600 p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold bg-gray-100">
                                <span>Task</span>
                                <span>Status</span>
                                <span>Type</span>
                                <span>Due date</span>
                                <span>Responsible</span>
                                <span>Project</span>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {tasks.map((task, index) => (
                                    <div key={index} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b hover:bg-gray-50">
                                        {newTaskAdded && index === tasks.length - 1 ? (
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    placeholder="Enter task name"
                                                    value={task.task_name}
                                                    onChange={(e) => handleTaskNameChange(index, e)}
                                                    className="p-2 border border-gray-300 rounded flex-grow"
                                                />
                                                <button 
                                                    onClick={() => handleTaskNameSave(index)}
                                                    className="ml-2 bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600 transition duration-300"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={() => handleTaskClick(task)}>{task.task_name}</span>
                                        )}
                                        <span>{task.status}</span>
                                        <span>{task.type}</span>
                                        <span>{task.due_date || 'No date'}</span>
                                        <span>{task.responsible}</span>
                                        <span>{task.project}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4 text-gray-700">Completed tasks</h3>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="text-left text-gray-600 p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold bg-gray-100">
                                    <span>Task</span>
                                    <span>Status</span>
                                    <span>Type</span>
                                    <span>Due date</span>
                                    <span>Responsible</span>
                                    <span>Project</span>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {completedTasks.map((task) => (
                                        <div key={task.task_id} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b hover:bg-gray-50">
                                            <span>{task.task_name}</span>
                                            <span>{task.status}</span>
                                            <span>{task.type}</span>
                                            <span>{task.due_date || 'No date'}</span>
                                            <span>{task.responsible}</span>
                                            <span>{task.project}</span>
                                        </div>
                                    ))}
                                    {completedTasks.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">No completed tasks yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app-container bg-gray-100 min-h-screen">
            <div className="flex h-screen">
                <div className="bg-blue-900 w-64 p-6 text-white flex flex-col">
                    <h1 className="text-2xl font-bold mb-6">FocusHub</h1>
                    <input type="text" placeholder="Search..." className="bg-gray-800 text-white p-2 rounded mb-6" />
                    <nav className="flex-grow">
                        <ul>
                            <li className="mb-4 font-semibold cursor-pointer" onClick={() => setActiveScreen('tasks')}>My work</li>
                            <li className="mb-4 cursor-pointer" onClick={() => setActiveScreen('calendar')}>Calendar</li>
                            <li className="mb-4 cursor-pointer" onClick={() => setActiveScreen('people')}>People</li>
                            <li className="mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Teams</span>
                                    <button onClick={() => setIsTeamsExpanded(!isTeamsExpanded)} className="ml-2">
                                        {isTeamsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                                {isTeamsExpanded && (
                                    <ul className="ml-4 mt-2">
                                        {teams.map(team => (
                                            <li key={team.team_id} onClick={() => handleTeamClick(team.team_id)} className="cursor-pointer hover:text-blue-300">
                                                {team.team_name}
                                            </li>
                                        ))}
                                        <li>
                                            <button onClick={() => setIsTeamModalOpen(true)} className="text-blue-300 hover:text-blue-100">+ Add Team</button>
                                        </li>
                                    </ul>
                                )}
                            </li>
                            <li className="mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Projects</span>
                                    <button onClick={() => setIsProjectsExpanded(!isProjectsExpanded)} className="ml-2">
                                        {isProjectsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                                {isProjectsExpanded && (
                                    <ul className="ml-4 mt-2">
                                        {projects.map(project => (
                                            <li key={project.project_id} onClick={() => handleProjectClick(project.project_id)} className="cursor-pointer hover:text-blue-300">
                                                {project.project_name}
                                            </li>
                                        ))}
                                        <li>
                                            <button onClick={() => setIsProjectModalOpen(true)} className="text-blue-300 hover:text-blue-100">+ Add Project</button>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </nav>
                    <button className="mt-auto text-blue-400 hover:text-blue-300">Invite people</button>
                </div>

                {renderActiveScreen()}
            </div>

            {isPanelOpen && currentTask && (
                <div className="fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Edit Task</h2>
                        <button onClick={handlePanelClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Task Name</span>
                            <input
                                type="text"
                                name="task_name"
                                value={currentTask.task_name}
                                onChange={handleTaskEdit}
                                className="border border-gray-300 rounded p-2"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Status</span>
                            <select name="status_id" value={currentTask.status_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Status</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Type</span>
                            <select name="type_id" value={currentTask.type_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Type</option>
                                {types.map(type => (
                                    <option key={type.type_id} value={type.type_id}>{type.type_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Due date</span>
                            <input type="date" name="due_date" value={currentTask.due_date} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Responsible</span>
                            <select name="responsible_user_id" value={currentTask.responsible_user_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Responsible</option>
                                {teamMembers.map(member => (
                                    <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Project</span>
                            <select name="project_id" value={currentTask.project_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Project</option>
                                {projects.map(project => (
                                    <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Description</span>
                            <textarea
                                name="description"
                                value={currentTask.description}
                                onChange={handleTaskEdit}
                                className="border border-gray-300 rounded p-2"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">Subtasks</span>
                            {currentTask.subtasks && currentTask.subtasks.map(subtask => (
                                <div key={subtask.id} className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={() => handleSubtaskToggle(subtask.id)}
                                        className="mr-2"
                                    />
                                    <input
                                        type="text"
                                        value={subtask.text}
                                        onChange={(e) => handleSubtaskChange(subtask.id, e.target.value)}
                                        className="border border-gray-300 rounded p-1 flex-grow"
                                    />
                                </div>
                            ))}
                            <button onClick={handleSubtaskAdd} className="text-blue-500 hover:text-blue-600 mt-2">+ Add Subtask</button>
                        </div>
                    </div>

                    <button onClick={handleSaveTask} className="bg-blue-500 text-white py-2 px-4 rounded mt-6 hover:bg-blue-600 transition duration-300">Save Task</button>

                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Activity Log</h3>
                        <div className="space-y-2">
                            {activityLog.map((log, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                    <span className="font-semibold">{log.timestamp}</span>: {log.action}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-8 rounded shadow-lg w-1/2">
                        <h2 className="text-2xl mb-4 text-gray-800">Create Task</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Task name"
                                value={newTask.task_name}
                                onChange={handleInputChange}
                                name="task_name"
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <select
                                name="status_id"
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Status</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                                ))}
                            </select>
                            <select
                                name="type_id"
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Type</option>
                                {types.map(type => (
                                    <option key={type.type_id} value={type.type_id}>{type.type_name}</option>
                                ))}
                            </select>
                            <select
                                name="project_id"
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Project</option>
                                {projects.map(project => (
                                    <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                                ))}
                            </select>
                            <select
                                name="responsible_user_id"
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Responsible</option>
                                {teamMembers.map(member => (
                                    <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                name="due_date"
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <textarea
                                name="description"
                                placeholder="Task description"
                                value={newTask.description}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={handleModalClose} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={handleModalSaveTask} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300">
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTeamModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-8 rounded shadow-lg w-1/2">
                        <h2 className="text-2xl mb-4 text-gray-800">Create Team</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Team name"
                                value={newTeam.team_name}
                                onChange={(e) => setNewTeam({...newTeam, team_name: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <select
                                value={newTeam.default_task_type}
                                onChange={(e) => setNewTeam({...newTeam, default_task_type: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="Operational">Operational</option>
                                <option value="Strategic">Strategic</option>
                            </select>
                            <select
                                value={newTeam.default_event_type}
                                onChange={(e) => setNewTeam({...newTeam, default_event_type: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="Meeting">Meeting</option>
                                <option value="Call">Call</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setIsTeamModalOpen(false)} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={handleCreateTeam} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300">
                                Create Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Creation Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-8 rounded shadow-lg w-1/2">
                        <h2 className="text-2xl mb-4 text-gray-800">Create User</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="Team member">Team member</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setIsUserModalOpen(false)} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={handleCreateUser} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300">
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isProjectModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-8 rounded shadow-lg w-1/2">
                        <h2 className="text-2xl mb-4 text-gray-800">Create Project</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Project name"
                                value={newProject.project_name}
                                onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <select
                                value={newProject.default_task_type}
                                onChange={(e) => setNewProject({...newProject, default_task_type: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="Operational">Operational</option>
                                <option value="Strategic">Strategic</option>
                            </select>
                            <select
                                value={newProject.default_event_type}
                                onChange={(e) => setNewProject({...newProject, default_event_type: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="Meeting">Meeting</option>
                                <option value="Call">Call</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setIsProjectModalOpen(false)} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={handleCreateProject} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300">
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;