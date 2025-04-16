const Input = ({ type = 'text', name, value, onChange, placeholder, className = '', error }) => {
    return (
        <div className="mb-4">
            <input
                type={type}
                name={name} // Đảm bảo name được truyền vào
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-red-500' : ''} ${className}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default Input;