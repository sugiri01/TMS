import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays, startOfWeek } from 'date-fns';

const Calendar = () => {
    const [tasks, setTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchTasks();
    }, [currentDate]);

    const fetchTasks = async () => {
        try {
            const response = await axios.get('http://localhost:5000/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const renderWeek = () => {
        const weekStart = startOfWeek(currentDate);
        return Array.from({ length: 7 }).map((_, index) => {
            const day = addDays(weekStart, index);
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.due_date);
                return taskDate.toDateString() === day.toDateString();
            });

            return (
                <div key={index} className="flex-1">
                    <h3 className="font-semibold mb-2">{format(day, 'd EEE')}</h3>
                    {dayTasks.map(task => (
                        <div key={task.task_id} className={`p-4 mb-4 rounded-lg ${getTaskColor(task.type)}`}>
                            <h4 className="font-semibold">{task.task_name}</h4>
                            <p className="text-sm">{task.project}</p>
                            {task.estimated_time && <p className="text-sm">{task.estimated_time}h</p>}
                        </div>
                    ))}
                </div>
            );
        });
    };

    const getTaskColor = (taskType) => {
        const colors = {
            'Operational': 'bg-blue-50',
            'Strategic': 'bg-yellow-50',
            'Meeting': 'bg-green-50',
            'Call': 'bg-purple-50'
        };
        return colors[taskType] || 'bg-gray-50';
    };

    return (
        <div className="flex-1 flex flex-col p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
                <button className="bg-blue-500 text-white py-2 px-4 rounded">+ Add new</button>
                <div className="relative inline-block">
                    <button className="bg-gray-200 py-2 px-4 rounded">Today</button>
                </div>
            </div>
            <div className="flex justify-between space-x-4">
                <div className="flex-1 grid grid-cols-7 gap-4">
                    {renderWeek()}
                </div>
                <div className="w-1/4">
                    <h3 className="font-semibold mb-2">Waiting list</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold">📞 Book a call </h4>
                        <p className="text-sm">IT / Software Development</p>
                        <p className="text-sm">0:15h</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;