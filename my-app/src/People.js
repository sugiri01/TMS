import React, { useState, useEffect } from 'react';
import axios from 'axios';

const People = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ email: '', role: 'Team member' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddUser = async () => {
        try {
            await axios.post('http://localhost:5000/users', newUser);
            setIsModalOpen(false);
            setNewUser({ email: '', role: 'Team member' });
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white py-2 px-4 rounded">+ Add new</button>
            </div>
            <div className="flex-1">
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="table-header text-left text-gray-500 p-4 grid grid-cols-5 gap-4">
                        <span>User</span>
                        <span>Email</span>
                        <span>Role in team</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    {users.map(user => (
                        <div key={user.user_id} className="table-row p-4 grid grid-cols-5 gap-4 items-center border-t">
                            <div className="flex items-center">
                                <img src={user.avatar || 'https://via.placeholder.com/40'} alt="User Avatar" className="w-10 h-10 rounded-full mr-2" />
                                <span>{user.full_name}</span>
                            </div>
                            <span>{user.email}</span>
                            <span>{user.role}</span>
                            <span className="text-blue-500">{user.status}</span>
                            <button className="text-blue-500 hover:text-blue-700">Edit</button>
                        </div>
                    ))}
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            className="w-full p-2 mb-4 border rounded"
                        >
                            <option value="Team member">Team member</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <div className="flex justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
                            <button onClick={handleAddUser} className="px-4 py-2 bg-blue-500 text-white rounded">Add User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default People;