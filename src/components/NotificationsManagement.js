import React, { useState, useEffect } from 'react';
import { FaBell, FaCalendarAlt, FaClock, FaEdit, FaTrash } from 'react-icons/fa';
import API_URL from '../utils/api';

const NotificationsManagement = ({ showToast }) => {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', startDate: '', endDate: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const resetForm = () => {
    setForm({ title: '', message: '', startDate: '', endDate: '', status: 'active' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.startDate || !form.endDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/api/notifications/${editingId}` : `${API_URL}/api/notifications`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Request failed');
      await fetchNotifications();
      resetForm();
      showToast(`Notification ${editingId ? 'updated' : 'created'} successfully`, 'success');
    } catch (error) {
      console.error('Error saving notification:', error);
      showToast('Failed to save notification', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (notification) => {
    setEditingId(notification._id);
    setForm({
      title: notification.title,
      message: notification.message,
      startDate: notification.startDate ? notification.startDate.slice(0, 16) : '',
      endDate: notification.endDate ? notification.endDate.slice(0, 16) : '',
      status: notification.status || 'active'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchNotifications();
      showToast('Notification deleted', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleToggleStatus = async (notification) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${notification._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: notification.status === 'active' ? 'draft' : 'active' })
      });
      if (!res.ok) throw new Error('Toggle failed');
      await fetchNotifications();
      showToast('Notification status updated', 'success');
    } catch (error) {
      console.error('Error toggling notification status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-gray-800">
          <FaBell className="text-primary text-2xl" />
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-gray-500">Broadcast announcements to users with schedule controls.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Notification title"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Message</span>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="Notification body text for users"
            required
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Start Date</span>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">End Date</span>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              required
            />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" className="bg-primary text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition">
            {editingId ? 'Update Notification' : 'Create Notification'}
          </button>
          <button type="button" onClick={resetForm} className="border border-gray-300 text-gray-700 px-5 py-3 rounded-lg hover:bg-gray-100 transition">
            Reset Form
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time window</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reads</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">Loading notifications...</td></tr>
            ) : notifications.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No notifications yet.</td></tr>
            ) : notifications.map((notification) => (
              <tr key={notification._id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-800">{notification.title}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt />
                    <span>{new Date(notification.startDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FaClock />
                    <span>{new Date(notification.endDate).toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${notification.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{notification.status}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{notification.readCount || 0}</td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                  <button onClick={() => handleEdit(notification)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleToggleStatus(notification)} className="text-indigo-600 hover:text-indigo-800">Toggle</button>
                  <button onClick={() => handleDelete(notification._id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationsManagement;
