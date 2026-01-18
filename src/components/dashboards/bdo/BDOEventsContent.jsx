import React, { useState, useEffect } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, Loader2, Edit, Trash2 } from 'lucide-react';
import { eventsAPI } from '../../../services/api';
import NoDataFound from '../common/NoDataFound';

const BDOEventsContent = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('Details');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventFilter, setEventFilter] = useState('active'); // 'active', 'inactive', 'all'
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fromDate: '',
        toDate: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitProgress, setSubmitProgress] = useState('');
    
    // Edit event state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        active: true
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDateKeyDown = (event) => {
        if (event.key !== 'Tab') {
            event.preventDefault();
        }
    };

    // Fetch events data on component mount and when filter changes
    useEffect(() => {
        fetchEvents();
    }, [eventFilter]);

    // Close modals if selected event is no longer in the filtered list
    useEffect(() => {
        if (selectedEvent && !loading) {
            const eventStillVisible = events.some(e => e.id === selectedEvent.id);
            if (!eventStillVisible) {
                // Event is no longer visible (likely disabled and filtered out)
                setShowEditModal(false);
                setShowDetailsModal(false);
                setSelectedEvent(null);
            }
        }
    }, [events, selectedEvent, loading]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch events based on filter - use API filtering when possible, but always apply client-side filtering as backup
            let eventsData = [];
            
            if (eventFilter === 'all') {
                // For 'all', fetch both active and inactive separately to ensure we get everything
                const [activeResponse, inactiveResponse] = await Promise.all([
                    eventsAPI.getEvents({ skip: 0, limit: 100, active: true }),
                    eventsAPI.getEvents({ skip: 0, limit: 100, active: false })
                ]);
                const activeEvents = activeResponse.data || [];
                const inactiveEvents = inactiveResponse.data || [];
                // Merge and deduplicate by event ID to prevent duplicates
                const eventsMap = new Map();
                [...activeEvents, ...inactiveEvents].forEach(event => {
                    if (event.id && !eventsMap.has(event.id)) {
                        eventsMap.set(event.id, event);
                    }
                });
                eventsData = Array.from(eventsMap.values());
            } else {
                // For 'active' or 'inactive', fetch with the appropriate parameter
                const activeParam = eventFilter === 'active' ? true : false;
                const response = await eventsAPI.getEvents({ skip: 0, limit: 100, active: activeParam });
                eventsData = response.data || [];
            }
            
            console.log('Fetched events data:', eventsData);
            
            // Apply client-side filtering to ensure correct display (backup safety check)
            let filteredEvents = eventsData;
            if (eventFilter === 'active') {
                filteredEvents = eventsData.filter(event => event.active === true);
            } else if (eventFilter === 'inactive') {
                filteredEvents = eventsData.filter(event => event.active === false);
            }
            // 'all' filter: show all events (no additional filtering needed)
            
            setEvents(filteredEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Helper function to format date range
    const formatDateRange = (startTime, endTime) => {
        const start = formatDate(startTime);
        const end = formatDate(endTime);
        if (start === end) return start;
        return `${start} - ${end}`;
    };

    // Helper function to truncate text
    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Helper function to get event image
    const getEventImage = (event) => {
        console.log('Event data for image:', event);
        if (event.media && event.media.length > 0) {
            const mediaUrl = `http://139.59.34.99:8000/api/v1/public/media/${encodeURIComponent(event.media[0].media_url)}`;
            console.log('Generated media URL:', mediaUrl);
            
            // Test if the URL is accessible
            fetch(mediaUrl, { method: 'HEAD' })
                .then(response => {
                    console.log('Media URL accessibility test:', response.status, response.ok);
                })
                .catch(error => {
                    console.log('Media URL accessibility test failed:', error);
                });
            
            return mediaUrl;
        }
        console.log('No media found, using fallback');
        return '/background.png'; // Fallback to placeholder
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    // Handle form submission with seamless two-step API flow
    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setSubmitProgress('Creating event...');

        try {
            // Step 1: Create the event
            const eventPayload = {
                name: formData.title,
                description: formData.description,
                start_time: formData.fromDate ? new Date(formData.fromDate).toISOString() : new Date().toISOString(),
                end_time: formData.toDate ? new Date(formData.toDate).toISOString() : new Date().toISOString(),
            };

            const createResponse = await eventsAPI.createEvent(eventPayload);
            const createdEvent = createResponse.data;

            // Step 2: Upload media if file is selected
            if (selectedFile) {
                setSubmitProgress('Uploading media...');
                console.log('Uploading media for event ID:', createdEvent.id, 'File:', selectedFile);
                const uploadResponse = await eventsAPI.uploadEventMedia(createdEvent.id, selectedFile);
                console.log('Media upload response:', uploadResponse.data);
            }

            // Success - close modal and refresh events
            setSubmitProgress('Event created successfully!');
            setTimeout(() => {
                setShowModal(false);
                setFormData({ title: '', description: '', fromDate: '', toDate: '' });
                setSelectedFile(null);
                setIsSubmitting(false);
                setSubmitProgress('');
                fetchEvents(); // Refresh the events list
            }, 1000);

        } catch (error) {
            console.error('Error creating event:', error);
            setSubmitProgress('');
            setIsSubmitting(false);
            alert('Failed to create event. Please try again.');
        }
    };

    // Handle edit button click
    const handleEditClick = (event) => {
        setSelectedEvent(event);
        setEditFormData({
            name: event.name || '',
            description: event.description || '',
            start_time: event.start_time || '',
            end_time: event.end_time || '',
            active: event.active !== undefined ? event.active : true
        });
        setShowEditModal(true);
    };

    const handleDeleteEvent = async (eventId) => {
        if (!eventId || isDeleting) return;
        const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
        if (!confirmDelete) {
            return;
        }

        try {
            setIsDeleting(true);
            await eventsAPI.deleteEvent(eventId);
            setShowDetailsModal(false);
            setSelectedEvent(null);
            await fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle event update
    const handleUpdateEvent = async () => {
        if (!editFormData.name.trim() || !editFormData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsUpdating(true);

        try {
            const updatePayload = {
                name: editFormData.name,
                description: editFormData.description,
                start_time: editFormData.start_time,
                end_time: editFormData.end_time,
                active: editFormData.active
            };

            await eventsAPI.updateEvent(selectedEvent.id, updatePayload);
            
            // If event is set to inactive, switch filter to "All" so user can see it as inactive
            if (!editFormData.active && eventFilter === 'active') {
                setEventFilter('all');
            }
            
            // Close modal and refresh
            setShowEditModal(false);
            setIsUpdating(false);
            fetchEvents(); // Refresh events
        } catch (error) {
            console.error('Error updating event:', error);
            setIsUpdating(false);
            alert('Failed to update event. Please try again.');
        }
    };

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
                        Events
                    </h1>
                </div>
            </div>

            {/* Overview Section */}
            <div style={{
                 backgroundColor: 'white',
                 padding: '24px',
                 marginLeft: '16px',
                 marginRight: '16px',
                 marginTop: '16px',
                 borderRadius: '8px',
                 border: '1px solid lightgray'
            }}>

                {/* Overview Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Overview
                            <span style={{
                                fontSize: '16px',
                                fontWeight: '400',
                                color: '#6b7280'
                            }}>
                                {events.length.toString().padStart(2, '0')}
                            </span>
                        </h2>

                    </div>
                    {/* Right side - Filter and Add Event button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Event Filter Toggle */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            padding: '2px',
                            gap: '2px'
                        }}>
                            <button
                                onClick={() => setEventFilter('active')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    backgroundColor: eventFilter === 'active' ? '#10b981' : 'transparent',
                                    color: eventFilter === 'active' ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setEventFilter('inactive')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    backgroundColor: eventFilter === 'inactive' ? '#ef4444' : 'transparent',
                                    color: eventFilter === 'inactive' ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Inactive
                            </button>
                            <button
                                onClick={() => setEventFilter('all')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    backgroundColor: eventFilter === 'all' ? '#3b82f6' : 'transparent',
                                    color: eventFilter === 'all' ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All
                            </button>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}>
                            <Plus style={{ width: '16px', height: '16px' }} />
                            Add Event
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        marginTop: '24px'
                    }}>
                        <Loader2 style={{ width: '32px', height: '32px', color: '#10b981', animation: 'spin 1s linear infinite' }} />
                        <span style={{ marginLeft: '12px', color: '#6b7280' }}>Loading events...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{ marginTop: '24px' }}>
                        <NoDataFound size="medium" />
                    </div>
                )}

                {/* Event Cards Grid */}
                {!loading && !error && (
                <div style={{
                    display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginTop: '24px'
                }}>
                        {events.map((event) => (
                    <div
                                key={event.id}
                        onClick={() => {
                                    setSelectedEvent(event);
                            setShowDetailsModal(true);
                            setActiveTab('Details');
                        }}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                                    minHeight: '250px',
                                    '&:hover': {
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                        <div style={{
                            height: '160px',
                                    marginBottom: '8px',
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={getEventImage(event)}
                                        alt={event.name || 'Event image'}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                        onError={(e) => {
                                            console.log('Image failed to load:', getEventImage(event));
                                            e.target.src = '/background.png';
                                        }}
                                        onLoad={() => {
                                            console.log('Image loaded successfully:', getEventImage(event));
                                        }}
                                    />
                                <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        backgroundColor: event.active ? '#10b981' : '#ef4444',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>
                                        {event.active ? 'Active' : 'Inactive'}
                                </div>
                                    {/* Media count indicator if multiple images */}
                                    {event.media && event.media.length > 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            right: '12px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                fontWeight: '500'
                            }}>
                                            +{event.media.length - 1} more
                        </div>
                                    )}
                    </div>
                                <div style={{ padding: '16px' }}>
                            {/* Title and Date Range in same row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '8px',
                                minWidth: 0
                            }}>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0,
                                    lineHeight: '1.4',
                                    flex: 1,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                            {event.name || 'Untitled Event'}
                                </h3>
                                {/* Date Range Display */}
                                <div style={{
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                            padding: '6px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    flexShrink: 0
                                }}>
                                    <Calendar style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: '500'
                                    }}>
                                                {formatDateRange(event.start_time, event.end_time)}
                                    </span>
                                </div>
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                margin: 0,
                                        lineHeight: '1.5'
                            }}>
                                        {truncateText(event.description, 80)}
                            </p>
                        </div>
                    </div>
                        ))}
                    </div>
                )}

                {/* No Events State */}
                {!loading && !error && events.length === 0 && (
                    <div style={{
                        marginTop: '24px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                    }}><NoDataFound size="large" />
                    </div>
                )}
                {/* Add Event Modal */}
                {showModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            width: '500px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h2 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    Add Event
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        color: '#6b7280'
                                    }}
                                >
                                    <X style={{ width: '20px', height: '20px' }} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '24px' }}>
                                {/* Image Upload Area */}
                                <div style={{
                                    border: '2px dashed #d1d5db',
                                    borderRadius: '8px',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: selectedFile ? '#f0f9ff' : 'transparent',
                                    borderColor: selectedFile ? '#10b981' : '#d1d5db'
                                }}
                                onClick={() => document.getElementById('fileInput').click()}>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <Upload style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        color: selectedFile ? '#10b981' : '#9ca3af', 
                                        margin: '0 auto 12px' 
                                    }} />
                                    <p style={{
                                        fontSize: '14px',
                                        color: selectedFile ? '#10b981' : '#6b7280',
                                        margin: 0
                                    }}>
                                        {selectedFile ? selectedFile.name : 'Drag and drop your image or click to upload'}
                                    </p>
                                    {selectedFile && (
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#10b981',
                                            margin: '8px 0 0 0'
                                        }}>
                                            ✓ File selected
                                        </p>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Title Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            Event Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter event title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Description Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Event description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* From & To Date Fields */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#374151',
                                                marginBottom: '8px'
                                            }}>
                                                From
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="date"
                                                    placeholder="From"
                                                    value={formData.fromDate || ''}
                                                    onKeyDown={handleDateKeyDown}
                                                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        paddingRight: '40px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        outline: 'none'
                                                    }}
                                                />
                                              
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#374151',
                                                marginBottom: '8px'
                                            }}>
                                                To
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="date"
                                                    placeholder="To"
                                                    value={formData.toDate || ''}
                                                    onKeyDown={handleDateKeyDown}
                                                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        paddingRight: '40px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        outline: 'none'
                                                    }}
                                                />
                                              
                                            </div>
                                        </div>
                                    </div>






                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                {/* Progress indicator */}
                                {isSubmitting && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#10b981',
                                        fontSize: '14px'
                                    }}>
                                        <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                        {submitProgress}
                                    </div>
                                )}
                                
                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                                <button
                                        onClick={() => {
                                            if (!isSubmitting) {
                                                setShowModal(false);
                                                setFormData({ title: '', description: '', fromDate: '', toDate: '' });
                                                setSelectedFile(null);
                                            }
                                        }}
                                        disabled={isSubmitting}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                            backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                    }}
                                >
                                        {isSubmitting && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                        {isSubmitting ? 'Creating...' : 'Add Event'}
                                </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {showDetailsModal && selectedEvent && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            width: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '10px',
                                paddingBottom: '5px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedEvent?.name || 'Event Details'}
                                </h2>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {/* Comment edit delete buttons */}
                                    {/* <button
                                        onClick={() => handleEditClick(selectedEvent)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            border: '1px solid #10b981',
                                            borderRadius: '6px',
                                            backgroundColor: 'transparent',
                                            color: '#10b981',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Edit style={{ width: '16px', height: '16px' }} />
                                        Edit Event
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(selectedEvent?.id)}
                                        disabled={isDeleting}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            border: '1px solid #ef4444',
                                            borderRadius: '6px',
                                            backgroundColor: isDeleting ? '#fecaca' : 'transparent',
                                            color: '#ef4444',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isDeleting ? (
                                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                            <Trash2 style={{ width: '16px', height: '16px' }} />
                                        )}
                                        {isDeleting ? 'Deleting...' : 'Delete Event'}
                                    </button> */}
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            color: '#6b7280'
                                        }}
                                    >
                                        <X style={{ width: '20px', height: '20px' }} />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div style={{
                                display: 'flex',
                            }}>
                                {['Details'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '10px 20px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: activeTab === tab ? '600' : '400',
                                            color: activeTab === tab ? '#111827' : '#6b7280',
                                            borderBottom: activeTab === tab ? '2px solid #10b981' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                           

                            {/* Tab Content */}
                            <div style={{ padding: '24px' }}>
                                {activeTab === 'Details' && (
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            color: '#374151',
                                            margin: '0 0 16px 0'
                                        }}>
                                            {selectedEvent?.description || 'No description available.'}
                                        </p>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '16px',
                                            marginTop: '20px'
                                        }}>
                                           
                                          
                                          
                                        </div>
                                    </div>
                                )}

                               
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Event Modal */}
                {showEditModal && selectedEvent && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            width: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h2 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    Edit Event
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        color: '#6b7280'
                                    }}
                                >
                                    <X style={{ width: '20px', height: '20px' }} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Name Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            Event Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter event name"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Description Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Description"
                                            value={editFormData.description}
                                            onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                            rows={4}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    {/* Start Time Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={editFormData.start_time ? new Date(editFormData.start_time).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => setEditFormData({...editFormData, start_time: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* End Time Field */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '8px'
                                        }}>
                                            End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={editFormData.end_time ? new Date(editFormData.end_time).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => setEditFormData({...editFormData, end_time: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Active Status Field */}
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={editFormData.active}
                                                onChange={(e) => setEditFormData({...editFormData, active: e.target.checked})}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                padding: '20px 24px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={isUpdating}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                                        opacity: isUpdating ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateEvent}
                                    disabled={isUpdating}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        backgroundColor: isUpdating ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isUpdating && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                                    {isUpdating ? 'Updating...' : 'Update Event'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BDOEventsContent;