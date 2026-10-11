import { useCallback, useEffect, useState } from 'react'
import './App.css'
import AuthPage from './AuthPage'

const API = 'http://localhost:8080/api/complaints'

const EMPTY_FORM = {
  title: '',
  category: 'Electrical',
  location: '',
  description: '',
}

// Send the JWT token with authenticated requests.
async function authenticatedFetch(url, options = {}, token) {
  if (!token) {
    throw new Error('Your session is missing. Please log in again.')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Please log in again.')
  }

  return response
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const role = currentUser?.role
  const isStudent = role === 'STUDENT'
  const isMaintenance = role === 'MAINTENANCE'

  function showMessage(text, type = 'success') {
    setMessage(text)
    setMessageType(type)
  }

  const loadComplaints = useCallback(
    async (showLoading = true) => {
      if (!currentUser?.token) return

      if (showLoading) setLoading(true)

      try {
        const response = await authenticatedFetch(
          API,
          {},
          currentUser.token,
        )

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            data?.message || 'Unable to load complaints. Please try again.',
          )
        }

        setComplaints(Array.isArray(data) ? data : [])
      } catch (error) {
        showMessage(
          error.message ||
            'Unable to connect to the server. Please ensure the backend is running.',
          'error',
        )
      } finally {
        setLoading(false)
      }
    },
    [currentUser],
  )

  useEffect(() => {
    if (currentUser?.token) {
      loadComplaints()
    }
  }, [currentUser, loadComplaints])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function submitComplaint(event) {
    event.preventDefault()

    if (!currentUser?.token) {
      showMessage('Please log in again to continue.', 'error')
      return
    }

    if (!isStudent) {
      showMessage('Only students can submit complaints.', 'error')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await authenticatedFetch(
        API,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            status: 'Pending',
          }),
        },
        currentUser.token,
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to submit the complaint. Please try again.',
        )
      }

      setForm({ ...EMPTY_FORM })
      showMessage('Complaint submitted successfully.')
      await loadComplaints(false)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(complaint, status) {
    if (!isMaintenance) {
      showMessage(
        'Only maintenance staff can update complaint status.',
        'error',
      )
      return
    }

    if (!currentUser?.token) {
      showMessage('Please log in again to continue.', 'error')
      return
    }

    setUpdatingId(complaint.id)
    setMessage('')

    try {
      const response = await authenticatedFetch(
        `${API}/${complaint.id}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
        currentUser.token,
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to update the complaint status.',
        )
      }

      showMessage('Complaint status updated successfully.')
      await loadComplaints(false)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteComplaint(id) {
    if (!isStudent || !currentUser?.token) {
      showMessage(
        'Only students can delete their complaints.',
        'error',
      )
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this complaint? This action cannot be undone.',
    )

    if (!confirmed) return

    setDeletingId(id)
    setMessage('')

    try {
      const response = await authenticatedFetch(
        `${API}/${id}`,
        { method: 'DELETE' },
        currentUser.token,
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)

        throw new Error(
          data?.message || 'Failed to delete the complaint.',
        )
      }

      showMessage('Complaint deleted successfully.')
      await loadComplaints(false)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function handleLogout() {
    setCurrentUser(null)
    setComplaints([])
    setMessage('')
    setMessageType('success')
    setForm({ ...EMPTY_FORM })
    setUpdatingId(null)
    setDeletingId(null)
  }

  if (!currentUser) {
    return <AuthPage onLogin={setCurrentUser} />
  }

  const pendingCount = complaints.filter(
    (complaint) => (complaint.status || 'Pending') === 'Pending',
  ).length

  const resolvedCount = complaints.filter(
    (complaint) => complaint.status === 'Resolved',
  ).length

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          CC
        </div>

        <div className="brand-text">
          <h2>CampusCare</h2>
          <p>Campus Complaint Management System</p>
        </div>

        <div className="header-actions">
          <span className="header-tag">
            {isStudent ? 'STUDENT PORTAL' : 'MAINTENANCE PORTAL'}
          </span>

          <button
            className="refresh-btn"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <span className="eyebrow">A BETTER CAMPUS STARTS HERE</span>

          <h1>
            Your campus. <span>Your voice.</span>
          </h1>

          <p>
            Welcome, {currentUser.email}. Manage campus issues in one place.
          </p>

          <div className="stats">
            <div>
              <strong>{complaints.length}</strong>
              <span>Total complaints</span>
            </div>

            <div>
              <strong>{pendingCount}</strong>
              <span>Pending</span>
            </div>

            <div>
              <strong>{resolvedCount}</strong>
              <span>Resolved</span>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`message ${
              messageType === 'error' ? 'message-error' : ''
            }`}
            role={messageType === 'error' ? 'alert' : 'status'}
          >
            {message}
          </div>
        )}

        <div className="content-grid">
          {isStudent && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">SUBMIT A REQUEST</span>
                  <h2>Raise a complaint</h2>
                </div>

                <span className="heading-icon" aria-hidden="true">
                  ＋
                </span>
              </div>

              <p className="muted">
                Provide the details below so the campus team can address
                the issue.
              </p>

              <form onSubmit={submitComplaint}>
                <label htmlFor="title">Complaint title</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Classroom fan not working"
                  maxLength={150}
                  required
                />

                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option>Electrical</option>
                  <option>Water Supply</option>
                  <option>Cleanliness</option>
                  <option>Classroom</option>
                  <option>Hostel</option>
                  <option>Internet</option>
                  <option>Other</option>
                </select>

                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Block A, Room 204"
                  maxLength={150}
                  required
                />

                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  maxLength={1000}
                  required
                />

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit complaint'}
                </button>
              </form>
            </section>
          )}

          <section className="panel complaints-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">CAMPUS ISSUES</span>
                <h2>
                  {isStudent ? 'Recent complaints' : 'Manage complaints'}
                </h2>
              </div>

              <button
                className="refresh-btn"
                onClick={() => loadComplaints()}
                type="button"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <p className="muted">
              {isStudent
                ? 'Review complaints and track their current status.'
                : 'Review reported issues and update their status.'}
            </p>

            {loading ? (
              <p className="empty" role="status">
                Loading complaints...
              </p>
            ) : complaints.length === 0 ? (
              <div className="empty">
                <h3>No complaints yet</h3>
                <p>New complaints will appear here.</p>
              </div>
            ) : (
              <div className="complaint-list">
                {complaints.map((complaint) => {
                  const status = complaint.status || 'Pending'
                  const statusClass = status
                    .toLowerCase()
                    .replace(/\s+/g, '-')

                  const isUpdating = updatingId === complaint.id
                  const isDeleting = deletingId === complaint.id

                  return (
                    <article
                      className="complaint-card"
                      key={complaint.id}
                    >
                      <div className="complaint-top">
                        <span className="category-pill">
                          {complaint.category}
                        </span>

                        <span className={`status ${statusClass}`}>
                          {status}
                        </span>
                      </div>

                      <h3>{complaint.title}</h3>

                      <p className="complaint-description">
                        {complaint.description}
                      </p>

                      <p className="location-line">
                        Location: {complaint.location}
                      </p>

                      <div className="card-actions">
                        {isMaintenance && (
                          <>
                            <label
                              className="status-label"
                              htmlFor={`status-${complaint.id}`}
                            >
                              Update status
                            </label>

                            <select
                              id={`status-${complaint.id}`}
                              value={status}
                              disabled={isUpdating || isDeleting}
                              onChange={(event) =>
                                updateStatus(
                                  complaint,
                                  event.target.value,
                                )
                              }
                            >
                              <option>Pending</option>
                              <option>In Progress</option>
                              <option>Resolved</option>
                            </select>
                          </>
                        )}

                        {isStudent && (
                          <button
                            className="delete-btn"
                            onClick={() => deleteComplaint(complaint.id)}
                            type="button"
                            disabled={isDeleting || isUpdating}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <footer>
          CampusCare · Making campus life better, one request at a time.
        </footer>
      </main>
    </div>
  )
}

export default App
