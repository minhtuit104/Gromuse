import axios from "./axios";

const getMessageWithUser = async (userId1: number, userId2: number, page: number = 1, pageSize: number = 10) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.get(`/api/v1/messagers/${userId1}/${userId2}?page=${page}&pageSize=${pageSize} `, {
            headers: {
            Authorization: `Bearer ${token}` 
        },
        });
        return response;
    } catch (error) {
        console.log('Error fetching messages:', error);
        throw error;
    }
};

export {getMessageWithUser};
