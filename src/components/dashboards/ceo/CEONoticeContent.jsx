import React, { useState, useEffect, useRef } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, Search, Download, List, ArrowUpRight, ArrowDownLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import apiClient from '../../../services/api';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';

const CEONoticeContent = () => {
  const [sentNotices, setSentNotices] = useState([]);
  const [receivedNotices, setReceivedNotices] = useState([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [errorSent, setErrorSent] = useState(null);
  const [errorReceived, setErrorReceived] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState('sent');
  const [actionMenu, setActionMenu] = useState({ isOpen: false, top: 0, left: 0, notice: null });
  const actionMenuRef = useRef(null);
  const [viewNoticeModal, setViewNoticeModal] = useState({ isOpen: false, notice: null });
  const [repliesModal, setRepliesModal] = useState({ isOpen: false, notice: null });
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Pagination state
  const pageSize = 1000; // Number of items per page
  const [sentPage, setSentPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentTotal, setSentTotal] = useState(0);
  const [receivedTotal, setReceivedTotal] = useState(0);

  // Fetch sent notices
  useEffect(() => {
    const fetchSentNotices = async () => {
      try {
        setLoadingSent(true);
        const skip = (sentPage - 1) * pageSize;
        // Fetch with proper pagination
        const response = await apiClient.get(`/notices/sent?skip=${skip}&limit=${pageSize}`);
        console.log('✅ Sent Notices API Response:', response.data);
        
        // Handle both array response and paginated response
        if (Array.isArray(response.data)) {
          setSentNotices(response.data);
          setSentTotal(response.data.length);
        } else if (response.data.items && Array.isArray(response.data.items)) {
          setSentNotices(response.data.items);
          setSentTotal(response.data.total || response.data.items.length);
        } else {
          setSentNotices(response.data || []);
          setSentTotal(response.data?.length || 0);
        }
        
        setErrorSent(null);
      } catch (error) {
        console.error('❌ Error fetching sent notices:', error);
        setErrorSent(error.message || 'Failed to fetch sent notices');
        setSentNotices([]);
        setSentTotal(0);
      } finally {
        setLoadingSent(false);
      }
    };

    fetchSentNotices();
  }, [sentPage]);

  // Fetch received notices
  useEffect(() => {
    const fetchReceivedNotices = async () => {
      try {
        setLoadingReceived(true);
        const skip = (receivedPage - 1) * pageSize;
        // Fetch with proper pagination
        const response = await apiClient.get(`/notices/received?skip=${skip}&limit=${pageSize}`);
        console.log('✅ Received Notices API Response:', response.data);
        
        // Handle both array response and paginated response
        if (Array.isArray(response.data)) {
          setReceivedNotices(response.data);
          setReceivedTotal(response.data.length);
        } else if (response.data.items && Array.isArray(response.data.items)) {
          setReceivedNotices(response.data.items);
          setReceivedTotal(response.data.total || response.data.items.length);
        } else {
          setReceivedNotices(response.data || []);
          setReceivedTotal(response.data?.length || 0);
        }
        
        setErrorReceived(null);
      } catch (error) {
        console.error('❌ Error fetching received notices:', error);
        setErrorReceived(error.message || 'Failed to fetch received notices');
        setReceivedNotices([]);
        setReceivedTotal(0);
      } finally {
        setLoadingReceived(false);
      }
    };

    fetchReceivedNotices();
  }, [receivedPage]);

  const noticesSource = viewMode === 'sent' ? sentNotices : receivedNotices;

  const getAssignedLabel = () => (viewMode === 'received' ? 'Assigned From' : 'Assigned To');

  const mapNoticeForTable = (notice) => {
    const sender = notice.sender || notice.sender_info;
    const receiver = notice.receiver || notice.recipient_info;
    const replies = Array.isArray(notice.replies) ? notice.replies : [];
    const latestReply = [...replies]
      .filter(Boolean)
      .sort((a, b) => {
        const getTimestamp = (reply) => new Date(
          reply?.reply_datetime ||
          reply?.replyDatetime ||
          reply?.created_at ||
          reply?.createdAt ||
          0
        ).getTime();

        return getTimestamp(b) - getTimestamp(a);
      })[0] || null;

    const replyDate = latestReply?.reply_datetime || latestReply?.replyDatetime || latestReply?.created_at || latestReply?.createdAt || null;
    const hasReplies = replies.length > 0;

    const statusText = viewMode === 'received' 
      ? (hasReplies ? 'Reply Submitted' : 'Reply not submitted')
      : (hasReplies ? 'Reply received' : 'Reply not received');
    const statusColor = hasReplies ? '#047857' : '#dc2626';

    return {
      id: notice.id,
      noticeId: notice.id ?? 'N/A',
      date: notice.date || notice.created_at || notice.createdAt || null,
      category: notice.type?.name || notice.category || notice.notice_type?.name || 'N/A',
      subject: notice.title || notice.subject || 'N/A',
      text: notice.text || '',
      sender,
      receiver,
      status: statusText,
      statusColor,
      statusDate: hasReplies ? replyDate : null,
      replies,
      raw: notice,
    };
  };

  // Filter notices based on search term
  const preparedNotices = noticesSource.map(mapNoticeForTable);

  const filteredNotices = preparedNotices.filter(notice => {
    const haystacks = [
      notice.subject,
      notice.text,
      notice.sender?.first_name,
      notice.sender?.last_name,
      notice.receiver?.first_name,
      notice.receiver?.last_name,
      notice.category,
      notice.status,
    ];

    const term = searchTerm.toLowerCase();
    return haystacks.filter(Boolean).some(value => value.toLowerCase().includes(term));
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      return 'N/A';
    }
  };

  // Get sender name
  const getSenderName = (senderInfo) => {
    if (!senderInfo) return 'Unknown';
    const parts = [
      senderInfo.first_name,
      senderInfo.middle_name,
      senderInfo.last_name
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  };

  const closeActionMenu = () => {
    setActionMenu({ isOpen: false, top: 0, left: 0, notice: null });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!actionMenu.isOpen) return;
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        closeActionMenu();
      }
    };

    if (actionMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenu.isOpen]);

  const handleActionButtonClick = (event, notice) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX + rect.width / 2 - menuWidth / 2;

    setActionMenu({ isOpen: true, top, left, notice });
  };

  const openViewNotice = (notice) => {
    setViewNoticeModal({ isOpen: true, notice });
    closeActionMenu();
  };

  const openRepliesModal = (notice) => {
    setRepliesModal({ isOpen: true, notice });
    closeActionMenu();
  };

  const closeViewNoticeModal = () => {
    setViewNoticeModal({ isOpen: false, notice: null });
    setReplyText('');
  };
  const closeRepliesModal = () => setRepliesModal({ isOpen: false, notice: null });

  // Handle reply submission
  const handleReplySubmit = async (notice) => {
    if (!replyText.trim()) {
      alert('Please enter a reply message');
      return;
    }

    try {
      setSubmittingReply(true);
      const response = await apiClient.post(`/notices/${notice.id}/reply`, {
        reply_text: replyText.trim()
      });
      
      console.log('✅ Reply submitted successfully:', response.data);
      
      // Update the notice in the list
      if (viewMode === 'received') {
        setReceivedNotices(prevNotices => 
          prevNotices.map(n => {
            if (n.id === notice.id) {
              const updatedReplies = [...(n.replies || []), response.data];
              return {
                ...n,
                replies: updatedReplies
              };
            }
            return n;
          })
        );
      }
      
      // Update the modal notice
      setViewNoticeModal(prev => ({
        ...prev,
        notice: {
          ...prev.notice,
          replies: [...(prev.notice.replies || []), response.data]
        }
      }));
      
      setReplyText('');
      alert('Reply submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting reply:', error);
      alert(error.response?.data?.detail || error.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getToggleButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: isActive ? '#10b981' : 'transparent',
    color: isActive ? '#ffffff' : '#374151',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.15s, color 0.15s',
    borderRadius: '9px'
  });

  return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            {/* Header Section */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '5px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Left side - Dashboard title */}
                <div>
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#374151',
                        margin: 0
                    }}>
                        Notices
                    </h1>
                </div>
                {/* <div style={{ position: 'relative' }}>
                <Calendar style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        color: '#6b7280',
                        pointerEvents: 'none'
                    }} />
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{
                            padding: '8px 40px 8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            appearance: 'none'
                        }}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                  
                </div> */}
            </div>

            {/* Summary Cards Section */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginLeft: '16px',
                marginRight: '16px',
                marginTop: '16px'
            }}>
                {/* Notices Sent Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    flex: 1,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px'
                    }}>
                        <InfoTooltip size={16} color="#6b7280" />
                    </div>
                    <h3 style={{
                                fontSize: '14px',
                                fontWeight: '500',
                        color: '#374151',
                        margin: '0 0 8px 0'
                    }}>
                        Total Notices Sent
                                </h3>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        {loadingSent ? '...' : errorSent ? '0' : sentTotal.toLocaleString()}
                        </div>
                    </div>

                {/* Notices Received Card */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                    padding: '24px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    flex: 1,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px'
                    }}>
                        <InfoTooltip size={16} color="#6b7280" />
                    </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                        gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            margin: 0
                        }}>
                            Total Notices Received
                                </h3>
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        {loadingReceived ? '...' : errorReceived ? '0' : receivedTotal.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Notices Table Section */}
        <div
          data-dashboard-section="notices"
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            marginLeft: '16px',
            marginRight: '16px',
            marginTop: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
                {/* Table Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#111827',
                                margin: 0
                            }}>
                                Notices
                            </h2>
                         
                        </div>
                      
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {/* Toggle between Sent and Received */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '9px',
                            display: 'flex',
                            border: '1px solid #d1d5db',
                            padding: '2px',
                            gap: '4px'
                        }}>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setViewMode('sent');
                                    setSentPage(1); // Reset to first page
                                }}
                                style={getToggleButtonStyle(viewMode === 'sent')}
                            >
                                <ArrowUpRight style={{ width: '18px', height: '18px', color: viewMode === 'sent' ? '#ffffff' : '#6b7280' }} />
                                Sent
                            </button>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setViewMode('received');
                                    setReceivedPage(1); // Reset to first page
                                }}
                                style={getToggleButtonStyle(viewMode === 'received' || typeof viewMode === 'undefined')}
                            >
                                <ArrowDownLeft style={{ width: '18px', height: '18px', color: (viewMode === 'received' || typeof viewMode === 'undefined') ? '#ffffff' : '#6b7280' }} />
                                Received
                            </button>
                        </div>

                        {/* Export Button */}
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                                            borderRadius: '8px',
                            padding: '10px 16px',
                            cursor: 'pointer',
                                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            <Download style={{ width: '16px', height: '16px' }} />
                       
                        </button>

                                    </div>
                                </div>

                {/* Table */}
                <div style={{ maxHeight: '1300px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: '#f9fafb',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Notice ID
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                    </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Date
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {getAssignedLabel()}
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Category
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                    </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Subject
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Status
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                                <th style={{
                                    padding: '12px 24px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Action
                                        <ChevronDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                        </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(viewMode === 'received' ? loadingReceived : loadingSent) ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        Loading notices...
                                    </td>
                                </tr>
                            ) : ((viewMode === 'received' ? errorReceived : errorSent) || filteredNotices.length === 0) ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 0 }}>
                                        <NoDataFound size="small" />
                                    </td>
                                </tr>
                            ) : (
                                filteredNotices.map((notice) => (
                                    <tr key={notice.id} style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        backgroundColor: 'white'
                                    }}>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {notice.noticeId || 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>
                                                  {notice.date ? formatDate(notice.date) : 'N/A'}
                                                </div>
                                               
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                  {viewMode === 'received'
                                                    ? getSenderName(notice.sender)
                                                    : getSenderName(notice.receiver)}
                                                </div>
                                               
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {notice.category || 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                            {notice.subject || 'N/A'}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151'
                                        }}>
                                          <div style={{ fontWeight: '600', color: notice.statusColor || '#374151' }}>
                                            {notice.status || 'Pending'}
                                          </div>
                                          {notice.statusDate && (
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                              {formatDate(notice.statusDate)}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{
                                            padding: '16px 24px',
                                            fontSize: '14px',
                                            color: '#374151',
                                            textAlign: 'center'
                                        }}>
                                          <button
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#111827',
                                              cursor: 'pointer',
                                              padding: 0,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '24px',
                                              height: '24px',
                                            }}
                                            aria-label="More actions"
                                            onClick={(event) => handleActionButtonClick(event, notice)}
                                          >
                                            <span style={{ fontSize: '18px', lineHeight: 1, transform: 'translateY(-1px)' }}>⋮</span>
                                          </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls - Sent */}
                {viewMode === 'sent' && sentTotal > pageSize && (() => {
                  const sentTotalPages = Math.ceil(sentTotal / pageSize);
                  const getPageNumbers = () => {
                    if (sentTotalPages <= 7) return Array.from({ length: sentTotalPages }, (_, i) => i + 1);
                    const set = new Set([1, sentTotalPages, sentPage, sentPage - 1, sentPage + 1]);
                    const nums = [...set].filter(p => p >= 1 && p <= sentTotalPages).sort((a, b) => a - b);
                    const result = [];
                    for (let i = 0; i < nums.length; i++) {
                      if (i > 0 && nums[i] - nums[i - 1] > 1) result.push('...');
                      result.push(nums[i]);
                    }
                    return result;
                  };
                  const btn = (on, dis) => ({ onClick: on, disabled: dis, style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: dis ? '#f9fafb' : 'white', color: dis ? '#9ca3af' : '#374151', cursor: dis ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' } });
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                      <button {...btn(() => setSentPage(1), sentPage <= 1 || loadingSent)} aria-label="First page"><ChevronsLeft size={16} /> First</button>
                      <button {...btn(() => setSentPage(prev => Math.max(1, prev - 1)), sentPage <= 1 || loadingSent)}>Previous</button>
                      {getPageNumbers().map((n, i) => typeof n === 'number' ? (
                        <button key={n} onClick={() => setSentPage(n)} disabled={loadingSent} style={{ minWidth: '36px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: sentPage === n ? '#3b82f6' : 'white', color: sentPage === n ? 'white' : '#374151', cursor: loadingSent ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: sentPage === n ? '600' : '500' }}>{n}</button>
                      ) : (<span key={`e-${i}`} style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>))}
                      <button {...btn(() => setSentPage(prev => prev + 1), sentPage >= sentTotalPages || loadingSent)}>Next</button>
                      <button {...btn(() => setSentPage(sentTotalPages), sentPage >= sentTotalPages || loadingSent)} aria-label="Last page">Last <ChevronsRight size={16} /></button>
                    </div>
                  );
                })()}

                {/* Pagination Controls - Received */}
                {viewMode === 'received' && receivedTotal > pageSize && (() => {
                  const recvTotalPages = Math.ceil(receivedTotal / pageSize);
                  const getPageNumbers = () => {
                    if (recvTotalPages <= 7) return Array.from({ length: recvTotalPages }, (_, i) => i + 1);
                    const set = new Set([1, recvTotalPages, receivedPage, receivedPage - 1, receivedPage + 1]);
                    const nums = [...set].filter(p => p >= 1 && p <= recvTotalPages).sort((a, b) => a - b);
                    const result = [];
                    for (let i = 0; i < nums.length; i++) {
                      if (i > 0 && nums[i] - nums[i - 1] > 1) result.push('...');
                      result.push(nums[i]);
                    }
                    return result;
                  };
                  const btn = (on, dis) => ({ onClick: on, disabled: dis, style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: dis ? '#f9fafb' : 'white', color: dis ? '#9ca3af' : '#374151', cursor: dis ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' } });
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                      <button {...btn(() => setReceivedPage(1), receivedPage <= 1 || loadingReceived)} aria-label="First page"><ChevronsLeft size={16} /> First</button>
                      <button {...btn(() => setReceivedPage(prev => Math.max(1, prev - 1)), receivedPage <= 1 || loadingReceived)}>Previous</button>
                      {getPageNumbers().map((n, i) => typeof n === 'number' ? (
                        <button key={n} onClick={() => setReceivedPage(n)} disabled={loadingReceived} style={{ minWidth: '36px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: receivedPage === n ? '#3b82f6' : 'white', color: receivedPage === n ? 'white' : '#374151', cursor: loadingReceived ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: receivedPage === n ? '600' : '500' }}>{n}</button>
                      ) : (<span key={`e-${i}`} style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>))}
                      <button {...btn(() => setReceivedPage(prev => prev + 1), receivedPage >= recvTotalPages || loadingReceived)}>Next</button>
                      <button {...btn(() => setReceivedPage(recvTotalPages), receivedPage >= recvTotalPages || loadingReceived)} aria-label="Last page">Last <ChevronsRight size={16} /></button>
                    </div>
                  );
                })()}
            </div>

            {actionMenu.isOpen && actionMenu.notice && (
              <div
                ref={actionMenuRef}
                style={{
                  position: 'absolute',
                  top: `${actionMenu.top}px`,
                  left: `${actionMenu.left}px`,
                  width: '150px',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  boxShadow: '0 24px 45px -20px rgba(15, 23, 42, 0.45)',
                  padding: '8px 6px',
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <button
                  onClick={() => openViewNotice(actionMenu.notice)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '14px',
                    transition: 'background-color 0.15s ease, color 0.15s ease'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  View Notice
                </button>
                <button
                  onClick={() => openRepliesModal(actionMenu.notice)}
                  disabled={!actionMenu.notice.replies || actionMenu.notice.replies.length === 0}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: actionMenu.notice.replies && actionMenu.notice.replies.length > 0 ? '#0f172a' : '#9ca3af',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: actionMenu.notice.replies && actionMenu.notice.replies.length > 0 ? 'pointer' : 'not-allowed',
                    padding: '8px',
                    borderRadius: '14px',
                    transition: 'background-color 0.15s ease, color 0.15s ease'
                  }}
                  onMouseEnter={(event) => {
                    if (!event.currentTarget.disabled) {
                      event.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  See Reply
                </button>
              </div>
            )}

            {viewNoticeModal.isOpen && viewNoticeModal.notice && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1200
                }}
                onClick={closeViewNoticeModal}
              >
                <div
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    width: '520px',
                    maxWidth: '90vw',
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '28px',
                    boxShadow: '0 30px 60px -20px rgba(30, 41, 59, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>Notice Details</h2>
                      <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>Read-only view of the selected notice</p>
                    </div>
                    <button
                      onClick={closeViewNoticeModal}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X style={{ width: '22px', height: '22px' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Category</span>
                      <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {viewNoticeModal.notice.category || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Subject</span>
                      <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        {viewNoticeModal.notice.subject || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Details</span>
                      <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        color: '#111827',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {viewNoticeModal.notice.text || 'No details provided.'}
                      </div>
                    </div>
                  </div>

                  {/* Reply Section - Only for received notices */}
                  {viewMode === 'received' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Reply to Notice</span>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Enter your reply..."
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid #d1d5db',
                          fontSize: '14px',
                          color: '#111827',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                        disabled={submittingReply}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={closeViewNoticeModal}
                          disabled={submittingReply}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: submittingReply ? 'not-allowed' : 'pointer',
                            opacity: submittingReply ? 0.6 : 1
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(viewNoticeModal.notice.raw || viewNoticeModal.notice)}
                          disabled={submittingReply || !replyText.trim()}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: submittingReply || !replyText.trim() ? '#9ca3af' : '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: submittingReply || !replyText.trim() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {submittingReply ? 'Submitting...' : 'Submit Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {viewMode !== 'received' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={closeViewNoticeModal}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '10px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#111827',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {repliesModal.isOpen && repliesModal.notice && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1200
                }}
                onClick={closeRepliesModal}
              >
                <div
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    width: '520px',
                    maxWidth: '90vw',
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '28px',
                    boxShadow: '0 30px 60px -20px rgba(30, 41, 59, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>Replies</h2>
                      <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>Latest responses for this notice</p>
                    </div>
                    <button
                      onClick={closeRepliesModal}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X style={{ width: '22px', height: '22px' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(repliesModal.notice.replies || []).map((reply) => (
                      <div
                        key={reply.id}
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          padding: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>Reply</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(reply.reply_datetime || reply.replyDatetime || reply.created_at || reply.createdAt)}</span>
                        </div>
                        <div style={{ color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>{reply.reply_text || reply.replyText || reply.text}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeRepliesModal}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#111827',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

        </div>
    );
};

export default CEONoticeContent;