import { useState, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ReCAPTCHA from 'react-google-recaptcha';

const RegisterForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        birthday: '',
    });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMatchError, setPasswordMatchError] = useState(null);
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const recaptchaRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
            const password = e.target.name === 'password' ? e.target.value : formData.password;
            const confirmPassword = e.target.name === 'confirmPassword' ? e.target.value : formData.confirmPassword;
            if (password && confirmPassword && password !== confirmPassword) {
                setPasswordMatchError('Mật khẩu không khớp.');
            } else {
                setPasswordMatchError(null);
            }
        }
    };

    const handleRecaptchaChange = (value) => {
        console.log("reCAPTCHA value:", value);
        setRecaptchaValue(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setPasswordMatchError(null);

        if (formData.password !== formData.confirmPassword) {
            setPasswordMatchError('Mật khẩu không khớp.');
            return;
        }

        if (!recaptchaValue) {
            setError('Vui lòng xác nhận reCAPTCHA');
            return;
        }

        try {
            const registerData = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                birthday: formData.birthday,
                recaptchaToken: recaptchaValue
            };
            console.log('Submitting registration data:', registerData);
            await onSubmit(registerData);
            setError(null);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Đăng ký thất bại.');
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            setRecaptchaValue(null);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
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
            <div className="relative">
                <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    error={error?.includes('password') || passwordMatchError ? error || passwordMatchError : null}
                    className="w-full pr-10"
                    required
                />
                <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                    {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="relative">
                <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    error={passwordMatchError}
                    className="w-full pr-10"
                    required
                />
                <button
                    type="button"
                    onClick={toggleShowConfirmPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                    {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
            <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Họ và tên"
                error={error?.includes('name') ? error : null}
                className="w-full"
                required
            />
            <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                error={error?.includes('phone') ? error : null}
                className="w-full"
                required
            />
            <Input
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                placeholder="Ngày sinh (YYYY-MM-DD)"
                error={error?.includes('birthday') ? error : null}
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
                disabled={!!passwordMatchError || !recaptchaValue || !formData.email || !formData.password || !formData.name || !formData.phone || !formData.birthday}
            >
                Đăng ký
            </Button>
        </form>
    );
};

export default RegisterForm;