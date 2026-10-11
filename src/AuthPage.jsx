import { useState } from 'react'
import './AuthPage.css'

const API = 'http://localhost:8080/api/auth'

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  function switchMode(loginMode) {
    setIsLogin(loginMode)
    setMessage('')
    setError(false)
    setForm((previousForm) => ({
      ...previousForm,
      password: '',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError(false)

    try {
      const response = await fetch(
        `${API}/${isLogin ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            isLogin
              ? {
                  email: form.email.trim(),
                  password: form.password,
                }
              : {
                  email: form.email.trim(),
                  password: form.password,
                  role: form.role,
                },
          ),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Request failed. Please try again.',
        )
      }

      if (isLogin) {
        if (!data.token || !data.id || !data.role) {
          throw new Error(
            'Login response is missing required authentication details.',
          )
        }

        setMessage('Login successful.')

        // Pass the JWT token and user details to App.jsx.
        onLogin(data)
      } else {
        setMessage(
          data.message || 'Registration successful. You can now log in.',
        )

        setIsLogin(true)

        setForm((previousForm) => ({
          ...previousForm,
          password: '',
          role: 'STUDENT',
        }))
      }
    } catch (err) {
      setError(true)
      setMessage(
        err.message ||
          'Unable to connect to the server. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">CC</div>

        <h1>CampusCare</h1>

        <p className="auth-subtitle">
          Campus Complaint Management System
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => switchMode(true)}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => switchMode(false)}
          >
            Register
          </button>
        </div>

        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>

        <p className="auth-description">
          {isLogin
            ? 'Sign in to access your campus portal.'
            : 'Enter your details to get started.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete={
              isLogin ? 'current-password' : 'new-password'
            }
            minLength={8}
            required
          />

          {!isLogin && (
            <>
              <label htmlFor="role">Account type</label>

              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="STUDENT">Student</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <p className="auth-note">
                Select the account type that applies to you.
              </p>
            </>
          )}

          {message && (
            <p
              role="status"
              className={
                error ? 'auth-message error' : 'auth-message'
              }
            >
              {message}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          CampusCare · A better campus starts here.
        </p>
      </section>
    </div>
  )
}

export default AuthPage
