import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        task_name: '',
        status_id: '', // Default empty
        type_id: '',   // Default empty
        due_date: '',
        responsible_user_id: '', // Default empty
        project_id: ''  // Default empty
    });
    const [statuses, setStatuses] = useState([]);
    const [types, setTypes] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchTasks();
        fetchDropdownOptions();
    }, []);

    const fetchTasks = () => {
        axios.get('http://localhost:5000/tasks')
            .then(response => {
                setTasks(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the tasks!", error);
            });
    };

    const fetchDropdownOptions = () => {
        axios.get('http://localhost:5000/statuses').then(res => setStatuses(res.data)).catch(err => console.error('Error fetching statuses:', err));
        axios.get('http://localhost:5000/types').then(res => setTypes(res.data)).catch(err => console.error('Error fetching types:', err));
        axios.get('http://localhost:5000/team-members').then(res => setTeamMembers(res.data)).catch(err => console.error('Error fetching team members:', err));
        axios.get('http://localhost:5000/projects').then(res => setProjects(res.data)).catch(err => console.error('Error fetching projects:', err));
    };

    const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
    };

    const handleAddTask = () => {
        // Make sure status_id, type_id, and project_id are not empty
        if (!newTask.status_id || !newTask.type_id || !newTask.project_id) {
            alert('Please select Status, Type, and Project.');
            return;
        }

        axios.post('http://localhost:5000/tasks', newTask)
        .then(response => {
            console.log('Task added:', response.data);
            setTasks([response.data, ...tasks]);
            setNewTask({
                task_name: '',
                status_id: '',
                type_id: '',
                due_date: '',
                responsible_user_id: '',
                project_id: ''
            });
        })
        .catch(error => {
            console.error('Error adding task:', error);
        });
    };

    return (
        <div className="app-container bg-gray-100">
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className="bg-blue-900 w-64 p-6 text-white flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">FocusHub</h1>
                        <span className="text-sm"></span>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-gray-800 text-white p-2 rounded mb-6" 
                    />
                    <nav className="flex-grow">
                        <ul>
                            <li className="mb-4 font-semibold">My work</li>
                            <li className="mb-4 font-semibold">
                                Teams
                                <ul className="ml-4 mt-2">
                                    <li className="text-gray-300">IT / Software Development</li>
                                    <li className="text-gray-300">Team 1</li>
                                </ul>
                            </li>
                            <li className="mb-4 font-semibold">
                                Projects
                                <ul className="ml-4 mt-2">
                                    <li className="bg-blue-800 text-white p-1 rounded">TesT</li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                    <button className="mt-auto text-blue-400">Invite people</button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white p-8 overflow-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">Tasks</h2>
                        <div className="flex">
                            <button className="mr-4 text-gray-500 hover:text-blue-500">Table view</button>
                            <button className="text-gray-500 hover:text-blue-500">Kanban board</button>
                        </div>
                    </div>

                    {/* Task Table */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="text-left text-gray-600 p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold bg-gray-100">
                            <span>Task</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Due date</span>
                            <span>Responsible</span>
                            <span>Project</span>
                            <span>Action</span>
                        </div>

                        {/* New Task Form */}
                        <div className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b">
                            <input 
                                type="text" 
                                name="task_name"
                                value={newTask.task_name} 
                                onChange={handleInputChange} 
                                placeholder="Enter new task" 
                                className="p-2 border border-gray-300 rounded"
                            />
                            <select
                                name="status_id"
                                value={newTask.status_id}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Status</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                                ))}
                            </select>
                            <select
                                name="type_id"
                                value={newTask.type_id}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Type</option>
                                {types.map(type => (
                                    <option key={type.type_id} value={type.type_id}>{type.type_name}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                name="due_date"
                                value={newTask.due_date}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded"
                            />
                            <select
                                name="responsible_user_id"
                                value={newTask.responsible_user_id}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Responsible</option>
                                {teamMembers.map(member => (
                                    <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
                                ))}
                            </select>
                            <select
                                name="project_id"
                                value={newTask.project_id}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Project</option>
                                {projects.map(project => (
                                    <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleAddTask}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                            >
                                Add Task
                            </button>
                        </div>

                        {/* Existing Tasks */}
                        {tasks.map((task) => (
                            <div key={task.task_id} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b">
                                <span>{task.task_name}</span>
                                <span>{task.status}</span>
                                <span>{task.type}</span>
                                <span>{task.due_date || 'No date'}</span>
                                <span>{task.responsible}</span>
                                <span>{task.project_name}</span>
                                <span>
                                    {/* Add action buttons here if needed */}
                                </span>
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="p-4 text-center text-gray-500">No tasks available</div>
                        )}
                    </div>

                    <div className="mt-8">
                        <h3 className="font-semibold text-xl mb-4">Completed tasks</h3>
                        <p className="text-gray-500">No completed tasks yet</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
