import { useRef, useEffect } from 'react';

export default function OTPInput({ value = '', onChange, disabled = false }) {
  const inputRefs = useRef([]);
  const otpArray = value.split('').concat(Array(6 - value.length).fill(''));

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    
    const newOtp = [...otpArray];
    newOtp[index] = val.slice(-1);
    const newValue = newOtp.join('').slice(0, 6);
    onChange(newValue);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pastedData);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otpArray[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: '48px',
            height: '56px',
            fontSize: '24px',
            fontWeight: '600',
            textAlign: 'center',
            border: '2px solid #E9EDEF',
            borderRadius: '8px',
            outline: 'none',
            transition: 'all 0.2s',
            backgroundColor: disabled ? '#F5F5F5' : '#FFF',
            color: '#111B21',
            fontFamily: 'monospace',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#008069';
            e.target.style.boxShadow = '0 0 0 3px rgba(0, 128, 105, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E9EDEF';
            e.target.style.boxShadow = 'none';
          }}
        />
      ))}
    </div>
  );
}
