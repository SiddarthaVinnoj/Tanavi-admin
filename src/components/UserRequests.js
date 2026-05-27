import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaEye, FaTrash, FaTimes, FaInbox,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaMoneyBillWave,
  FaHome, FaCalendarAlt, FaUser, FaFilter, FaFileExcel,
  FaHandshake, FaCommentDots,
} from 'react-icons/fa';
import API_URL from '../utils/api';

// ── constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  New:           { pill: 'bg-blue-100 text-blue-800 border border-blue-200',   dot: 'bg-blue-500' },
  Contacted:     { pill: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' },
  'In Progress': { pill: 'bg-purple-100 text-purple-800 border border-purple-200', dot: 'bg-purple-500' },
  Closed:        { pill: 'bg-emerald-100 text-emerald-800 border border-emerald-200', dot: 'bg-emerald-500' },
};
const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Closed'];
const LIMIT = 20;

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ', ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── StatusPill ───────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || { pill: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {status || '—'}
    </span>
  );
};

// ── DetailRow (used inside modal) ────────────────────────────────────────────
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <span className="mt-0.5 flex-shrink-0 w-5 text-center">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <div className="text-gray-800 font-medium text-sm break-words">{value || <span className="text-gray-400 italic font-normal">—</span>}</div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const UserRequests = ({ showToast, setModal }) => {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [viewRequest, setViewRequest]   = useState(null);
  const [updatingId, setUpdatingId]     = useState(null);
  const [exporting, setExporting]       = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (currentPage = 1, status = '', query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: currentPage, limit: LIMIT });
      if (status) params.append('status', status);
      const res = await fetch(`${API_URL}/api/book-interest?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      let items = data.bookInterests || [];
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        items = items.filter(r =>
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.phone?.includes(q)
        );
      }
      setRequests(items);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || items.length);
    } catch (err) {
      console.error('Error fetching user requests:', err);
      showToast('Failed to load user requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests(page, statusFilter, search);
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests(1, statusFilter, search);
  };

  // ── export ─────────────────────────────────────────────────────────────────
  const handleExport = async (format = 'xlsx') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ format });
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      const res = await fetch(`${API_URL}/api/book-interest/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Export failed. Please try again.', 'error');
        return;
      }
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `user_requests_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Report downloaded as .${format.toUpperCase()}`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Export failed. Check your connection.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ── status update ──────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/book-interest/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      if (viewRequest?._id === id) setViewRequest(prev => ({ ...prev, status: newStatus }));
      showToast('Status updated', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setModal({
      isOpen: true, type: 'warning',
      title: 'Delete Request',
      message: 'Are you sure you want to delete this request? This cannot be undone.',
      showCancel: true,
      onConfirm: async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/book-interest/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Delete failed');
          setRequests(prev => prev.filter(r => r._id !== id));
          setTotal(prev => Math.max(0, prev - 1));
          if (viewRequest?._id === id) setViewRequest(null);
          showToast('Request deleted', 'success');
        } catch {
          showToast('Failed to delete request', 'error');
        }
      },
    });
  };

  // ── Detail Modal ───────────────────────────────────────────────────────────
  const DetailModal = () => {
    if (!viewRequest) return null;
    const r = viewRequest;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <FaHandshake className="text-blue-600" size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Request Details</h3>
                <p className="text-xs text-gray-400">Submitted {fmtDateShort(r.createdAt)}</p>
              </div>
            </div>
            <button onClick={() => setViewRequest(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <FaTimes size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-1">
            {/* Status row */}
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <StatusPill status={r.status} />
              </div>
              <select
                value={r.status}
                disabled={updatingId === r._id}
                onChange={e => handleStatusChange(r._id, e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <DetailRow icon={<FaUser className="text-blue-500" size={13} />}          label="Full Name"     value={r.name} />
            <DetailRow icon={<FaPhone className="text-green-500" size={13} />}         label="Phone"         value={<a href={`tel:${r.phone}`} className="text-blue-600 hover:underline font-semibold">{r.phone}</a>} />
            <DetailRow icon={<FaEnvelope className="text-rose-400" size={13} />}       label="Email"         value={<a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">{r.email}</a>} />
            <DetailRow icon={<FaHome className="text-violet-500" size={13} />}         label="Property Type" value={r.propertyType} />
            <DetailRow icon={<FaMapMarkerAlt className="text-orange-500" size={13} />} label="Location"      value={r.lookingLocation} />
            <DetailRow icon={<FaMoneyBillWave className="text-emerald-500" size={13}/>}label="Budget"        value={r.budget} />
            <DetailRow icon={<FaUser className="text-indigo-400" size={13} />}         label="Buyer Type"    value={r.buyerType} />
            <DetailRow icon={<FaCalendarAlt className="text-gray-400" size={13} />}    label="Submitted On"  value={fmtDate(r.createdAt)} />

            {/* Message block — always visible */}
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 border-b border-amber-200">
                <FaCommentDots className="text-amber-600" size={13} />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Requirement / Message</span>
              </div>
              <div className="px-4 py-3">
                {r.message ? (
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">{r.message}</p>
                ) : (
                  <p className="text-gray-400 text-sm italic">No message provided by the customer.</p>
                )}
              </div>
            </div>
          </div>

          {/* Modal footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={() => handleDelete(r._id)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-100 transition font-semibold text-sm">
              <FaTrash size={12} /> Delete
            </button>
            <button onClick={() => setViewRequest(null)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition font-semibold text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <DetailModal />

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaHandshake className="text-blue-600" size={22} /> User Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading…' : `${total} submission${total !== 1 ? 's' : ''} from the "Book Your Interest" form`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export — single-click Excel download */}
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting || loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition text-sm font-semibold shadow-sm"
          >
            {exporting ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Generating…</>
            ) : (
              <><FaFileExcel size={14} /> Download Excel Report</>
            )}
          </button>

          <button onClick={() => fetchRequests(page, statusFilter, search)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-semibold shadow-sm">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 flex-shrink-0" size={12} />
            <select value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[140px]">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
            Search
          </button>
          {(search || statusFilter) && (
            <button type="button"
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); fetchRequests(1, '', ''); }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-sm">
              <FaTimes size={11} /> Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading requests…</p>
        </div>

      /* ── Empty state ── */
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <FaInbox className="text-gray-200 mx-auto mb-4" size={60} />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No requests found</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            {search || statusFilter
              ? 'Try adjusting your search or clearing the filter.'
              : 'Submissions from the "Book Your Interest" form will appear here.'}
          </p>
        </div>

      /* ── Desktop table ── */
      ) : (
        <>
          {/* Table — hidden on mobile, shown md+ */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '960px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-xs uppercase tracking-wide">
                    <th className="px-4 py-3.5 text-center font-semibold w-10">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '180px' }}>Customer</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '120px' }}>Phone</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '130px' }}>Property Type</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '130px' }}>Location</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '110px' }}>Budget</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '220px' }}>Requirement</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '120px' }}>Submitted</th>
                    <th className="px-4 py-3.5 text-left font-semibold" style={{ minWidth: '130px' }}>Status</th>
                    <th className="px-4 py-3.5 text-center font-semibold" style={{ minWidth: '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req, idx) => (
                    <tr key={req._id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-4 py-4 text-center text-xs text-gray-400 font-medium">
                        {(page - 1) * LIMIT + idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{req.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{req.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <a href={`tel:${req.phone}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline">
                          {req.phone}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{req.propertyType || '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{req.lookingLocation || '—'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800">{req.budget || '—'}</td>

                      {/* Requirement cell */}
                      <td className="px-4 py-4" style={{ maxWidth: '220px' }}>
                        {req.message ? (
                          <div>
                            <p className="text-sm text-gray-700 leading-relaxed"
                              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {req.message}
                            </p>
                            {req.message.length > 90 && (
                              <button onClick={() => setViewRequest(req)}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1">
                                <FaEye size={10} /> Read More
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No message</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDateShort(req.createdAt)}
                      </td>

                      {/* Status dropdown */}
                      <td className="px-4 py-4">
                        <select value={req.status}
                          disabled={updatingId === req._id}
                          onChange={e => handleStatusChange(req._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-[120px] ${
                            req.status === 'New'           ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            req.status === 'Contacted'     ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            req.status === 'In Progress'   ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            req.status === 'Closed'        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setViewRequest(req)} title="View Details"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100 transition">
                            <FaEye size={14} />
                          </button>
                          <button onClick={() => handleDelete(req._id)} title="Delete"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-100 transition">
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards — shown below md ── */}
          <div className="md:hidden space-y-3">
            {requests.map((req, idx) => (
              <div key={req._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{req.name}</p>
                    <p className="text-xs text-gray-400 truncate">{req.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-400">#{(page - 1) * LIMIT + idx + 1}</span>
                    <StatusPill status={req.status} />
                  </div>
                </div>

                {/* Card details grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 font-medium mb-0.5">Phone</p>
                    <a href={`tel:${req.phone}`} className="text-blue-600 font-semibold">{req.phone}</a>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 font-medium mb-0.5">Budget</p>
                    <p className="text-gray-800 font-semibold">{req.budget || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 font-medium mb-0.5">Property</p>
                    <p className="text-gray-800 font-semibold">{req.propertyType || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 font-medium mb-0.5">Location</p>
                    <p className="text-gray-800 font-semibold truncate">{req.lookingLocation || '—'}</p>
                  </div>
                </div>

                {/* Requirement message */}
                {req.message && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Requirement</p>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{req.message}</p>
                  </div>
                )}

                {/* Card footer */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400">{fmtDateShort(req.createdAt)}</p>
                  <div className="flex items-center gap-2">
                    <select value={req.status}
                      disabled={updatingId === req._id}
                      onChange={e => handleStatusChange(req._id, e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none bg-white">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setViewRequest(req)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100 transition">
                      <FaEye size={13} />
                    </button>
                    <button onClick={() => handleDelete(req._id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-100 transition">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
                <span className="ml-2 text-gray-400">({total} total)</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium">
                  ← Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserRequests;
