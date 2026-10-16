// ============================================================================
// NEBULA NODE — LOCK SCREEN (Section 8)
// Full authentication sequence: Word Key → Challenge → Passkey
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNebulaStore } from '../../store/nebulaStore';
import { AUTH_CONFIG } from '../../core/config';

export function LockScreen() {
  const {
    authStep, failedAttempts, lockoutUntil,
    setAuthStep, setAuthenticated, incrementFailedAttempts, setLockout,
  } = useNebulaStore();

  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [challengeCode, setChallengeCode] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // UTC clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [authStep]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockout(null);
        setError('');
      }
    }, 100);
    return () => clearInterval(timer);
  }, [lockoutUntil, setLockout]);

  const generateChallenge = (): string => {
    // Simulated HMAC-based challenge (Section 8.1 Step 2)
    const chars = '0123456789ABCDEF';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleWordKey = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    const normalized = input.trim().toLowerCase();
    if (normalized === AUTH_CONFIG.DEFAULT_WORD_KEY) {
      setError('');
      setInput('');
      const code = generateChallenge();
      setChallengeCode(code);
      setAuthStep('CHALLENGE');
    } else {
      incrementFailedAttempts();
      const attempts = failedAttempts + 1;

      if (attempts >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS) {
        const lockoutDuration = AUTH_CONFIG.BASE_LOCKOUT_SECONDS * Math.pow(2, Math.floor(attempts / AUTH_CONFIG.MAX_FAILED_ATTEMPTS) - 1);
        setLockout(Date.now() + lockoutDuration * 1000);
        setError('');
      } else if (attempts === AUTH_CONFIG.MAX_FAILED_ATTEMPTS - 1) {
        setError('INVALID KEY — 1 ATTEMPT REMAINING');
      } else {
        setError('INVALID KEY — TRY AGAIN');
      }
      setInput('');
    }
  };

  const handleChallenge = () => {
    setAuthStep('PASSKEY');
    setInput('');
  };

  const handlePasskey = () => {
    if (input === AUTH_CONFIG.DEFAULT_PASSKEY) {
      setAuthenticated(true);
    } else {
      setError('INVALID PASSKEY');
      incrementFailedAttempts();
      setInput('');
      setAuthStep('WORD_KEY');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (authStep === 'WORD_KEY') handleWordKey();
      else if (authStep === 'PASSKEY') handlePasskey();
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-screen__title">NEBULA NODE</div>
      <div className="lock-screen__divider" />
      <div className="lock-screen__subtitle">
        TERMINUS STELLAE RUINAE — NODE 01
      </div>

      {lockoutUntil && Date.now() < lockoutUntil ? (
        <div className="lock-screen__lockout">
          AUTHENTICATION SUSPENDED — {lockoutRemaining}s
        </div>
      ) : authStep === 'WORD_KEY' ? (
        <>
          <div className="lock-screen__prompt">OPERATOR AUTHENTICATION</div>
          <div className="lock-screen__prompt">ENTER WORD KEY:</div>
          <div className="lock-screen__input-wrap">
            <input
              ref={inputRef}
              className="lock-screen__input"
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="• • • • • •"
              autoComplete="off"
            />
          </div>
          <div className="lock-screen__error">{error}</div>
        </>
      ) : authStep === 'CHALLENGE' ? (
        <div className="lock-screen__challenge">
          <div className="lock-screen__prompt">SYSTEM CHALLENGE:</div>
          <div className="lock-screen__challenge-code">{challengeCode}</div>
          <div className="lock-screen__prompt">ACKNOWLEDGE CHALLENGE TO CONTINUE</div>
          <button className="lock-screen__btn" onClick={handleChallenge}>
            ACKNOWLEDGE
          </button>
        </div>
      ) : authStep === 'PASSKEY' ? (
        <>
          <div className="lock-screen__prompt">ENTER PASSKEY:</div>
          <div className="lock-screen__input-wrap">
            <input
              ref={inputRef}
              className="lock-screen__input"
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="• • • • • •"
              autoComplete="off"
            />
          </div>
          <div className="lock-screen__error">{error}</div>
        </>
      ) : null}

      <div className="lock-screen__footer">
        <span>v1.0.0-alpha</span>
        <span>UTC {utcTime}</span>
      </div>
    </div>
  );
}
