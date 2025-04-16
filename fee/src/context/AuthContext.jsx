/* eslint-disable no-useless-catch */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { login, register, getProfile, updateProfile } from '../services/auth';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (!token || !storedUser) {
                    setUser(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }

                try {
                    // Thêm header Authorization
                    const response = await api.get('/users/me', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.data) {
                        setUser(response.data);
                        setIsAuthenticated(true);
                        localStorage.setItem('user', JSON.stringify(response.data));
                    } else {
                        // Nếu không có data, xóa token và user
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    // Nếu có lỗi 401, xóa token và user
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        setIsAuthenticated(false);
                    } else {
                        // Nếu lỗi khác, sử dụng thông tin đã lưu
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            setUser(parsedUser);
                            setIsAuthenticated(true);
                        } catch (parseError) {
                            console.error('Error parsing stored user:', parseError);
                            localStorage.removeItem('user');
                            setUser(null);
                            setIsAuthenticated(false);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking token:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, []);

    const loginUser = async (email, password) => {
        try {
            const response = await login(email, password);
            const { token, user } = response;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            setIsAuthenticated(true);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const registerUser = async (userData) => {
        try {
            const response = await register(userData);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUserProfile = async (userData) => {
        try {
            const response = await updateProfile(userData);
            setUser(response);
            localStorage.setItem('user', JSON.stringify(response));
            return response;
        } catch (error) {
            throw error;
        }
    };

    const value = useMemo(() => ({
        user,
        loading,
        isAuthenticated,
        token: localStorage.getItem('token'),
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        updateProfile: updateUserProfile,
    }), [user, loading, isAuthenticated]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};