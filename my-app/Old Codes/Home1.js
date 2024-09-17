import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        // Fetch tasks from backend
        axios.get('http://localhost:5000/tasks')
            .then(response => {
                setTasks(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the tasks!", error);
            });
    }, []);

    const handleAddTask = () => {
        const taskData = {
            task_name: newTask,
            status_id: 1,   // Default status
            type_id: 1,     // Default type, you can set these values dynamically
            due_date: null, // Or set a date if available
            project_id: 1   // Ensure this project exists, or set it dynamically
        };

        axios.post('http://localhost:5000/tasks', taskData)
        .then(response => {
            console.log('Task added:', response.data);
            setNewTask(''); // Clear input after adding task

            // Optionally, fetch tasks again to update the list
            axios.get('http://localhost:5000/tasks')
                .then(response => {
                    setTasks(response.data);
                })
                .catch(error => {
                    console.error("Error fetching tasks after adding:", error);
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
                        <button 
                            className="bg-blue-500 text-white py-2 px-6 rounded shadow-md" 
                            onClick={handleAddTask}
                        >
                            + Add new
                        </button>
                        <div className="flex">
                            <button className="mr-4 text-gray-500 hover:text-blue-500">Table view</button>
                            <button className="text-gray-500 hover:text-blue-500">Kanban board</button>
                        </div>
                    </div>

                    <input 
                        type="text" 
                        value={newTask} 
                        onChange={(e) => setNewTask(e.target.value)} 
                        placeholder="Enter new task" 
                        className="mb-4 p-2 border border-gray-300 rounded"
                    />

                    {/* Task Table */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="text-left text-gray-600 p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6 font-semibold bg-gray-100">
                            <span>Task</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Due date</span>
                            <span>Create in</span>
                        </div>

                        {tasks.length > 0 ? (
                            tasks.map((task, index) => (
                                <div key={index} className="p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6 items-center border-b">
                                    <span>{task.task_name}</span>
                                    <span className="text-green-500 font-semibold">{task.status}</span>
                                    <span className="text-yellow-500 font-semibold">{task.type || 'Financial'}</span>
                                    <span>{task.due_date || 'No date'}</span>
                                    <span>{task.project_name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">No tasks available</div>
                        )}

                        <div className="p-4">
                            <p className="text-blue-500 font-semibold cursor-pointer" onClick={handleAddTask}>+ Add task</p>
                        </div>
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
