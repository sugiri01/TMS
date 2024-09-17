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
    const [currentTask, setCurrentTask] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [types, setTypes] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskAdded, setNewTaskAdded] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchDropdownOptions();
    }, []);

    const fetchTasks = () => {
        axios.get('http://localhost:5000/tasks')
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
        axios.get('http://localhost:5000/projects').then(res => setProjects(res.data)).catch(err => console.error('Error fetching projects:', err));
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
            project: projects[0]?.project_name || 'Unassigned'
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
            project_id: ''
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
                        <div className="space-x-4">
                            <button
                                onClick={handleQuickAddTask}
                                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                            >
                                +Add Task
                            </button>
                            <button 
                                onClick={handleAddNewTask}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
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

                        {tasks.map((task, index) => (
                            <div key={index} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center border-b">
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
                                            className="ml-2 bg-blue-500 text-white py-1 px-2 rounded"
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <span className="cursor-pointer" onClick={() => handleTaskClick(task)}>{task.task_name}</span>
                                )}
                                <span>{task.status}</span>
                                <span>{task.type}</span>
                                <span>{task.due_date || 'No date'}</span>
                                <span>{task.responsible}</span>
                                <span>{task.project}</span>
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

            {isPanelOpen && currentTask && (
                <div className="fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Edit Task</h2>
                        <button onClick={handlePanelClose} className="text-gray-500">&times;</button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Task Name</span>
                            <input
                                type="text"
                                name="task_name"
                                value={currentTask.task_name}
                                onChange={handleTaskEdit}
                                className="border border-gray-300 rounded p-2"
                            />
                        </div>
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
                            <span className="text-gray-500">Project</span>
                            <select name="project_id" value={currentTask.project_id} onChange={handleTaskEdit} className="border border-gray-300 rounded p-2">
                                <option value="">Select Project</option>
                                {projects.map(project => (
                                    <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button onClick={handleSaveTask} className="bg-blue-500 text-white py-2 px-4 rounded mt-6">Save Task</button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-8 rounded shadow-lg w-1/2">
                        <h2 className="text-2xl mb-4">Create Task</h2>
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
                        </div>

                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={handleModalClose} className="bg-gray-400 text-white py-2 px-4 rounded">
                                Cancel
                            </button>
                            <button onClick={handleModalSaveTask} className="bg-blue-500 text-white py-2 px-4 rounded">
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;