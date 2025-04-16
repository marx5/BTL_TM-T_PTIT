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
    const navigate = useNavigate();

    // Chỉ giữ lại một useEffect để kiểm tra token
    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (!token || !storedUser) {
                    setUser(null);
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
                        localStorage.setItem('user', JSON.stringify(response.data));
                    } else {
                        // Nếu không có data, xóa token và user
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);

                    // Nếu lỗi 401 hoặc 500, xóa token và user
                    if (error.response?.status === 401 || error.response?.status === 500) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } else {
                        // Nếu lỗi khác, sử dụng thông tin đã lưu
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            setUser(parsedUser);
                        } catch (parseError) {
                            console.error('Error parsing stored user:', parseError);
                            localStorage.removeItem('user');
                            setUser(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Token check error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, []);

    const loginUser = async (email, password) => {
        try {
            const response = await login(email, password);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            toast.success('Đăng nhập thành công');
            return user;
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
            throw error;
        }
    };

    const registerUser = async (userData) => {
        try {
            const response = await register(userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            toast.success('Đăng ký thành công');
            return user;
        } catch (error) {
            console.error('Register error:', error);
            toast.error(error.response?.data?.message || 'Đăng ký thất bại');
            throw error;
        }
    };

    const logout = async () => {
        try {
            localStorage.clear();
            setUser(null);
            setLoading(false);
            navigate('/');
            toast.success('Đăng xuất thành công');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Có lỗi xảy ra khi đăng xuất');
        }
    };

    const handleUpdateProfile = async (data) => {
        try {
            const updatedUser = await updateProfile(data);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Cập nhật thông tin thành công');
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Cập nhật thông tin thất bại');
            throw error;
        }
    };

    const authValue = useMemo(
        () => ({
            user,
            loading,
            token: localStorage.getItem('token'),
            loginUser,
            registerUser,
            logout,
            updateProfile: handleUpdateProfile,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);