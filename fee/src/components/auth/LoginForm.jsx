import { useState, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ReCAPTCHA from 'react-google-recaptcha';

const LoginForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const recaptchaRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRecaptchaChange = (value) => {
        console.log("reCAPTCHA value:", value);
        setRecaptchaValue(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!recaptchaValue) {
                setError('Vui lòng xác nhận reCAPTCHA');
                return;
            }
            console.log("Submitting form with data:", {
                email: formData.email,
                password: formData.password,
                recaptchaToken: recaptchaValue
            });
            await onSubmit(formData.email, formData.password, recaptchaValue);
            setError(null);
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || 'Đăng nhập thất bại.');
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            setRecaptchaValue(null);
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
                required
            />
            <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu"
                error={error?.includes('password') ? error : null}
                className="w-full"
                required
            />
            <div className="flex justify-center">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                    onChange={handleRecaptchaChange}
                />
            </div>
            {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button
                type="submit"
                className="w-full"
                disabled={!recaptchaValue || !formData.email || !formData.password}
            >
                Đăng nhập
            </Button>
        </form>
    );
};

export default LoginForm;