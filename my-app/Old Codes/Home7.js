import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        task_name: '',
        status_id: '',
        type_id: '',
        due_date: '',
        responsible_user_id: '',
        project_id: ''
    });
    const [currentTask, setCurrentTask] = useState(null); // for editing task
    const [statuses, setStatuses] = useState([]);
    const [types, setTypes] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchDropdownOptions();
    }, []);

    const fetchTasks = () => {
        axios.get('http://localhost:5000/tasks')
            .then(response => {
                const tasks = response.data;
                const activeTasks = tasks.filter(task => task.status !== 'Completed');
                const completedTasks = tasks.filter(task => task.status === 'Completed');
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
        axios.get('http://localhost:5000/projects').then(res => setProjects(res.data)).catch(err => console.error('Error fetching projects:', err));
    };

    const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
    };

    const handleAddTask = () => {
        if (!newTask.status_id || !newTask.type_id || !newTask.project_id) {
            alert('Please select Status, Type, and Project.');
            return;
        }

        axios.post('http://localhost:5000/tasks', newTask)
        .then(response => {
            fetchTasks();  // Refetch the tasks to update both tables
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

    const handleTaskClick = (task) => {
        setCurrentTask(task);
        setIsPanelOpen(true);
    };

    const handlePanelClose = () => {
        setIsPanelOpen(false);
        setCurrentTask(null);
    };

    const handleTaskEdit = (e) => {
        setCurrentTask({ ...currentTask, [e.target.name]: e.target.value });
    };

    const handleSubtaskAdd = () => {
        alert("Add subtask functionality can be implemented here.");
        // You can add more logic to handle subtasks
    };

    const handleSaveTask = () => {
        axios.put(`http://localhost:5000/tasks/${currentTask.task_id}`, currentTask)
            .then(response => {
                fetchTasks();
                handlePanelClose();
            })
            .catch(error => {
                console.error('Error updating task:', error);
            });
    };

    return (
        <div className="app-container bg-gray-100">
            <div className="flex h-screen">
                <div className="bg-blue-900 w-64 p-6 text-white flex flex-col">
                    <h1 className="text-2xl font-bold">FocusHub</h1>
                    <input type="text" placeholder="Search..." className="bg-gray-800 text-white p-2 rounded mb-6" />
                    <nav className="flex-grow">
                        <ul>
                            <li className="mb-4 font-semibold">My work</li>
                            <li className="mb-4 font-semibold">Teams</li>
                            <li className="mb-4 font-semibold">Projects</li>
                        </ul>
                    </nav>
                    <button className="mt-auto text-blue-400">Invite people</button>
                </div>

                <div className="flex-1 flex flex-col bg-white p-8 overflow-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">Tasks</h2>
                        <button 
                            onClick={handleAddTask}
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                        >
                            Add Task
                        </button>
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

                        {tasks.map((task) => (
                            <div key={task.task_id} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b">
                                <span className="cursor-pointer" onClick={() => handleTaskClick(task)}>{task.task_name}</span>
                                <span>{task.status}</span>
                                <span>{task.type}</span>
                                <span>{task.due_date || 'No date'}</span>
                                <span>{task.responsible}</span>
                                <span>{task.project_name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <h3 className="font-semibold text-xl mb-4">Completed tasks</h3>
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="text-left text-gray-600 p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 font-semibold bg-gray-100">
                                <span>Task</span>
                                <span>Status</span>
                                <span>Type</span>
                                <span>Due date</span>
                                <span>Responsible</span>
                                <span>Project</span>
                            </div>

                            {completedTasks.map((task) => (
                                <div key={task.task_id} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b">
                                    <span>{task.task_name}</span>
                                    <span>{task.status}</span>
                                    <span>{task.type}</span>
                                    <span>{task.due_date || 'No date'}</span>
                                    <span>{task.responsible}</span>
                                    <span>{task.project_name}</span>
                                </div>
                            ))}
                            {completedTasks.length === 0 && (
                                <div className="p-4 text-center text-gray-500">No completed tasks yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Details Panel */}
            {isPanelOpen && currentTask && (
                <div className="fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">{currentTask.task_name}</h2>
                        <button onClick={handlePanelClose} className="text-gray-500">&times;</button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <select name="status_id" value={currentTask.status_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Status</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>{status.status_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <select name="type_id" value={currentTask.type_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Type</option>
                                {types.map(type => (
                                    <option key={type.type_id} value={type.type_id}>{type.type_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Due date</span>
                            <input type="date" name="due_date" value={currentTask.due_date} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2" />
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Responsible</span>
                            <select name="responsible_user_id" value={currentTask.responsible_user_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Responsible</option>
                                {teamMembers.map(member => (
                                    <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Reporter</span>
                            <span>{currentTask.reporter || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-2 mt-6">
                        <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded flex-1" onClick={handleSubtaskAdd}>Add subtask</button>
                        <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded flex-1">Attach file</button>
                    </div>
                    <div className="flex space-x-2 mt-2">
                        <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded flex-1">Add tag</button>
                        <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded flex-1">Repeat task</button>
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <h3 className="font-semibold mb-2">Description</h3>
                        <textarea
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="Write the description"
                            value={currentTask.description || ''}
                            onChange={handleTaskEdit}
                            name="description"
                        />
                    </div>

                    {/* Save Task Button */}
                    <button onClick={handleSaveTask} className="bg-blue-500 text-white py-2 px-4 rounded mt-6">Save Task</button>
                </div>
            )}
        </div>
    );
};

export default Home;
