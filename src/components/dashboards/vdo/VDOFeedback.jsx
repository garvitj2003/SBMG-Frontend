import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Search, X, ChevronDown, Star } from 'lucide-react';
import Chart from 'react-apexcharts';
import { feedbackAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import { InfoTooltip } from '../../common/Tooltip';

const VDOFeedbackContent = () => {
  const { user } = useAuth();
  const { getLocationPath } = useVDOLocation() || {};
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // Feedbacks list state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [feedbacksError, setFeedbacksError] = useState(null);
  
  // User's own feedback state
  const [myFeedback, setMyFeedback] = useState(null);
  const [loadingMyFeedback, setLoadingMyFeedback] = useState(true); // Start as true to show initial loading
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Emoji ratings
  const emojiRatings = [
    { value: 1, emoji: '😢' },
    { value: 2, emoji: '😞' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😄' }
  ];

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError(null);
        const response = await feedbackAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching feedback stats:', error);
        setStatsError(error.response?.data?.detail || 'Failed to load statistics');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch user's own feedback on component mount - this determines if user can give new review or must update existing
  useEffect(() => {
    const fetchMyFeedback = async () => {
      try {
        setLoadingMyFeedback(true);
        console.log('🔍 Fetching user feedback on page load...');
        const response = await feedbackAPI.getMyFeedback();
        if (response.data) {
          console.log('✅ User has existing feedback:', response.data);
          setMyFeedback(response.data);
        } else {
          console.log('ℹ️ User does not have feedback yet');
          setMyFeedback(null);
        }
      } catch (error) {
        // If 404, user doesn't have feedback yet - this is expected for new users
        if (error.response?.status === 404) {
          console.log('ℹ️ User does not have feedback yet (404)');
          setMyFeedback(null);
        } else {
          console.error('❌ Error fetching my feedback:', error);
          // Don't set to null on other errors, keep current state
        }
      } finally {
        setLoadingMyFeedback(false);
      }
    };

    // Fetch immediately when component mounts
    fetchMyFeedback();
  }, []);

  // Fetch feedbacks list
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoadingFeedbacks(true);
        setFeedbacksError(null);
        
        // Fetch all feedbacks using pagination (max 999 per request)
        let allFeedbacks = [];
        let skip = 0;
        const limit = 999; // API max is 999
        let hasMore = true;
        
        while (hasMore) {
          const params = {
            skip,
            limit
          };
          
          // Map user filter to feedback_source
          if (userFilter === 'AUTH_USER') {
            params.feedback_source = 'AUTH_USER';
          } else if (userFilter === 'PUBLIC_USER') {
            params.feedback_source = 'PUBLIC_USER';
          }
          // If 'All', don't add feedback_source filter
          
          const response = await feedbackAPI.getFeedbacks(params);
          const fetchedFeedbacks = response.data || [];
          allFeedbacks = [...allFeedbacks, ...fetchedFeedbacks];
          
          // If we got fewer than the limit, we've reached the end
          if (fetchedFeedbacks.length < limit) {
            hasMore = false;
          } else {
            skip += limit;
          }
        }
        
        setFeedbacks(allFeedbacks);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        setFeedbacksError(error.response?.data?.detail || 'Failed to load feedbacks');
      } finally {
        setLoadingFeedbacks(false);
      }
    };

    fetchFeedbacks();
  }, [userFilter]);

  // Pre-fill modal when opening if user has feedback
  useEffect(() => {
    if (showReviewModal && myFeedback) {
      setSelectedRating(myFeedback.rating || 5);
      setFeedback(myFeedback.comment || '');
      setLoadingMyFeedback(false);
    } else if (showReviewModal && !myFeedback) {
      // Only reset if we're sure user doesn't have feedback
      setSelectedRating(5);
      setFeedback('');
      setLoadingMyFeedback(false);
    }
  }, [showReviewModal, myFeedback]);

  // Calculate rating distribution from feedbacks
  const ratingDistribution = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) {
      return [
        { label: '5 Star', value: 0, color: '#10B981' },
        { label: '4 Star', value: 0, color: '#34D399' },
        { label: '3 Star', value: 0, color: '#FBBF24' },
        { label: '2 Star', value: 0, color: '#F97316' },
        { label: '1 Star', value: 0, color: '#EF4444' }
      ];
    }

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(fb => {
      if (fb.rating >= 1 && fb.rating <= 5) {
        ratingCounts[fb.rating]++;
      }
    });

    const total = feedbacks.length;
    const colors = {
      5: '#10B981',
      4: '#34D399',
      3: '#FBBF24',
      2: '#F97316',
      1: '#EF4444'
    };

    return [5, 4, 3, 2, 1].map(rating => ({
      label: `${rating} Star`,
      value: total > 0 ? Math.round((ratingCounts[rating] / total) * 100) : 0,
      color: colors[rating]
    }));
  }, [feedbacks]);

  // Calculate role distribution from feedbacks
  const roleDistribution = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) {
      return [
        { label: 'Authority Users', value: 0, color: '#0D9488' },
        { label: 'Public Users', value: 0, color: '#14B8A6' }
      ];
    }

    let authUserCount = 0;
    let publicUserCount = 0;

    feedbacks.forEach(fb => {
      if (fb.auth_user_id) {
        authUserCount++;
      } else if (fb.public_user_id) {
        publicUserCount++;
      }
    });

    const total = feedbacks.length;
    const colors = {
      auth: '#0D9488',
      public: '#14B8A6'
    };

    return [
      {
        label: 'Authority Users',
        value: total > 0 ? Math.round((authUserCount / total) * 100) : 0,
        color: colors.auth
      },
      {
        label: 'Public Users',
        value: total > 0 ? Math.round((publicUserCount / total) * 100) : 0,
        color: colors.public
      }
    ];
  }, [feedbacks]);

  // Filter reviews based on search query
  const filteredReviews = useMemo(() => {
    if (!feedbacks) return [];
    
    let filtered = feedbacks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fb => 
        (fb.comment && fb.comment.toLowerCase().includes(query)) ||
        (fb.id && fb.id.toString().includes(query))
      );
    }
    
    return filtered;
  }, [feedbacks, searchQuery]);

  const handleOpenModal = () => {
    // Pre-fill form if user already has feedback
    if (myFeedback) {
      setSelectedRating(myFeedback.rating || 5);
      setFeedback(myFeedback.comment || '');
    } else {
      setSelectedRating(5);
      setFeedback('');
    }
    setShowReviewModal(true);
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
    // Don't reset myFeedback - we want to keep it for the button text
    // Only reset form fields if user doesn't have feedback
    if (!myFeedback) {
      setFeedback('');
      setSelectedRating(5);
    }
  };

  const handleSaveReview = async () => {
    if (!feedback.trim()) {
      alert('Please enter your feedback');
      return;
    }

    try {
      setSavingFeedback(true);
      
      // If user already has feedback, always update it (users can only have one feedback)
      if (myFeedback) {
        // Update existing feedback using PUT
        const response = await feedbackAPI.updateMyFeedback({
          comment: feedback,
          rating: selectedRating
        });
        // Update local state with the updated feedback
        setMyFeedback(response.data);
      } else {
        // Create new feedback (only if user doesn't have one yet)
        try {
          const response = await feedbackAPI.createFeedback({
            comment: feedback,
            rating: selectedRating
          });
          // Update local state with the new feedback
          setMyFeedback(response.data);
        } catch (createError) {
          // If user already has feedback but we didn't know about it
          if (createError.response?.status === 400 && 
              (createError.response?.data?.message?.includes('already exists') ||
               createError.response?.data?.detail?.includes('already exists'))) {
            // Fetch the user's existing feedback
            const existingFeedbackResponse = await feedbackAPI.getMyFeedback();
            setMyFeedback(existingFeedbackResponse.data);
            
            // Update the existing feedback instead
            const response = await feedbackAPI.updateMyFeedback({
              comment: feedback,
              rating: selectedRating
            });
            setMyFeedback(response.data);
            
            alert('You already have a review. Your review has been updated.');
          } else {
            throw createError; // Re-throw if it's a different error
          }
        }
      }

      // Refresh stats
      const statsResponse = await feedbackAPI.getStats();
      setStats(statsResponse.data);
      
      // Refresh feedbacks using pagination
      let allFeedbacks = [];
      let skip = 0;
      const limit = 999; // API max is 999
      let hasMore = true;
      
      while (hasMore) {
        const params = {
          skip,
          limit
        };
        
        // Apply current filter
        if (userFilter === 'AUTH_USER') {
          params.feedback_source = 'AUTH_USER';
        } else if (userFilter === 'PUBLIC_USER') {
          params.feedback_source = 'PUBLIC_USER';
        }
        
        const feedbacksResponse = await feedbackAPI.getFeedbacks(params);
        const fetchedFeedbacks = feedbacksResponse.data || [];
        allFeedbacks = [...allFeedbacks, ...fetchedFeedbacks];
        
        if (fetchedFeedbacks.length < limit) {
          hasMore = false;
        } else {
          skip += limit;
        }
      }
      
      setFeedbacks(allFeedbacks);
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving feedback:', error);
      // Check if error message indicates feedback already exists
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || '';
      if (errorMessage.includes('already exists') || errorMessage.includes('Feedback already exists')) {
        // Try to fetch existing feedback and show appropriate message
        try {
          const existingFeedbackResponse = await feedbackAPI.getMyFeedback();
          if (existingFeedbackResponse.data) {
            setMyFeedback(existingFeedbackResponse.data);
            setSelectedRating(existingFeedbackResponse.data.rating || 5);
            setFeedback(existingFeedbackResponse.data.comment || '');
            alert('You have already submitted a review. Please update your existing review instead of creating a new one.');
          } else {
            alert('You have already submitted a review. Please refresh the page.');
          }
        } catch (fetchError) {
          alert('You have already submitted a review. Please refresh the page to update it.');
        }
      } else {
        alert(errorMessage || 'Failed to save feedback. Please try again.');
      }
    } finally {
      setSavingFeedback(false);
    }
  };

  // Chart options for rating distribution
  const ratingChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    labels: ratingDistribution.map(r => r.label),
    colors: ratingDistribution.map(r => r.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`
      }
    }
  };

  const ratingChartSeries = ratingDistribution.map(r => r.value);

  // Chart options for role distribution
  const roleChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    labels: roleDistribution.map(r => r.label),
    colors: roleDistribution.map(r => r.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`
      }
    }
  };

  const roleChartSeries = roleDistribution.map(r => r.value);

  // Get display name for feedback
  const getFeedbackDisplayName = (feedbackItem) => {
    if (feedbackItem.auth_user_id) {
      return `User #${feedbackItem.auth_user_id}`;
    } else if (feedbackItem.public_user_id) {
      return `Public User #${feedbackItem.public_user_id}`;
    }
    return 'Unknown User';
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
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        {/* Left side - Dashboard title */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Feedback
          </h1>
        </div>
      </div>

      {/* Title Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', marginLeft: '16px', marginRight: '16px' }}>
        <div>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>{getLocationPath ? getLocationPath() : 'Rajasthan / All'}</p>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={loadingMyFeedback}
          style={{
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loadingMyFeedback ? 'wait' : 'pointer',
            opacity: loadingMyFeedback ? 0.6 : 1
          }}
        >
          {loadingMyFeedback 
            ? 'Loading...' 
            : myFeedback 
              ? 'Change Review' 
              : 'Give Review'}
        </button>
      </div>

      {/* Overview Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px',
        marginLeft: '16px',
        marginRight: '16px'
      }}>
        {/* Overview Heading */}
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '24px' }}>
          Overview
        </h2>

        {loadingStats ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6B7280' }}>Loading statistics...</p>
          </div>
        ) : statsError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#EF4444' }}>{statsError}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Average Rating Card */}
            <div style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Average Rating</h3>
                <InfoTooltip
                  tooltipKey="AVERAGE_RATING"
                  size={16}
                  color="#9CA3AF"
                />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                {stats?.average_rating?.toFixed(1) || '0.0'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                <div style={{ flex: '0 0 auto' }}>
                  <Chart
                    options={ratingChartOptions}
                    series={ratingChartSeries}
                    type="donut"
                    height={250}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
                  {ratingDistribution.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Ratings Card */}
            <div style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Total Ratings</h3>
                <InfoTooltip
                  tooltipKey="TOTAL_RATINGS"
                  size={16}
                  color="#9CA3AF"
                />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                {stats?.total_feedback?.toLocaleString() || '0'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                <div style={{ flex: '0 0 auto' }}>
                  <Chart
                    options={roleChartOptions}
                    series={roleChartSeries}
                    type="donut"
                    height={250}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
                  {roleDistribution.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginLeft: '16px',
        marginRight: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Reviews</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                style={{
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>
            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{
                  padding: '8px 32px 8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none'
                }}
              >
                <option value="All">All</option>
                <option value="AUTH_USER">Authority Users</option>
                <option value="PUBLIC_USER">Public Users</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
            </div>
          </div>
        </div>

        {/* Table */}
        {loadingFeedbacks ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6B7280' }}>Loading reviews...</p>
          </div>
        ) : feedbacksError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#EF4444' }}>{feedbacksError}</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6B7280' }}>No reviews found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      User
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Review
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Rating
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                        <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                      {getFeedbackDisplayName(review)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                      {review.comment || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                      {review.rating} Star
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={handleCloseModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {myFeedback ? 'Change Review' : 'My Review'}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={savingFeedback}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: savingFeedback ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  opacity: savingFeedback ? 0.5 : 1
                }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>

            {loadingMyFeedback ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#6B7280' }}>Loading...</p>
              </div>
            ) : (
              <>
                {/* Question */}
                <p style={{ fontSize: '16px', color: '#111827', marginBottom: '20px' }}>
                  How was your experience with the app?
                </p>

                {/* Emoji Rating */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', justifyContent: 'center' }}>
                  {emojiRatings.map((emoji) => (
                    <button
                      key={emoji.value}
                      onClick={() => setSelectedRating(emoji.value)}
                      disabled={savingFeedback}
                      style={{
                        fontSize: '48px',
                        background: 'none',
                        border: 'none',
                        cursor: savingFeedback ? 'not-allowed' : 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        transform: selectedRating === emoji.value ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.2s',
                        filter: selectedRating === emoji.value ? 'brightness(1.2)' : 'brightness(1)',
                        boxShadow: selectedRating === emoji.value ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                        opacity: savingFeedback ? 0.5 : 1
                      }}
                    >
                      {emoji.emoji}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', marginBottom: '24px' }}>
                  {selectedRating} Star
                </p>

                {/* Feedback Input */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                    Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your feedback"
                    maxLength={100}
                    disabled={savingFeedback}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      opacity: savingFeedback ? 0.5 : 1,
                      cursor: savingFeedback ? 'not-allowed' : 'text'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>
                    {feedback.length}/100
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={handleCloseModal}
                    disabled={savingFeedback}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: savingFeedback ? 'not-allowed' : 'pointer',
                      opacity: savingFeedback ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReview}
                    disabled={savingFeedback}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: savingFeedback ? '#9CA3AF' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: savingFeedback ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingFeedback ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VDOFeedbackContent;
