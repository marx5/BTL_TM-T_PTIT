import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const LoginForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(formData.email, formData.password);
            setError(null);
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                error={error?.includes('email') ? error : null}
                className="w-full"
            />
            <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
                error={error?.includes('password') ? error : null}
                className="w-full"
            />
            {error && !error.includes('email') && !error.includes('password') && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
            <Button type="submit" className="w-full">
                Đăng nhập
            </Button>
        </form>
    );
};

export default LoginForm;