import { useState, useEffect } from 'react';
import './Users.css';
import { UserList } from './UserList';

const Users = () => {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await fetch("https://jsonplaceholder.typicode.com/users");
                if (response.ok) {
                    const data = await response.json();
                    setTimeout(() => {
                        setUsers(data);
                        setLoading(false);
                    }, 3000)

                    console.log(data)
                } else {
                    setError(' there was an error');
                    throw new Error(' There was an error');
                }

            } catch (err) {
                setError(err.message);
            } finally {
                console.log('done')
            }
        }
        fetchUsers()
    }, [])

    const ready = !error && !loading;

    return (
        <div>
            <h1>Users</h1>
            {error && <h2> {error}</h2>}
            {loading && <h2> Loading...</h2>}
            {ready && <UserList users={users} />}
        </div>
    )
}

export default Users;
