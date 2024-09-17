import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        fetchTasks();
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

    const handleAddTask = () => {
        const taskData = {
            task_name: newTask || 'New task',
            status_id: 1,   // Default status (New task)
            type_id: 1,     // Default type (Technical)
            due_date: null,
            project_id: 1   // Default project (TesT)
        };

        axios.post('http://localhost:5000/tasks', taskData)
        .then(response => {
            console.log('Task added:', response.data);
            setNewTask(''); // Clear input after adding task
            fetchTasks(); // Fetch tasks again to update the list
        })
        .catch(error => {
            console.error('Error adding task:', error);
        });
    };

    return (
        <div className="app-container bg-gray-100">
            {/* ... (rest of the component remains the same) ... */}

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
                            <span className="text-yellow-500 font-semibold">{task.type}</span>
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

            {/* ... (rest of the component remains the same) ... */}
        </div>
    );
};

export default Home;